
import React from "react";
import { MapPin, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "http://localhost:8001/storage/";

export default function CorporateTheme({ portfolio, profile, accent = "#16B8A6" }) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-slate-800">
      <div className="h-2 w-full" style={{ backgroundColor: accent }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:sticky lg:top-8">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              {profile?.avatar ? (
                <img
                  src={`${STORAGE_URL}${profile.avatar}`}
                  alt={profile?.name || "Photo de profil"}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-slate-50"
                />
              ) : (
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight text-[#102342]">
                  {profile?.name || "Mon portfolio"}
                </h1>
                {profile?.headline && (
                  <p className="mt-2 text-sm font-medium leading-6" style={{ color: accent }}>
                    {profile.headline}
                  </p>
                )}
              </div>
            </div>

            {profile?.city && (
              <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
              </div>
            )}

            {profile?.bio && (
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  À propos
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <ShieldCheck size={16} style={{ color: accent }} />
              Profil TalentShare
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-6 rounded-3xl bg-[#102342] p-6 text-white sm:p-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${accent}25`, color: accent }}
                >
                  <BriefcaseBusiness size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Espace professionnel
                  </p>
                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                    Parcours & compétences
                  </h2>
                </div>
              </div>
            </div>

            <PortfolioContent
              profile={profile}
              accent={accent}
              variant="light"
            />
          </main>
        </div>
      </div>
    </div>
  );
}
