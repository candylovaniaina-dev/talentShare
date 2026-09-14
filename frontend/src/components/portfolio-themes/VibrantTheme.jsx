import React from "react";
import { GraduationCap } from "lucide-react";
import PortfolioContent from "./PortfolioContent";

export default function VibrantTheme({ portfolio, profile, accent }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white font-sans text-navy">
      <div className="mx-auto max-w-4xl px-6 py-14">

        {/* Header dégradé */}
        <div className="rounded-[2rem] p-8 text-white" style={{ background: `linear-gradient(135deg, ${accent}, #0B1633)` }}>
          <div className="flex items-center gap-5">
            {profile?.avatar ? (
              <img src={`http://localhost:8000/storage/${profile.avatar}`} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                {profile?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/80">
                <GraduationCap size={14} /> {profile?.profile_type === "student" ? "Jeune talent" : "Talent"}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">{profile?.name}</h1>
              <p className="mt-0.5 text-white/90">{profile?.headline}</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
            {profile.bio}
          </p>
        )}

        {/* ✅ TOUT LE CONTENU */}
        <div className="mt-6">
          <PortfolioContent profile={profile} accent={accent} variant="light" />
        </div>
      </div>
    </div>
  );
}