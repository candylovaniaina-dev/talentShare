import React, { useEffect, useState } from "react";
import {
  X, MapPin, Briefcase, GraduationCap, ShieldCheck,
  MessageSquare, ExternalLink, Loader2, Wrench, Sparkles,
} from "lucide-react";
import api from "../../services/api";

const LEVEL_LABEL = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", expert: "Expert",
};
const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };

/* ============================================
   COMPOSANT
============================================ */
export default function TalentProfileModal({ profileId, onClose, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger le profil
  useEffect(() => {
    setLoading(true);
    api.get(`/professional-profiles/${profileId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setError("Ce profil est privé.");
        else if (err.response?.status === 404) setError("Profil introuvable.");
        else setError("Erreur de chargement.");
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  // Échap pour fermer
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleMessage = () => {
    const userId = profile?.user?.id || profile?.user_id;
    if (userId) onMessage?.(userId);
  };

  const initials = profile?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isStudent = profile?.profile_type === "student";
  const location = profile?.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : null;

  const hasLinks =
    profile?.portfolio_url || profile?.linkedin_url || profile?.github_url || profile?.behance_url;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-modalOverlay"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl animate-modalContent"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ===== LOADING ===== */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : error ? (
          <>
            <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
              <p className="text-sm font-bold text-[var(--text-app)]">Profil</p>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
            </div>
          </>
        ) : (
          <>
            {/* ===== HEADER (avatar + infos) ===== */}
            <div className="relative border-b border-[var(--border-app)] px-6 py-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="shrink-0">
                  {profile.avatar_path ? (
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--border-app)] ring-2 ring-emerald-500/30">
                      <img
                        src={`http://localhost:8000/storage/${profile.avatar_path}`}
                        alt={profile.user?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--border-app)] bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white ring-2 ring-emerald-500/30">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--text-app)]">
                      {profile.user?.name}
                    </h2>
                    {profile.is_verified && (
                      <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                        <ShieldCheck size={10} /> Vérifié
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--text-muted)]">
                      {isStudent ? <GraduationCap size={10} /> : <Briefcase size={10} />}
                      {isStudent ? "Jeune talent" : "Talent"}
                    </span>
                  </div>

                  {profile.headline && (
                    <p className="mt-1 text-sm font-semibold text-emerald-400">
                      {profile.headline}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-faint)]">
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {location}
                      </span>
                    )}
                    <span>{profile.skills?.length || 0} compétences</span>
                  </div>
                </div>
              </div>

              {/* Boutons actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
                >
                  <MessageSquare size={13} />
                  Envoyer un message
                </button>

                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
                  >
                    Portfolio
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>

            {/* ===== BODY (scrollable) ===== */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">

              {/* À propos */}
              {profile.bio && (
                <Section title="À propos" icon={Sparkles}>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">
                    {profile.bio}
                  </p>
                </Section>
              )}

              {/* Compétences */}
              {profile.skills?.length > 0 && (
                <Section title="Compétences" icon={Wrench}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile.skills.slice(0, 8).map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[var(--text-app)]">{s.name}</p>
                          <span className="text-[10px] text-[var(--text-faint)]">
                            {LEVEL_LABEL[s.pivot?.level] || "—"}
                          </span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-[var(--bg-surface)]">
                          <div
                            className="h-1 rounded-full bg-emerald-400"
                            style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {profile.skills.length > 8 && (
                    <p className="mt-2 text-center text-[10px] text-[var(--text-faint)]">
                      +{profile.skills.length - 8} autres compétences
                    </p>
                  )}
                </Section>
              )}

              {/* Expériences */}
              {profile.experiences?.length > 0 && (
                <Section title="Expériences" icon={Briefcase}>
                  <div className="space-y-3">
                    {profile.experiences.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="border-l-2 border-emerald-500/40 pl-3">
                        <p className="text-sm font-semibold text-[var(--text-app)]">{exp.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{exp.company}</p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">
                          {exp.start_date?.slice(0, 7)} → {exp.is_current ? "Aujourd'hui" : exp.end_date?.slice(0, 7)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Formations */}
              {profile.educations?.length > 0 && (
                <Section title="Formations" icon={GraduationCap}>
                  <div className="space-y-3">
                    {profile.educations.slice(0, 3).map((edu) => (
                      <div key={edu.id} className="border-l-2 border-blue-500/40 pl-3">
                        <p className="text-sm font-semibold text-[var(--text-app)]">{edu.degree}</p>
                        <p className="text-xs text-[var(--text-muted)]">{edu.institution}</p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">
                          {edu.start_date?.slice(0, 7)} → {edu.is_current ? "Aujourd'hui" : edu.end_date?.slice(0, 7)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Liens externes */}
              {hasLinks && (
                <Section title="Liens externes" icon={ExternalLink}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Portfolio", profile.portfolio_url],
                      ["LinkedIn", profile.linkedin_url],
                      ["GitHub", profile.github_url],
                      ["Behance", profile.behance_url],
                    ]
                      .filter(([, url]) => !!url)
                      .map(([name, url]) => (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-app)] transition hover:border-emerald-500/40 hover:text-emerald-400"
                        >
                          {name}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                  </div>
                </Section>
              )}

            </div>

            {/* ===== FOOTER ===== */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-app)] px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
              >
                Fermer
              </button>
              <button
                onClick={handleMessage}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
              >
                <MessageSquare size={14} />
                Envoyer un message
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================
   UI HELPERS
============================================ */
function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <Icon size={14} />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}