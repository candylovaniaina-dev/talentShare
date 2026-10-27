import React from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

const STORAGE_URL = "/storage";

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
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-[#102342] dark:bg-[#0B1F33] dark:text-slate-200">
      {/* ✅ LIGNE VERTE SUPPRIMÉE ICI */}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] lg:sticky lg:top-6">
            <div className="border-b border-slate-200 bg-[#F9FBFC] px-5 py-5 text-center dark:border-white/10 dark:bg-[#0B1F33]">
              {profile.avatar_path ? (
                <img
                  src={`${STORAGE_URL}/${profile.avatar_path}`}
                  alt={profile.name}
                  className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-sm ring-2 ring-white dark:ring-[#0B1F33]"
                />
              ) : (
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
              )}

              <h1 className="mt-3 text-base font-extrabold tracking-tight text-[#102342] dark:text-white">
                {profile.name || "Mon portfolio"}
              </h1>
              {profile.headline && (
                <p className="mt-1 text-xs font-medium leading-5" style={{ color: accent }}>
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="space-y-2.5 px-5 py-5 text-[12px] text-[#64788C] dark:text-slate-400">
              {(profile.city || profile.country) && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#8A9BB0] dark:text-slate-500" />
                  <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {profile.user?.email && (
                <div className="flex items-start gap-2">
                  <Mail size={14} className="mt-0.5 shrink-0 text-[#8A9BB0] dark:text-slate-500" />
                  <span className="break-all">{profile.user.email}</span>
                </div>
              )}
              {profile.user?.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={14} className="mt-0.5 shrink-0 text-[#8A9BB0] dark:text-slate-500" />
                  <span>{profile.user.phone}</span>
                </div>
              )}
            </div>
          </aside>

          {/* CONTENU */}
          <div className="min-w-0">
            {profile.bio && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A9BB0] dark:text-slate-500">
                  À propos
                </h2>
                <p className="whitespace-pre-line text-[13px] leading-6 text-[#334B63] dark:text-slate-300">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
              <PortfolioContent profile={profile} accent={accent} variant="light" />
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-[10px] text-[#8A9BB0] dark:text-slate-500">
          Portfolio présenté sur TalentShare
        </footer>
      </main>
    </div>
  );
}