import React from "react";
import { MapPin } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

export default function CorporateTheme({ portfolio, profile, accent }) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <div className="mx-auto flex max-w-5xl">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-slate-200 p-8">
          {profile?.avatar ? (
            <img src={`http://localhost:8000/storage/${profile.avatar}`} className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-400">
              {profile?.name?.charAt(0) || "?"}
            </div>
          )}
          <h1 className="mt-4 text-xl font-bold">{profile?.name}</h1>
          <p className="mt-1 text-sm font-medium" style={{ color: accent }}>{profile?.headline}</p>
          {profile?.city && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={12} />{profile.city}, {profile.country}
            </p>
          )}

          {profile?.bio && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">À propos</p>
              <p className="mt-2 text-xs text-slate-600">{profile.bio}</p>
            </div>
          )}
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-10">
          <PortfolioContent profile={profile} accent={accent} variant="light" />
        </main>
      </div>
    </div>
  );
}