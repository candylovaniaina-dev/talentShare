
import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import { MapPin, Users, MapPinned } from "lucide-react";

const CITY_COORDS = {
  Antananarivo: [-18.8792, 47.5079],
  Toamasina: [-18.1492, 49.4023],
  Fianarantsoa: [-21.4536, 47.0857],
  Mahajanga: [-15.7167, 46.3167],
  Antsirabe: [-19.8667, 47.0333],
  Toliara: [-23.35, 43.6667],
  Antsiranana: [-12.2795, 49.2913],
  Manakara: [-22.1333, 48.0167],
  Morondava: [-20.2833, 44.2833],
  Paris: [48.8566, 2.3522],
  Lyon: [45.764, 4.8357],
  Marseille: [43.2965, 5.3698],
  Maurice: [-20.3484, 57.5522],
};

export default function ExploreMap({ profiles }) {
  const cityCounts = useMemo(() => {
    const counts = {};

    (Array.isArray(profiles) ? profiles : []).forEach((profile) => {
      const city = profile?.city?.trim();

      if (city && CITY_COORDS[city]) {
        counts[city] = (counts[city] || 0) + 1;
      }
    });

    return counts;
  }, [profiles]);

  const citiesWithData = Object.keys(cityCounts);
  const hasData = citiesWithData.length > 0;
  const totalProfiles = citiesWithData.reduce(
    (total, city) => total + cityCounts[city],
    0
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FBF5] text-[#087F70]">
            <MapPinned size={20} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#12364D] sm:text-base">
              Répartition géographique
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Localisation approximative des profils
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-2 rounded-full bg-[#E8FBF5] px-3 py-1.5 text-xs font-semibold text-[#087F70]">
            <Users size={14} />
            {totalProfiles} profil{totalProfiles > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="relative">
        <MapContainer
          center={CITY_COORDS.Antananarivo}
          zoom={hasData ? 5 : 6}
          style={{ height: "280px", width: "100%" }}
          scrollWheelZoom={false}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {citiesWithData.map((city) => {
            const count = cityCounts[city];
            const radius = Math.min(17, 7 + Math.sqrt(count) * 2);

            return (
              <CircleMarker
                key={city}
                center={CITY_COORDS[city]}
                radius={radius}
                pathOptions={{
                  color: "#087F70",
                  fillColor: "#6EE7C8",
                  fillOpacity: 0.78,
                  weight: 2,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  className="talentshare-map-tooltip"
                >
                  <div className="px-1 py-0.5">
                    <p className="font-bold text-[#12364D]">{city}</p>
                    <p className="text-xs text-slate-500">
                      {count} profil{count > 1 ? "s" : ""}
                    </p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {!hasData && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 px-5 text-center backdrop-blur-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MapPin size={23} />
            </div>
            <p className="text-sm font-bold text-[#12364D]">
              Aucune localisation disponible
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
              Les profils sans ville reconnue ne sont pas affichés sur cette carte.
            </p>
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-[400] rounded-lg border border-slate-200/80 bg-white/95 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 shadow-sm">
          Zones approximatives · OpenStreetMap
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
        <span className="h-2 w-2 rounded-full bg-[#6EE7C8]" />
        <p className="text-xs text-slate-500">
          Les marqueurs indiquent le nombre de profils par ville.
        </p>
      </div>
    </section>
  );
}
