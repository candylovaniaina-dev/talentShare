import React from "react";
import { MapPin } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

export default function BoldTheme({ portfolio, profile, accent }) {
  return (
    <div className="min-h-screen bg-[#0B1633] font-sans text-white">
      <div className="mx-auto max-w-4xl px-6 py-20">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {profile?.avatar ? (
            <img src={`http://localhost:8000/storage/${profile.avatar}`} className="h-28 w-28 rounded-full object-cover ring-4" style={{ boxShadow: `0 0 0 4px ${accent}` }} />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold" style={{ backgroundColor: accent + "33" }}>
              {profile?.name?.charAt(0) || "?"}
            </div>
          )}
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight">{profile?.name}</h1>
          <p className="mt-3 text-xl font-semibold" style={{ color: accent }}>{profile?.headline}</p>
          {profile?.city && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} />{profile.city}, {profile.country}
            </p>
          )}
          {profile?.bio && <p className="mt-6 max-w-xl text-slate-300">{profile.bio}</p>}
        </div>

        {/* ✅ TOUT LE CONTENU */}
        <div className="mt-16">
          <PortfolioContent profile={profile} accent={accent} variant="dark" />
        </div>
      </div>
    </div>
  );
}