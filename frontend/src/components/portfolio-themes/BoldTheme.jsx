
import React from "react";
import { MapPin, Sparkles, ShieldCheck } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage/";

export default function BoldTheme({ portfolio, profile, accent = "#27C7B7" }) {
  return (
    <div className="min-h-screen bg-[#08152E] font-sans text-white">
      <header className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 65%)`,
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div
              className="mb-6 rounded-full p-1"
              style={{ background: `linear-gradient(135deg, ${accent}, #FFFFFF44)` }}
            >
              {profile?.avatar ? (
                <img
                  src={`${STORAGE_URL}${profile.avatar}`}
                  alt={profile?.name || "Photo de profil"}
                  className="h-28 w-28 rounded-full border-4 border-[#08152E] object-cover sm:h-32 sm:w-32"
                />
              ) : (
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#08152E] text-4xl font-bold sm:h-32 sm:w-32"
                  style={{ backgroundColor: `${accent}35`, color: accent }}
                >
                  {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"
              style={{
                color: accent,
                borderColor: `${accent}55`,
                backgroundColor: `${accent}12`,
              }}
            >
              <Sparkles size={14} />
              Portfolio professionnel
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {profile?.name || "Mon portfolio"}
            </h1>

            {profile?.headline && (
              <p className="mt-4 text-lg font-semibold sm:text-xl" style={{ color: accent }}>
                {profile.headline}
              </p>
            )}

            {profile?.city && (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={16} />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </p>
            )}

            {profile?.bio && (
              <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-slate-300 sm:text-base">
                {profile.bio}
              </p>
            )}

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} style={{ color: accent }} />
              Profil TalentShare
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <PortfolioContent
          profile={profile}
          accent={accent}
          variant="dark"
        />
      </main>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        Portfolio présenté sur TalentShare
      </footer>
    </div>
  );
}
