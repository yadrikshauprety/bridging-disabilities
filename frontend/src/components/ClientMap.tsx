import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// A custom accessible marker icon for PwDs
export const accessibleIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A component to recenter the map dynamically
function MapCenterer({ center, bounds }: { center: [number, number] | null, bounds: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(new L.LatLngBounds(bounds), { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 14);
    }
  }, [center, bounds, map]);
  return null;
}

interface ClientMapProps {
  mapCenter: [number, number];
  mapBounds: [number, number][] | null;
  userLocation: [number, number] | null;
  filteredPlaces: any[];
  selectedPlaceId: string | null;
  route: [number, number][] | null;
  onSelectPlace: (place: any) => void;
  onGetDirections: (lat: number, lng: number) => void;
}

export default function ClientMap({
  mapCenter,
  mapBounds,
  userLocation,
  filteredPlaces,
  selectedPlaceId,
  route,
  onSelectPlace,
  onGetDirections
}: ClientMapProps) {
  return (
    <MapContainer 
      center={mapCenter} 
      zoom={14} 
      scrollWheelZoom={true} 
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenterer center={mapCenter} bounds={mapBounds} />

      {/* User Location Marker */}
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
      )}

      {/* Place Markers */}
      {filteredPlaces.map((p) => (
         <Marker 
           key={p.id} 
           position={[p.lat, p.lng]} 
           icon={selectedPlaceId === p.id ? accessibleIcon : new L.Icon.Default()}
           eventHandlers={{
             click: () => onSelectPlace(p)
           }}
         >
           <Popup>
             <div className="text-center font-sans">
               <strong className="text-lg block mb-1">{p.name}</strong>
               <span className="text-xs text-muted-foreground block mb-2">{p.address}</span>
               <button 
                 className="bg-primary text-primary-foreground font-bold text-xs px-3 py-1.5 rounded-lg w-full hover:opacity-90"
                 onClick={(e) => {
                   e.stopPropagation();
                   onGetDirections(p.lat, p.lng);
                 }}
               >
                 📍 Get Directions
               </button>
             </div>
           </Popup>
         </Marker>
      ))}

      {/* Route Polyline */}
      {route && (
         <Polyline 
           positions={route} 
           color="var(--accent)" 
           weight={6} 
           opacity={0.8}
         />
      )}
    </MapContainer>
  );
}