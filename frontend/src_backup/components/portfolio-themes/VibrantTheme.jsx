import React from "react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage";

export default function VibrantTheme({ portfolio, profile, accent = "#23C7B7" }) {
  if (!profile) return null;

  const initials = (profile.name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F7FC] font-sans text-[#102342]">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {/* EN-TÊTE AVEC DÉGRADÉ */}
          <header
            className="relative overflow-hidden px-6 py-5 text-white"
            style={{
              background: `linear-gradient(130deg, #102342 0%, #173D61 55%, ${accent} 150%)`,
            }}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              {profile.avatar_path ? (
                <img
                  src={`${STORAGE_URL}/${profile.avatar_path}`}
                  alt={profile.name}
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {profile.name || "Mon portfolio"}
                </h1>
                {profile.headline && (
                  <p className="mt-0.5 text-sm font-medium text-white/85">
                    {profile.headline}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/70">
                  {(profile.city || profile.country) && (
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  )}
                  {profile.user?.email && <span>{profile.user.email}</span>}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="relative mt-3 whitespace-pre-line text-[13px] leading-6 text-white/85">
                {profile.bio}
              </p>
            )}
          </header>

          {/* CONTENU */}
          <div className="px-6 py-5">
            <PortfolioContent profile={profile} accent={accent} variant="light" />
          </div>
        </article>

        <footer className="py-4 text-center text-[10px] text-[#8A9BB0]">
          Créé avec TalentShare
        </footer>
      </main>
    </div>
  );
}