import React from "react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "/storage";

export default function MinimalTheme({ portfolio, profile, accent = "#16B8B1" }) {
  if (!profile) return null;

  const initials = (profile.name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F8FA] font-sans text-[#0B1F33]">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <article className="overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-sm">
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

          {/* EN-TÊTE */}
          <header className="border-b border-[#E4EBF1] px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {profile.avatar_path ? (
                <img
                  src={`${STORAGE_URL}/${profile.avatar_path}`}
                  alt={profile.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {profile.name || "Mon portfolio"}
                </h1>
                {profile.headline && (
                  <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>
                    {profile.headline}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#64788C]">
                  {(profile.city || profile.country) && (
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  )}
                  {profile.user?.email && <span>{profile.user.email}</span>}
                  {profile.user?.phone && <span>{profile.user.phone}</span>}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-[#334B63]">
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
          Portfolio présenté sur TalentShare
        </footer>
      </main>
    </div>
  );
}