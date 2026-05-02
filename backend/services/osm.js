export async function searchPlaces(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DisabilityBridge/1.0 (contact@disabilitybridge.org)' // Nominatim requires a valid user agent
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch from OSM');
  }

  const data = await response.json();
  return data.map(item => ({
    id: item.place_id.toString(),
    name: item.name || item.display_name.split(',')[0],
    address: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type || item.class
  }));
}

export async function getPlaceDetails(osmId) {
  const url = `https://nominatim.openstreetmap.org/details?place_id=${encodeURIComponent(osmId)}&format=json`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DisabilityBridge/1.0 (contact@disabilitybridge.org)'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch from OSM');
  }

  const item = await response.json();
  return {
    id: item.place_id.toString(),
    name: item.localname || item.names?.name || 'Unknown',
    address: item.addresstags ? Object.values(item.addresstags).join(', ') : '',
    lat: parseFloat(item.centroid.coordinates[1]),
    lng: parseFloat(item.centroid.coordinates[0]),
    type: item.category
  };
}
