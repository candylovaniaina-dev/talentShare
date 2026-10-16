import React from "react";
import {
  Mail,
  MapPin,
  Phone,
  Globe,
  Link2,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Languages as LanguagesIcon,
  Sparkles,
  FileText,
  Calendar,
} from "lucide-react";

const STORAGE_URL = "http://localhost:8001/storage";

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const LANG_LEVEL = {
  basic: "Notions",
  conversational: "Intermédiaire",
  fluent: "Courant",
  native: "Langue maternelle",
};

const fmtMonth = (v) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "";

const fmtRange = (item) => {
  const start = fmtMonth(item.start_date);
  const end = item.is_current ? "Aujourd'hui" : fmtMonth(item.end_date);
  return [start, end].filter(Boolean).join(" – ");
};

export default function CVPortfolio({ portfolio, profile, accent = "#16B8B1" }) {
  if (!profile) return null;

  const user = profile.user || {};
  const skills = profile.skills || [];
  const experiences = profile.experiences || [];
  const educations = profile.educations || [];
  const certifications = profile.certifications || [];
  const languages = profile.languages || [];
  const projects = profile.projects || [];

  const links = [
    { key: "linkedin_url", label: "LinkedIn", icon: Link2 },
    { key: "portfolio_url", label: "Portfolio", icon: Globe },
    { key: "github_url", label: "GitHub", icon: Link2 },
    { key: "behance_url", label: "Behance", icon: Link2 },
  ].filter((l) => profile[l.key]);

  const initials = (profile.name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="mx-auto max-w-4xl bg-white font-sans text-[#0B1F33]">
      {/* ============ EN-TÊTE ============ */}
      <header className="border-b border-[#E4EBF1] bg-[#F9FBFC] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
          {profile.avatar_path ? (
  <img
    src={`${STORAGE_URL}/${profile.avatar_path}`}
                alt={profile.name}
                className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm"
                style={{ backgroundColor: accent }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {profile.name || "Mon portfolio"}
              </h1>
              {profile.headline && (
                <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>
                  {profile.headline}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64788C]">
                {(profile.city || profile.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} />
                    {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {links.map(({ key, label, icon: Icon }) => (
                <a
                  key={key}
                  href={profile[key]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[#E4EBF1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#334B63] transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <Icon size={11} />
                  {label}
                </a>
              ))}
              {profile.cv_path && (
                <a
                  href={`${STORAGE_URL}${profile.cv_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <FileText size={11} />
                  CV
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bio courte */}
        {profile.bio && (
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#334B63]">
            {profile.bio}
          </p>
        )}
      </header>

      {/* ============ CONTENU ============ */}
      <div className="grid gap-x-8 gap-y-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-3">
        {/* ---- COLONNE PRINCIPALE (2/3) ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Expériences */}
          {experiences.length > 0 && (
            <SectionCV icon={Briefcase} title="Expériences" accent={accent}>
              <ul className="space-y-4">
                {experiences.map((exp) => (
                  <li key={exp.id} className="relative border-l-2 pl-4" style={{ borderColor: `${accent}55` }}>
                    <span
                      className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <p className="text-sm font-semibold text-[#0B1F33]">{exp.title}</p>
                      <span className="text-[11px] font-medium text-[#8A9BB0]">{fmtRange(exp)}</span>
                    </div>
                    <p className="text-xs text-[#64788C]">
                      {[exp.company, exp.location].filter(Boolean).join(" · ")}
                    </p>
                    {exp.description && (
                      <p className="mt-1.5 text-xs leading-5 text-[#64788C]">{exp.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCV>
          )}

          {/* Formations */}
          {educations.length > 0 && (
            <SectionCV icon={GraduationCap} title="Formations" accent={accent}>
              <ul className="space-y-3">
                {educations.map((edu) => (
                  <li key={edu.id} className="relative border-l-2 pl-4" style={{ borderColor: `${accent}55` }}>
                    <span
                      className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <p className="text-sm font-semibold text-[#0B1F33]">
                        {edu.degree}
                        {edu.study_level && (
                          <span className="font-medium text-[#0F9691]"> · {edu.study_level}</span>
                        )}
                      </p>
                      <span className="text-[11px] font-medium text-[#8A9BB0]">{fmtRange(edu)}</span>
                    </div>
                    <p className="text-xs text-[#64788C]">
                      {[edu.institution, edu.field_of_study].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCV>
          )}

          {/* Projets */}
          {projects.length > 0 && (
            <SectionCV icon={Sparkles} title="Projets & réalisations" accent={accent}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-lg border border-[#E4EBF1] p-3">
                    <p className="text-sm font-semibold text-[#0B1F33]">{p.title}</p>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#64788C]">{p.description}</p>
                    )}
                    {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.technologies.slice(0, 4).map((t, i) => (
                          <span
                            key={i}
                            className="rounded bg-[#F1F6FA] px-1.5 py-0.5 text-[10px] text-[#334B63]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.project_url && (
                      <a
                        href={p.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                        style={{ color: accent }}
                      >
                        Voir le projet <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </SectionCV>
          )}
        </div>

        {/* ---- COLONNE LATÉRALE (1/3) ---- */}
        <aside className="space-y-6">
          {/* Compétences */}
          {skills.length > 0 && (
            <SectionCV icon={Sparkles} title="Compétences" accent={accent}>
              <ul className="flex flex-wrap gap-1.5">
                {skills.slice(0, 20).map((s) => (
                  <li
                    key={s.id}
                    title={LEVEL_LABEL[s.pivot?.level] || ""}
                    className="inline-flex items-center gap-1 rounded-full border border-[#BDEFE7] bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-medium text-[#0F766E]"
                  >
                    {s.name}
                    {s.pivot?.is_featured && <span className="text-amber-500">★</span>}
                  </li>
                ))}
              </ul>
            </SectionCV>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <SectionCV icon={Award} title="Certifications" accent={accent}>
              <ul className="space-y-2">
                {certifications.map((c) => (
                  <li key={c.id}>
                    <p className="text-xs font-semibold text-[#0B1F33]">{c.name}</p>
                    <p className="text-[11px] text-[#64788C]">
                      {c.issuing_organization}
                      {c.issue_date && ` · ${fmtMonth(c.issue_date)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCV>
          )}

          {/* Langues */}
          {languages.length > 0 && (
            <SectionCV icon={LanguagesIcon} title="Langues" accent={accent}>
              <ul className="space-y-1.5">
                {languages.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#0B1F33]">{l.name}</span>
                    <span className="text-[11px] text-[#64788C]">
                      {LANG_LEVEL[l.level] || l.level}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCV>
          )}

          {/* Disponibilités (résumé compact) */}
          {Array.isArray(profile.availability_windows) &&
            profile.availability_windows.length > 0 && (
              <SectionCV icon={Calendar} title="Disponibilités" accent={accent}>
                <ul className="space-y-1.5 text-xs">
                  {profile.availability_windows.slice(0, 3).map((w) => (
                    <li key={w.id} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-[#334B63]">
                        {new Date(w.start_at).toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(w.end_at).toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionCV>
            )}
        </aside>
      </div>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#E4EBF1] px-6 py-3 text-center text-[11px] text-[#8A9BB0] sm:px-8">
        Portfolio présenté sur TalentShare
      </footer>
    </article>
  );
}

/* ---------- Section réutilisable ---------- */
function SectionCV({ icon: Icon, title, accent, children }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8A9BB0]">
        <Icon size={13} style={{ color: accent }} />
        {title}
      </h2>
      {children}
    </section>
  );
}