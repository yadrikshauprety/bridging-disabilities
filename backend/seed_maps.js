import { getDb } from './db.js';
import crypto from 'crypto';

const MOCK_USERS = ["u1_ravi", "u2_priya", "u3_ramaiah", "u4_rahul", "u5_anita"];

// Realistic locations in Yelahanka and Bangalore
const LOCATIONS = [
  {
    id: "osm_nmit",
    name: "Nitte Meenakshi Institute of Technology (NMIT)",
    address: "P.B.No.6429, Yelahanka, Bangalore 560064",
    lat: 13.1259,
    lng: 77.5898,
    type: "university",
    reviews: [
      { ramp: 1, toilet: 1, braille: 0, audio: 1, parking: 1, comment: "Campus is largely accessible. Lifts in all main blocks." },
      { ramp: 1, toilet: 1, braille: 1, audio: 0, parking: 1, comment: "Good wheelchair access. Some braille signs added recently for the hackathon!" },
      { ramp: 1, toilet: null, braille: null, audio: null, parking: 1, comment: "Plenty of designated parking." }
    ]
  },
  {
    id: "osm_rmz",
    name: "RMZ Galleria Mall",
    address: "Ambedkar Colony, Yelahanka, Bengaluru",
    lat: 13.0976,
    lng: 77.5925,
    type: "mall",
    reviews: [
      { ramp: 1, toilet: 1, braille: 0, audio: 1, parking: 1, comment: "Very accessible modern mall. Dedicated lifts and spacious accessible toilets on every floor." },
      { ramp: 1, toilet: 1, braille: 0, audio: 1, parking: 1, comment: "Easy to navigate in a wheelchair." },
      { ramp: 1, toilet: 1, braille: 0, audio: 1, parking: 1, comment: "Great accessibility overall." },
      { ramp: 1, toilet: 1, braille: 1, audio: 0, parking: 1, comment: "Found some braille on the lift panels." }
    ]
  },
  {
    id: "osm_yel_hosp",
    name: "Yelahanka Government Hospital",
    address: "Old Town, Yelahanka, Bengaluru",
    lat: 13.1023,
    lng: 77.5982,
    type: "hospital",
    reviews: [
      { ramp: 1, toilet: 0, braille: 0, audio: 0, parking: 0, comment: "Ramp exists at the entrance but the angle is too steep. No accessible toilet inside." },
      { ramp: 1, toilet: 0, braille: 0, audio: 0, parking: null, comment: "Very crowded, hard to move around." },
      { ramp: 0, toilet: 0, braille: 0, audio: 0, parking: 0, comment: "Needs a lot of improvement for RPwD compliance." }
    ]
  },
  {
    id: "osm_yel_station",
    name: "Yelahanka Junction Railway Station",
    address: "Yelahanka New Town, Bengaluru",
    lat: 13.0967,
    lng: 77.5841,
    type: "transit",
    reviews: [
      { ramp: 1, toilet: 0, braille: 0, audio: 1, parking: 0, comment: "Audio announcements are clear but getting to platform 2 is difficult without a lift." },
      { ramp: 0, toilet: null, braille: 0, audio: 1, parking: 0, comment: "No lift or escalator working today." }
    ]
  },
  {
    id: "osm_mg_metro",
    name: "MG Road Metro Station",
    address: "Mahatma Gandhi Road, Bengaluru",
    lat: 12.9755,
    lng: 77.6068,
    type: "transit",
    reviews: [
      { ramp: 1, toilet: 1, braille: 1, audio: 1, parking: 0, comment: "Excellent accessibility. Tactile paths everywhere and lifts work perfectly. No parking though." },
      { ramp: 1, toilet: 1, braille: 1, audio: 1, parking: 0, comment: "Best public transport for visually impaired in the city." },
      { ramp: 1, toilet: 1, braille: 1, audio: 1, parking: null, comment: "Audio announcements are bilingual and clear." }
    ]
  },
  {
    id: "osm_nimhans",
    name: "NIMHANS Hospital",
    address: "Hosur Road, Lakkasandra, Bengaluru",
    lat: 12.9373,
    lng: 77.5950,
    type: "hospital",
    reviews: [
      { ramp: 1, toilet: 1, braille: 1, audio: 1, parking: 1, comment: "As a premier institute, their accessibility standards are very high." },
      { ramp: 1, toilet: 1, braille: 0, audio: 0, parking: 1, comment: "Very large campus, can be exhausting, but physically accessible." }
    ]
  },
  {
    id: "osm_truffles",
    name: "Truffles Cafe",
    address: "Koramangala 5th Block, Bengaluru",
    lat: 12.9332,
    lng: 77.6143,
    type: "restaurant",
    reviews: [
      { ramp: 1, toilet: 0, braille: 0, audio: 0, parking: 0, comment: "They put out a portable ramp if you ask, but the washroom is completely inaccessible." },
      { ramp: 0, toilet: 0, braille: 0, audio: 0, parking: 0, comment: "Tables are too close together for a wheelchair." },
      { ramp: 1, toilet: 0, braille: 0, audio: 0, parking: 0, comment: "Ramp is okay, but parking is a nightmare." }
    ]
  }
];

async function seed() {
  console.log("Starting map data seed for Bangalore & Yelahanka...");
  try {
    const db = await getDb();

    for (const loc of LOCATIONS) {
      console.log(`Seeding location: ${loc.name}`);
      
      // 1. Calculate aggregates based on our mock reviews
      let totalReviews = loc.reviews.length;
      let rampYes = 0, rampTot = 0;
      let toiletYes = 0, toiletTot = 0;
      let brailleYes = 0, brailleTot = 0;
      let audioYes = 0, audioTot = 0;
      let parkingYes = 0, parkingTot = 0;

      loc.reviews.forEach(r => {
        if (r.ramp !== null) { rampTot++; if (r.ramp === 1) rampYes++; }
        if (r.toilet !== null) { toiletTot++; if (r.toilet === 1) toiletYes++; }
        if (r.braille !== null) { brailleTot++; if (r.braille === 1) brailleYes++; }
        if (r.audio !== null) { audioTot++; if (r.audio === 1) audioYes++; }
        if (r.parking !== null) { parkingTot++; if (r.parking === 1) parkingYes++; }
      });

      // 2. Upsert the place
      await db.run(
        `INSERT OR REPLACE INTO places (
          id, name, address, lat, lng, type, totalReviews,
          rampYesVotes, rampTotalVotes,
          toiletYesVotes, toiletTotalVotes,
          brailleYesVotes, brailleTotalVotes,
          audioYesVotes, audioTotalVotes,
          parkingYesVotes, parkingTotalVotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          loc.id, loc.name, loc.address, loc.lat, loc.lng, loc.type, totalReviews,
          rampYes, rampTot,
          toiletYes, toiletTot,
          brailleYes, brailleTot,
          audioYes, audioTot,
          parkingYes, parkingTot
        ]
      );

      // 3. Clear old reviews for this place
      await db.run(`DELETE FROM accessibility_reviews WHERE placeId = ?`, [loc.id]);

      // 4. Insert new reviews
      for (let i = 0; i < loc.reviews.length; i++) {
        const review = loc.reviews[i];
        const reviewId = crypto.randomUUID();
        const userId = MOCK_USERS[i % MOCK_USERS.length]; // cycle through mock users

        await db.run(
          `INSERT INTO accessibility_reviews (
            id, placeId, userId, rampLift, accessibleToilet, brailleSignage, audioAnnouncements, parking, comments
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reviewId, loc.id, userId, 
            review.ramp, review.toilet, review.braille, review.audio, review.parking, review.comment
          ]
        );
      }
    }

    console.log("✅ Seeding complete! Database is populated with Yelahanka and Bangalore locations.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();