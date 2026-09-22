import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin } from "lucide-react";

// Coordonnées approximatives par ville — zone, pas adresse précise (conforme au cahier des charges)
const CITY_COORDS = {
  "Antananarivo": [-18.8792, 47.5079],
  "Toamasina":    [-18.1492, 49.4023],
  "Fianarantsoa": [-21.4536, 47.0857],
  "Mahajanga":    [-15.7167, 46.3167],
  "Antsirabe":    [-19.8667, 47.0333],
  "Toliara":      [-23.35,   43.6667],
  "Antsiranana":  [-12.2795, 49.2913],
  "Manakara":     [-22.1333, 48.0167],
  "Morondava":    [-20.2833, 44.2833],
  "Paris":        [48.8566, 2.3522],
  "Lyon":         [45.7640, 4.8357],
  "Marseille":    [43.2965, 5.3698],
  "Maurice":      [-20.3484, 57.5522],
};

export default function ExploreMap({ profiles }) {
  // ✅ Sécurité : s'assurer que profiles est un tableau
  const safeProfiles = Array.isArray(profiles) ? profiles : [];

  // ✅ Grouper par ville
  const cityCounts = {};
  safeProfiles.forEach((p) => {
    const city = p.city?.trim();
    if (city && CITY_COORDS[city]) {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });

  const citiesWithData = Object.keys(cityCounts);
  const center = CITY_COORDS["Antananarivo"];
  const hasData = citiesWithData.length > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <MapContainer
        center={center}
        zoom={hasData ? 5 : 6}
        style={{ height: "260px", width: "100%" }}
        scrollWheelZoom={false}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {citiesWithData.map((city) => {
          const count = cityCounts[city];
          return (
            <CircleMarker
              key={city}
              center={CITY_COORDS[city]}
              radius={8 + count * 2}
              pathOptions={{
                color: "#6EE7C8",
                fillColor: "#6EE7C8",
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs font-semibold">
                  {city} · {count} profil{count > 1 ? "s" : ""}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ✅ Message si aucun point */}
      {!hasData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A1229]/80 backdrop-blur-sm z-10">
          <MapPin size={28} className="text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-slate-300">Aucune localisation disponible</p>
          <p className="text-xs text-slate-500 mt-1">Les profils sans ville renseignée n'apparaissent pas</p>
        </div>
      )}

      {/* ✅ Overlay attribution custom */}
      <div className="absolute bottom-2 right-2 z-10 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">
        Zones approximatives · OpenStreetMap
      </div>
    </div>
  );
}