import React from "react";
import { MapPin } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

export default function MinimalTheme({ portfolio, profile, accent }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-navy">
      <div className="mx-auto max-w-3xl px-6 py-16">

        {/* Header */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-center gap-4">
            {profile?.avatar ? (
              <img src={`http://localhost:8000/storage/${profile.avatar}`} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold" style={{ backgroundColor: accent + "33" }}>
                {profile?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{profile?.name}</h1>
              <p className="mt-1" style={{ color: accent }}>{profile?.headline}</p>
              {profile?.city && (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin size={14} />{profile.city}, {profile.country}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold">À propos</h2>
            <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>
          </div>
        )}

        {/* ✅ TOUT LE CONTENU */}
        <div className="mt-6">
          <PortfolioContent profile={profile} accent={accent} variant="light" />
        </div>
      </div>
    </div>
  );
}