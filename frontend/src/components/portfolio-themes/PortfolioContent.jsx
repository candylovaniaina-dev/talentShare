import React from "react";

const STORAGE_URL = "/storage";

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

const STATUS_LABEL = {
  available: "Disponible",
  partially_available: "Partiel",
  unavailable: "Indisponible",
  on_mission: "En mission",
};

const TYPE_LABEL = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  internship: "Stage",
  mission: "Mission",
};

const UNIT_LABEL = {
  percentage: "%",
  hours_per_week: "h/sem",
  days_per_week: "j/sem",
};

const LOCATION_LABEL = {
  onsite: "Sur site",
  remote: "Télétravail",
  hybrid: "Hybride",
};

const fmtMonth = (v) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "";

const fmtRange = (item) => {
  const start = fmtMonth(item.start_date);
  const end = item.is_current ? "Aujourd'hui" : fmtMonth(item.end_date);
  return [start, end].filter(Boolean).join(" – ");
};

function groupSkillsByCategory(skills) {
  const groups = {};
  skills.forEach((skill) => {
    const cat = skill.category?.parent?.name || skill.category?.name || "Autres";
    if (!groups[cat]) groups[cat] = { category: cat, skills: [] };
    groups[cat].skills.push(skill);
  });
  return Object.values(groups);
}

/* ============================================================
   PORTFOLIO CONTENT — Layout 2 colonnes sans icônes
   ============================================================ */
export default function PortfolioContent({ profile, accent = "#16B8B1", variant = "light" }) {
  if (!profile) return null;

  const isDark = variant === "dark";

  /* Styles conditionnels selon le thème */
  const textPrimary = isDark ? "text-white" : "text-[#0B1F33]";
  const textSecondary = isDark ? "text-slate-300" : "text-[#64788C]";
  const textMuted = isDark ? "text-slate-400" : "text-[#8A9BB0]";
  const border = isDark ? "border-white/10" : "border-[#E4EBF1]";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const chipBg = isDark ? "bg-white/10 text-white" : "bg-[#F1F6FA] text-[#334B63]";

  const skills = profile.skills || [];
  const experiences = profile.experiences || [];
  const educations = profile.educations || [];
  const certifications = profile.certifications || [];
  const languages = profile.languages || [];
  const availability = profile.availability_windows || [];
  const projects = profile.projects || [];
  const groupedSkills = groupSkillsByCategory(skills);

  /* ---------- Label de section (uppercase fin) ---------- */
  const SectionLabel = ({ children }) => (
    <h2
      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ color: accent }}
    >
      {children}
    </h2>
  );

  return (
    <div className={`grid gap-x-8 gap-y-6 lg:grid-cols-5 ${textPrimary}`}>
      {/* ============================================================ */}
      {/* COLONNE GAUCHE (2/5) — Profil, Compétences, Langues, Certifs */}
      {/* ============================================================ */}
      <div className="space-y-6 lg:col-span-2">
        {/* ---------- DISPONIBILITÉS ---------- */}
        {availability.length > 0 && (
          <section>
            <SectionLabel>Disponibilités</SectionLabel>
            <ul className="space-y-2">
              {availability.slice(0, 3).map((w) => (
                <li
                  key={w.id}
                  className={`rounded-lg border ${border} ${cardBg} px-3 py-2`}
                >
                  <p className={`text-[12px] font-semibold ${textPrimary}`}>
                    {STATUS_LABEL[w.status] || w.status}
                    {w.type && ` · ${TYPE_LABEL[w.type] || w.type}`}
                  </p>
                  <p className={`mt-0.5 text-[11px] ${textMuted}`}>
                    {fmtMonth(w.start_at)} → {fmtMonth(w.end_at)}
                    {w.workload_value != null && ` · ${w.workload_value}${UNIT_LABEL[w.workload_unit] || ""}`}
                  </p>
                  {w.location_type && (
                    <p className={`mt-0.5 text-[11px] ${textSecondary}`}>
                      {LOCATION_LABEL[w.location_type] || w.location_type}
                      {w.location_city && ` · ${w.location_city}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- COMPÉTENCES ---------- */}
        {groupedSkills.length > 0 && (
          <section>
            <SectionLabel>Compétences</SectionLabel>
            <div className="space-y-3">
              {groupedSkills.map((group) => (
                <div key={group.category}>
                  <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.skills.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-baseline gap-1 rounded px-2 py-0.5 text-[11px] ${chipBg}`}
                      >
                        <span className="font-medium">{s.name}</span>
                        {s.pivot?.level && (
                          <span className="opacity-60">
                            {LEVEL_LABEL[s.pivot.level] || s.pivot.level}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- LANGUES ---------- */}
        {languages.length > 0 && (
          <section>
            <SectionLabel>Langues</SectionLabel>
            <ul className="space-y-1">
              {languages.map((l) => (
                <li
                  key={l.id}
                  className={`flex items-baseline justify-between gap-2 text-[12px]`}
                >
                  <span className={`font-medium ${textPrimary}`}>{l.name}</span>
                  <span className={`text-[11px] ${textSecondary}`}>
                    {LANG_LEVEL[l.level] || l.level}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- CERTIFICATIONS ---------- */}
        {certifications.length > 0 && (
          <section>
            <SectionLabel>Certifications</SectionLabel>
            <ul className="space-y-2">
              {certifications.map((c) => (
                <li key={c.id}>
                  <p className={`text-[12px] font-semibold ${textPrimary}`}>{c.name}</p>
                  <p className={`text-[11px] ${textSecondary}`}>
                    {c.issuing_organization}
                    {c.issue_date && ` · ${fmtMonth(c.issue_date)}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ============================================================ */}
      {/* COLONNE DROITE (3/5) — Expériences, Formations, Projets */}
      {/* ============================================================ */}
      <div className="space-y-6 lg:col-span-3">
        {/* ---------- EXPÉRIENCES ---------- */}
        {experiences.length > 0 && (
          <section>
            <SectionLabel>Expériences</SectionLabel>
            <ul className="space-y-3">
              {experiences.map((exp) => (
                <li key={exp.id} className="border-l-2 pl-3" style={{ borderColor: `${accent}66` }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className={`text-[13px] font-semibold ${textPrimary}`}>{exp.title}</p>
                    <span className={`text-[10px] ${textMuted}`}>{fmtRange(exp)}</span>
                  </div>
                  <p className={`text-[11px] ${textSecondary}`}>
                    {[exp.company, exp.location].filter(Boolean).join(" · ")}
                  </p>
                  {exp.description && (
                    <p className={`mt-1 line-clamp-2 text-[11px] leading-5 ${textSecondary}`}>
                      {exp.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- FORMATIONS ---------- */}
        {educations.length > 0 && (
          <section>
            <SectionLabel>Formations</SectionLabel>
            <ul className="space-y-2.5">
              {educations.map((edu) => (
                <li key={edu.id} className="border-l-2 pl-3" style={{ borderColor: `${accent}66` }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className={`text-[13px] font-semibold ${textPrimary}`}>
                      {edu.degree}
                      {edu.study_level && (
                        <span className="font-medium" style={{ color: accent }}>
                          {" · "}
                          {edu.study_level}
                        </span>
                      )}
                    </p>
                    <span className={`text-[10px] ${textMuted}`}>{fmtRange(edu)}</span>
                  </div>
                  <p className={`text-[11px] ${textSecondary}`}>
                    {[edu.institution, edu.field_of_study].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- PROJETS ---------- */}
        {projects.length > 0 && (
          <section>
            <SectionLabel>Projets & réalisations</SectionLabel>
            <ul className="space-y-2.5">
              {projects.slice(0, 4).map((p) => (
                <li key={p.id} className={`rounded-lg border ${border} ${cardBg} p-3`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className={`text-[13px] font-semibold ${textPrimary}`}>{p.title}</p>
                    {p.project_url && (
                      <a
                        href={p.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold hover:underline"
                        style={{ color: accent }}
                      >
                        Voir
                      </a>
                    )}
                  </div>
                  {p.description && (
                    <p className={`mt-1 line-clamp-2 text-[11px] leading-5 ${textSecondary}`}>
                      {p.description}
                    </p>
                  )}
                  {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.technologies.slice(0, 6).map((t, i) => (
                        <span
                          key={i}
                          className={`rounded px-1.5 py-0.5 text-[10px] ${chipBg}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {projects.length > 4 && (
                <li className={`text-[11px] ${textMuted}`}>
                  +{projects.length - 4} autres projets
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}