import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = defaultIcon;

export default function Map({ points }) {
  if (!points || points.length === 0) return null;

  const center = points[Math.floor(points.length / 2)];
  const polylinePositions = points.map(p => [p.lat, p.lng]);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point, index) => (
        <Marker key={index} position={[point.lat, point.lng]}>
          <Popup>
            <div>
              <p><strong>#{index + 1}</strong></p>
              <p>Lat: {point.lat}</p>
              <p>Lng: {point.lng}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      <Polyline positions={polylinePositions} color="blue" />
    </MapContainer>
  );
}