import React from "react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage";

export default function CorporateTheme({ portfolio, profile, accent = "#16B8B1" }) {
  if (!profile) return null;

  const initials = (profile.name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-[#102342]">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
            <div className="border-b border-slate-200 bg-[#F9FBFC] px-5 py-5">
              {profile.avatar_path ? (
                <img
                  src={`${STORAGE_URL}/${profile.avatar_path}`}
                  alt={profile.name}
                  className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
              )}

              <h1 className="mt-3 text-base font-extrabold tracking-tight text-[#102342]">
                {profile.name || "Mon portfolio"}
              </h1>
              {profile.headline && (
                <p className="mt-1 text-xs font-medium leading-5" style={{ color: accent }}>
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="space-y-2 px-5 py-4 text-[11px] text-[#64788C]">
              {(profile.city || profile.country) && (
                <p>{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
              )}
              {profile.user?.email && <p className="break-all">{profile.user.email}</p>}
              {profile.user?.phone && <p>{profile.user.phone}</p>}
            </div>
          </aside>

          {/* CONTENU */}
          <div className="min-w-0">
            {profile.bio && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A9BB0]">
                  À propos
                </h2>
                <p className="whitespace-pre-line text-[13px] leading-6 text-[#334B63]">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <PortfolioContent profile={profile} accent={accent} variant="light" />
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-[10px] text-[#8A9BB0]">
          Portfolio présenté sur TalentShare
        </footer>
      </main>
    </div>
  );
}