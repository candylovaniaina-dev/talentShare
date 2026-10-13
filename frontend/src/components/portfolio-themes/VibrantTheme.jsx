
import React from "react";
import { GraduationCap, MapPin, Sparkles } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage/";

export default function VibrantTheme({ portfolio, profile, accent = "#23C7B7" }) {
  return (
    <div className="min-h-screen bg-[#F4F7FC] font-sans text-[#102342]">
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(130deg, #102342 0%, #173D61 55%, ${accent} 150%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[45px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border-[35px] border-white/5" />

        <header className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {profile?.avatar ? (
              <img
                src={`${STORAGE_URL}${profile.avatar}`}
                alt={profile?.name || "Photo de profil"}
                className="h-24 w-24 rounded-[1.75rem] border-2 border-white/30 object-cover shadow-xl sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/10 text-4xl font-bold text-white sm:h-28 sm:w-28">
                {profile?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            <div className="min-w-0 flex-1 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                <GraduationCap size={15} />
                {profile?.profile_type === "student" ? "Jeune talent" : "Profil professionnel"}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {profile?.name || "Mon portfolio"}
              </h1>

              {profile?.headline && (
                <p className="mt-2 text-base font-medium text-white/80 sm:text-lg">
                  {profile.headline}
                </p>
              )}

              {profile?.city && (
                <p className="mt-3 flex items-center gap-2 text-sm text-white/70">
                  <MapPin size={15} />
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {profile?.bio && (
            <div className="mt-8 max-w-3xl rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/60">
                <Sparkles size={14} />
                À propos
              </p>
              <p className="whitespace-pre-line text-sm leading-7 text-white/90 sm:text-base">
                {profile.bio}
              </p>
            </div>
          )}
        </header>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <PortfolioContent profile={profile} accent={accent} variant="light" />
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-400">
        Créé avec TalentShare
      </footer>
    </div>
  );
}
