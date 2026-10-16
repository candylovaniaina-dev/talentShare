import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Loader2 } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [-18.8792, 47.5079];

/* Force Leaflet à recalculer sa taille après le rendu */
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ open, onClose, onSelect, initialCity, initialCountry }) {
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (open && initialCity) {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${initialCity}, ${initialCountry || ""}`
        )}&limit=1`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data[0]) setMarker({ lat: +data[0].lat, lng: +data[0].lon });
        })
        .catch(() => {});
    }
  }, [open, initialCity, initialCountry]);

  const handlePick = async (lat, lng) => {
    setMarker({ lat, lng });
    setLoading(true);
    setAddress(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county ||
        "";
      const country = data.address?.country || "";
      setAddress({ city, country, full: data.display_name });
    } catch {
      setAddress(null);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (address) onSelect({ city: address.city, country: address.country });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/60 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EEF3] bg-[#F9FBFC] px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#0F9691]" />
            <p className="text-sm font-semibold text-[#0B1F33]">
              Choisir une localisation
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ✅ Carte grande, sans fond gris parasite */}
        <div
          className="relative overflow-hidden bg-[#E8EEF3]"
          style={{ height: "60vh", minHeight: 480, width: "100%" }}
        >
          <MapContainer
            center={marker ? [marker.lat, marker.lng] : DEFAULT_CENTER}
            zoom={7}
            minZoom={5}
            maxZoom={17}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            worldCopyJump={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ResizeFix />
            <ClickHandler onPick={handlePick} />
            {marker && <Marker position={[marker.lat, marker.lng]} />}
          </MapContainer>

          {/* Hint flottant, cache après sélection */}
          {!marker && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[400] -translate-x-1/2 rounded-full bg-[#0B1F33]/90 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur">
              👆 Clique sur la carte pour choisir ta ville
            </div>
          )}
        </div>

        {/* Adresse + boutons */}
        <div className="border-t border-[#E8EEF3] bg-white px-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#64788C]">
              <Loader2 size={14} className="animate-spin" />
              Recherche de l'adresse...
            </div>
          )}

          {!loading && address && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Localisation sélectionnée
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0B1F33]">
                {address.city || "Ville inconnue"}
                {address.country ? `, ${address.country}` : ""}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[#64788C]">
                {address.full}
              </p>
            </div>
          )}

          {!loading && !address && marker && (
            <p className="text-xs text-[#8A9BB0]">
              Aucune adresse trouvée à cet endroit. Essaie de cliquer plus près d'une ville.
            </p>
          )}

          {!loading && !address && !marker && (
            <p className="text-xs text-[#8A9BB0]">
              Clique sur la carte pour choisir ta ville et ton pays.
            </p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#E4EBF1] px-4 py-2 text-sm font-semibold text-[#334B63] transition hover:bg-[#F5F8FA]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!address}
              className="rounded-lg bg-[#16B8B1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F9691] disabled:opacity-50"
            >
              Utiliser cette adresse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}