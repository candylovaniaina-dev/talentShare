import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

// Coordonnées approximatives par ville — zone, pas adresse précise (conforme au cahier des charges)
const CITY_COORDS = {
  "Antananarivo": [-18.8792, 47.5079],
  "Toamasina": [-18.1492, 49.4023],
  "Fianarantsoa": [-21.4536, 47.0857],
  "Mahajanga": [-15.7167, 46.3167],
  "Antsirabe": [-19.8667, 47.0333],
  "Toliara": [-23.35, 43.6667],
  "Paris": [48.8566, 2.3522],
  "Lyon": [45.7640, 4.8357],
};

export default function ExploreMap({ profiles }) {
  const cityCounts = {};
  profiles.forEach((p) => {
    if (p.city && CITY_COORDS[p.city]) {
      cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    }
  });

  const center = CITY_COORDS["Antananarivo"];

  return (
    <div className="overflow-hidden rounded-2xl">
      <MapContainer center={center} zoom={5} style={{ height: "260px", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(cityCounts).map(([city, count]) => (
          <CircleMarker key={city} center={CITY_COORDS[city]} radius={8 + count * 2} pathOptions={{ color: "#6EE7C8", fillColor: "#6EE7C8", fillOpacity: 0.6 }}>
            <Tooltip>{city} · {count} profil{count > 1 ? "s" : ""}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}