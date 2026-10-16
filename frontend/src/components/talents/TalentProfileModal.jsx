
import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  Loader2,
  Wrench,
  Sparkles,
  CalendarDays,
  Link2,
} from "lucide-react";
import api from "../../services/api";

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const LEVEL_PCT = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

export default function TalentProfileModal({
  profileId,
  onClose,
  onMessage,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setProfile(null);

    api
      .get(`/professional-profiles/${profileId}`)
      .then((res) => {
        if (active) {
          setProfile(res.data);
        }
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 403) {
          setError("Ce profil est privé.");
        } else if (err.response?.status === 404) {
          setError("Profil introuvable.");
        } else {
          setError("Impossible de charger ce profil. Réessayez plus tard.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profileId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleMessage = () => {
    const userId = profile?.user?.id || profile?.user_id;

    if (userId) {
      onMessage?.(userId);
    }
  };

  const initials = (profile?.user?.name || "T")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isStudent = profile?.profile_type === "student";

  const location = profile?.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : profile?.country || null;

  const externalLinks = [
    ["Portfolio", profile?.portfolio_url],
    ["LinkedIn", profile?.linkedin_url],
    ["GitHub", profile?.github_url],
    ["Behance", profile?.behance_url],
  ].filter(([, url]) => Boolean(url));

  const experiences = profile?.experiences || [];
  const educations = profile?.educations || [];
  const skills = profile?.skills || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profil du talent"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
              <Loader2 size={24} className="animate-spin text-teal-600" />
            </span>
            <p className="text-sm font-medium text-slate-600">
              Chargement du profil…
            </p>
          </div>
        ) : error ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  TalentShare
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Profil du talent
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ShieldCheck size={25} />
              </span>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                Profil indisponible
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </>
        ) : profile ? (
          <>
            <div className="relative shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 px-5 py-6 sm:px-7">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le profil"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 sm:right-5 sm:top-5"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:gap-5">
                <div className="shrink-0">
                  {profile.avatar_path ? (
                    <img
                      src={`/storage/${profile.avatar_path}`}
                      alt={profile.user?.name || "Avatar du talent"}
                      className="h-20 w-20 rounded-2xl border border-white object-cover shadow-md ring-1 ring-slate-200 sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-2xl font-bold text-white shadow-md ring-1 ring-white sm:h-24 sm:w-24">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {profile.user?.name || "Talent"}
                    </h2>

                    {profile.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-800">
                        <ShieldCheck size={12} />
                        Vérifié
                      </span>
                    )}
                  </div>

                  {profile.headline && (
                    <p className="mt-1.5 text-sm font-medium leading-6 text-teal-700 sm:text-base">
                      {profile.headline}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                      {isStudent ? (
                        <GraduationCap size={14} className="text-teal-700" />
                      ) : (
                        <Briefcase size={14} className="text-teal-700" />
                      )}
                      {isStudent ? "Jeune talent" : "Professionnel"}
                    </span>

                    {location && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        <MapPin size={14} className="text-teal-700" />
                        {location}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                      <Wrench size={14} className="text-teal-700" />
                      {skills.length} compétence{skills.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleMessage}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                    >
                      <MessageSquare size={16} />
                      Envoyer un message
                    </button>

                    {profile.portfolio_url && (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        Portfolio
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
              {profile.bio && (
                <Section title="À propos" icon={Sparkles}>
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {profile.bio}
                  </p>
                </Section>
              )}

              {skills.length > 0 && (
                <Section title="Compétences" icon={Wrench}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {skills.slice(0, 8).map((skill) => {
                      const level = skill.pivot?.level;

                      return (
                        <div
                          key={skill.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                              {skill.name}
                            </p>

                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                              {LEVEL_LABEL[level] || "Non précisé"}
                            </span>
                          </div>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                              style={{
                                width: `${LEVEL_PCT[level] || 50}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {skills.length > 8 && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      Et {skills.length - 8} autre
                      {skills.length - 8 > 1 ? "s" : ""} compétence
                      {skills.length - 8 > 1 ? "s" : ""}
                    </p>
                  )}
                </Section>
              )}

              {experiences.length > 0 && (
                <Section title="Expériences professionnelles" icon={Briefcase}>
                  <div className="space-y-4">
                    {experiences.slice(0, 3).map((experience) => (
                      <div
                        key={experience.id}
                        className="relative border-l-2 border-teal-200 pb-1 pl-5"
                      >
                        <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-teal-600 ring-4 ring-white" />

                        <h4 className="text-sm font-semibold text-slate-800">
                          {experience.title}
                        </h4>

                        {experience.company && (
                          <p className="mt-1 text-sm text-slate-600">
                            {experience.company}
                          </p>
                        )}

                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={12} />
                          {experience.start_date?.slice(0, 7) || "—"} →{" "}
                          {experience.is_current
                            ? "Aujourd’hui"
                            : experience.end_date?.slice(0, 7) || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {educations.length > 0 && (
                <Section title="Formations" icon={GraduationCap}>
                  <div className="space-y-4">
                    {educations.slice(0, 3).map((education) => (
                      <div
                        key={education.id}
                        className="relative border-l-2 border-cyan-200 pb-1 pl-5"
                      >
                        <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-cyan-600 ring-4 ring-white" />

                        <h4 className="text-sm font-semibold text-slate-800">
                          {education.degree}
                        </h4>

                        {education.institution && (
                          <p className="mt-1 text-sm text-slate-600">
                            {education.institution}
                          </p>
                        )}

                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={12} />
                          {education.start_date?.slice(0, 7) || "—"} →{" "}
                          {education.is_current
                            ? "Aujourd’hui"
                            : education.end_date?.slice(0, 7) || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {externalLinks.length > 0 && (
                <Section title="Liens externes" icon={Link2}>
                  <div className="flex flex-wrap gap-2">
                    {externalLinks.map(([name, url]) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        {name}
                        <ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {!profile.bio &&
                skills.length === 0 &&
                experiences.length === 0 &&
                educations.length === 0 &&
                externalLinks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <Sparkles
                      size={24}
                      className="mx-auto text-slate-400"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Profil en cours de construction
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ce talent n’a pas encore ajouté de détails à son profil.
                    </p>
                  </div>
                )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={handleMessage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <MessageSquare size={15} />
                Envoyer un message
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
          <Icon size={16} />
        </span>

        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      {children}
    </section>
  );
}
