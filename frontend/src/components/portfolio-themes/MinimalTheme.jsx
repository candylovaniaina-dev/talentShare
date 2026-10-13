
import React from "react";
import { MapPin, ArrowDownRight } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage/";

export default function MinimalTheme({ portfolio, profile, accent = "#20BFAF" }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans text-[#102342]">
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
          <div className="h-2" style={{ backgroundColor: accent }} />

          <div className="p-6 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {profile?.avatar ? (
                <img
                  src={`${STORAGE_URL}${profile.avatar}`}
                  alt={profile?.name || "Photo de profil"}
                  className="h-24 w-24 rounded-3xl object-cover ring-4 ring-slate-50 sm:h-28 sm:w-28"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl text-4xl font-bold sm:h-28 sm:w-28"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Portfolio
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {profile?.name || "Mon portfolio"}
                </h1>

                {profile?.headline && (
                  <p className="mt-3 text-base font-medium sm:text-lg" style={{ color: accent }}>
                    {profile.headline}
                  </p>
                )}

                {profile?.city && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={15} />
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {profile?.bio && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  À propos de moi
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-400">
              <ArrowDownRight size={15} style={{ color: accent }} />
              Découvrez mon parcours
            </div>
          </div>
        </header>

        <div className="mt-8">
          <PortfolioContent profile={profile} accent={accent} variant="light" />
        </div>

        <footer className="py-10 text-center text-xs text-slate-400">
          Portfolio présenté sur TalentShare
        </footer>
      </main>
    </div>
  );
}
