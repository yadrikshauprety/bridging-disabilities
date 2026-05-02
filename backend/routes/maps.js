import express from "express";
import { getDb } from "../db.js";
import { searchPlaces, getPlaceDetails } from "../services/osm.js";
import crypto from "crypto";

const router = express.Router();

// Helper function to calculate confidence percentage
const calculateConfidence = (yesVotes, totalVotes) => {
  if (totalVotes === 0) return null;
  return Math.round((yesVotes / totalVotes) * 100);
};

// Map DB place to frontend response format
const formatPlace = (place) => ({
  id: place.id,
  name: place.name,
  address: place.address,
  lat: place.lat,
  lng: place.lng,
  type: place.type,
  totalReviews: place.totalReviews,
  accessibility: {
    rampLift: calculateConfidence(place.rampYesVotes, place.rampTotalVotes),
    accessibleToilet: calculateConfidence(place.toiletYesVotes, place.toiletTotalVotes),
    brailleSignage: calculateConfidence(place.brailleYesVotes, place.brailleTotalVotes),
    audioAnnouncements: calculateConfidence(place.audioYesVotes, place.audioTotalVotes),
    parking: calculateConfidence(place.parkingYesVotes, place.parkingTotalVotes)
  }
});

// GET /api/maps/search?q=hospital
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const db = await getDb();

    // 1. Search our local database first
    const dbPlaces = await db.all(
      `SELECT * FROM places WHERE name LIKE ? OR address LIKE ?`,
      [`%${q}%`, `%${q}%`]
    );

    const dbResults = dbPlaces.map(formatPlace);
    
    // 2. Search OSM
    const osmResults = await searchPlaces(q);

    // 3. Fetch accessibility data for any OSM places that aren't in our local search results
    const existingIds = new Set(dbPlaces.map(p => p.id));
    const newOsmIds = osmResults.filter(r => !existingIds.has(r.id)).map(r => r.id);
    
    let additionalDbPlaces = [];
    if (newOsmIds.length > 0) {
      const placeholders = newOsmIds.map(() => "?").join(",");
      additionalDbPlaces = await db.all(`SELECT * FROM places WHERE id IN (${placeholders})`, newOsmIds);
    }

    const additionalDbPlacesMap = additionalDbPlaces.reduce((acc, place) => {
      acc[place.id] = formatPlace(place);
      return acc;
    }, {});

    // Merge OSM results
    const mergedOsmResults = osmResults
      .filter(osmPlace => !existingIds.has(osmPlace.id)) // don't duplicate local results
      .map((osmPlace) => {
        if (additionalDbPlacesMap[osmPlace.id]) {
          return additionalDbPlacesMap[osmPlace.id];
        }
        return {
          ...osmPlace,
          totalReviews: 0,
          accessibility: {
            rampLift: null,
            accessibleToilet: null,
            brailleSignage: null,
            audioAnnouncements: null,
            parking: null
          }
        };
      });

    // Combine local first, then OSM
    res.json([...dbResults, ...mergedOsmResults]);
  } catch (error) {
    console.error("Maps search error:", error);
    res.status(500).json({ error: "Failed to search places" });
  }
});

// GET /api/maps/places (for fetching all reviewed places, optionally within bounds)
router.get("/places", async (req, res) => {
  try {
    const db = await getDb();
    // Simplified: Just returning all places that have reviews for now.
    // In the future, bounds filtering (minLat, maxLat, minLng, maxLng) can be added here.
    const places = await db.all("SELECT * FROM places WHERE totalReviews > 0");
    const formattedPlaces = places.map(formatPlace);
    res.json(formattedPlaces);
  } catch (error) {
    console.error("Fetch places error:", error);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

// GET /api/maps/places/:id
router.get("/places/:id", async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    let place = await db.get("SELECT * FROM places WHERE id = ?", [id]);

    if (!place) {
      // If we don't have it, try to fetch details from OSM
      try {
        const osmDetails = await getPlaceDetails(id);
        place = {
          ...osmDetails,
          totalReviews: 0,
          rampYesVotes: 0, rampTotalVotes: 0,
          toiletYesVotes: 0, toiletTotalVotes: 0,
          brailleYesVotes: 0, brailleTotalVotes: 0,
          audioYesVotes: 0, audioTotalVotes: 0,
          parkingYesVotes: 0, parkingTotalVotes: 0
        };
      } catch (err) {
         return res.status(404).json({ error: "Place not found" });
      }
    }

    const reviews = await db.all(
      "SELECT * FROM accessibility_reviews WHERE placeId = ? ORDER BY timestamp DESC",
      [id]
    );

    res.json({
      place: place.id ? formatPlace(place) : place, // handle the mock place from OSM fallback
      reviews
    });
  } catch (error) {
    console.error("Fetch place error:", error);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});

// POST /api/maps/reviews
router.post("/reviews", async (req, res) => {
  try {
    const db = await getDb();
    const { placeId, userId, placeDetails, rampLift, accessibleToilet, brailleSignage, audioAnnouncements, parking, comments } = req.body;

    if (!placeId || !userId) {
      return res.status(400).json({ error: "placeId and userId are required" });
    }

    // 1. Ensure place exists in our DB
    const existingPlace = await db.get("SELECT id FROM places WHERE id = ?", [placeId]);
    if (!existingPlace) {
      // If we provided placeDetails (e.g. from an initial OSM search), use them
      if (placeDetails && placeDetails.name && placeDetails.lat !== undefined) {
         await db.run(
           `INSERT INTO places (id, name, address, lat, lng, type) VALUES (?, ?, ?, ?, ?, ?)`,
           [placeId, placeDetails.name, placeDetails.address || "", placeDetails.lat, placeDetails.lng, placeDetails.type || ""]
         );
      } else {
         return res.status(400).json({ error: "Place not found in database and placeDetails not provided." });
      }
    }

    // 2. Insert Review
    const reviewId = crypto.randomUUID();
    await db.run(
      `INSERT INTO accessibility_reviews (
        id, placeId, userId, rampLift, accessibleToilet, brailleSignage, audioAnnouncements, parking, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, placeId, userId, rampLift, accessibleToilet, brailleSignage, audioAnnouncements, parking, comments]
    );

    // 3. Update Place aggregates
    const updateStatements = [];
    const updateParams = [];

    const addVote = (field, vote) => {
      if (vote === 1 || vote === 0) {
        updateStatements.push(`${field}TotalVotes = ${field}TotalVotes + 1`);
        if (vote === 1) {
           updateStatements.push(`${field}YesVotes = ${field}YesVotes + 1`);
        }
      }
    };

    addVote("ramp", rampLift);
    addVote("toilet", accessibleToilet);
    addVote("braille", brailleSignage);
    addVote("audio", audioAnnouncements);
    addVote("parking", parking);

    updateStatements.push("totalReviews = totalReviews + 1");
    updateParams.push(placeId);

    const setQuery = updateStatements.join(", ");
    
    await db.run(`UPDATE places SET ${setQuery} WHERE id = ?`, updateParams);

    res.status(201).json({ message: "Review submitted successfully", reviewId });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
