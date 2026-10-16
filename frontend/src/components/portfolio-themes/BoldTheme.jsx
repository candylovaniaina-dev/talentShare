import React from "react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "/storage";

export default function BoldTheme({ portfolio, profile, accent = "#27C7B7" }) {
  if (!profile) return null;

  const initials = (profile.name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#08152E] font-sans text-white">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1C36] shadow-2xl">
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

          {/* EN-TÊTE */}
          <header className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {profile.avatar_path ? (
                <img
                  src={`${STORAGE_URL}/${profile.avatar_path}`}
                  alt={profile.name}
                  className="h-16 w-16 shrink-0 rounded-full border-2 object-cover shadow-lg"
                  style={{ borderColor: accent }}
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[#08152E] shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {profile.name || "Mon portfolio"}
                </h1>
                {profile.headline && (
                  <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>
                    {profile.headline}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                  {(profile.city || profile.country) && (
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  )}
                  {profile.user?.email && <span>{profile.user.email}</span>}
                  {profile.user?.phone && <span>{profile.user.phone}</span>}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-slate-300">
                {profile.bio}
              </p>
            )}
          </header>

          {/* CONTENU */}
          <div className="px-6 py-5">
            <PortfolioContent profile={profile} accent={accent} variant="dark" />
          </div>
        </article>

        <footer className="py-4 text-center text-[10px] text-slate-500">
          Portfolio présenté sur TalentShare
        </footer>
      </main>
    </div>
  );
}