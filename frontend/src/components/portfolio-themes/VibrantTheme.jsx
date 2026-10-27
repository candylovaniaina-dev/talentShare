import React from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "/storage";

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
    <div className="min-h-screen bg-[#F4F7FC] font-sans text-[#102342] dark:bg-[#0B1F33] dark:text-slate-200">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none">
          {/* ✅ LIGNE VERTE SUPPRIMÉE ICI */}
          
          {/* EN-TÊTE AVEC DÉGRADÉ */}
          <header
            className="relative overflow-hidden px-6 py-6 text-white"
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
                  <p className="mt-0.5 text-sm font-medium text-white/90">
                    {profile.headline}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/80">
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {[profile.city, profile.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {profile.user?.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {profile.user.email}
                    </span>
                  )}
                  {profile.user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {profile.user.phone}
                    </span>
                  )}
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
          <div className="px-6 py-5 dark:bg-[#112A3A]">
            <PortfolioContent profile={profile} accent={accent} variant="light" />
          </div>
        </article>

        <footer className="py-4 text-center text-[10px] text-[#8A9BB0] dark:text-slate-500">
          Créé avec TalentShare
        </footer>
      </main>
    </div>
  );
}