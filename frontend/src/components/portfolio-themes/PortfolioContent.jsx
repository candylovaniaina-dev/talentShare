import React from "react";
import {
  MapPin, GraduationCap, Briefcase, Award, Languages as LanguagesIcon,
  Link as LinkIcon, ExternalLink, Calendar, Clock, ShieldCheck,
  Globe, Sparkles, Code, Phone, FileText,
} from "lucide-react";

const LEVEL_LABEL = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };
const LANG_LEVEL  = { basic: "Notions", conversational: "Intermédiaire", fluent: "Courant", native: "Langue maternelle" };

const STATUS_CONFIG = {
  available:           { label: "Disponible",               emoji: "🟢" },
  partially_available: { label: "Partiellement disponible", emoji: "🟡" },
  unavailable:         { label: "Non disponible",           emoji: "🔴" },
  on_mission:          { label: "En mission",               emoji: "🔵" },
};

const TYPE_LABELS = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  internship: "Stage", mission: "Mission",
};

const UNIT_LABELS = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };

function groupSkillsByCategory(skills) {
  const groups = {};
  skills.forEach((skill) => {
    const cat = skill.category?.parent?.name || skill.category?.name || "Autres";
    const icon = skill.category?.parent?.icon || skill.category?.icon || "🏷️";
    if (!groups[cat]) groups[cat] = { category: cat, icon, skills: [] };
    groups[cat].skills.push(skill);
  });
  return Object.values(groups);
}

export default function PortfolioContent({ profile, accent = "#6EE7C8", variant = "light" }) {
  if (!profile) return null;

  const isDark = variant === "dark";
  const textPrimary   = isDark ? "text-white" : "text-navy";
  const textSecondary = isDark ? "text-slate-300" : "text-slate-500";
  const cardBg        = isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200";
  const chipBg        = isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700";

  const user           = profile.user || {};
  const skills         = profile.skills || [];
  const experiences    = profile.experiences || [];
  const educations     = profile.educations || [];
  const certifications = profile.certifications || [];
  const languages      = profile.languages || [];
  const availability   = profile.availability_windows || [];
  const projects       = profile.projects || [];
  const links          = profile.links || {
    portfolio: profile.portfolio_url,
    linkedin: profile.linkedin_url,
    github: profile.github_url,
    behance: profile.behance_url,
  };
  const groupedSkills  = groupSkillsByCategory(skills);

  const hasPhone  = user.phone;
  const hasOrigin = user.country && user.country !== profile.country;
  const hasCv     = profile.cv_path;
  const hasLinks  = links.portfolio || links.linkedin || links.github || links.behance;

  return (
    <div className="space-y-8">

      {/* DISPONIBILITÉS */}
      {availability.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-3 ${textPrimary}`}>Disponibilités</h2>
          <div className="space-y-2">
            {availability.map((w) => {
              const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.available;
              return (
                <div key={w.id} className={`flex items-start gap-3 rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                  <span className="text-lg">{cfg.emoji}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${textPrimary}`}>
                      {cfg.label}{w.type && ` · ${TYPE_LABELS[w.type] || w.type}`}
                    </p>
                    <div className={`mt-1 flex flex-wrap gap-3 text-xs ${textSecondary}`}>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(w.start_at).toLocaleDateString("fr-FR")} → {new Date(w.end_at).toLocaleDateString("fr-FR")}
                      </span>
                      {w.workload_value && (
                        <span className="flex items-center gap-1"><Clock size={11} />{w.workload_value}{UNIT_LABELS[w.workload_unit] || "%"}</span>
                      )}
                      {w.location_type && (
                        <span>{w.location_type === "remote" ? "🏠" : w.location_type === "hybrid" ? "🔄" : "🏢"}{w.location_city && ` ${w.location_city}`}</span>
                      )}
                    </div>
                    {w.notes && <p className={`mt-1 text-xs italic ${textSecondary}`}>"{w.notes}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* COMPÉTENCES */}
      {groupedSkills.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 ${textPrimary}`}>Compétences</h2>
          <div className="space-y-5">
            {groupedSkills.map((group) => (
              <div key={group.category}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${textSecondary}`}>
                  {group.icon} {group.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((s) => (
                    <div key={s.id} className={`rounded-full px-3 py-1.5 text-xs ${chipBg}`}>
                      <span className="font-medium">{s.name}</span>
                      {s.pivot?.level && <span className="opacity-60"> · {LEVEL_LABEL[s.pivot.level] || s.pivot.level}</span>}
                      {s.pivot?.years_experience ? <span className="opacity-60"> · {s.pivot.years_experience} an{s.pivot.years_experience > 1 ? "s" : ""}</span> : null}
                      {s.pivot?.is_featured && <span className="ml-1 text-amber-500">★</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EXPÉRIENCES */}
      {experiences.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><Briefcase size={18} /> Expériences</h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="border-l-2 pl-4" style={{ borderColor: accent }}>
                <p className={`font-semibold ${textPrimary}`}>{exp.title}</p>
                <p className={`text-sm ${textSecondary}`}>{exp.company}</p>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  {exp.start_date && new Date(exp.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                  {" → "}
                  {exp.is_current ? "Aujourd'hui" : exp.end_date && new Date(exp.end_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                </p>
                {exp.description && <p className={`mt-1 text-sm ${textSecondary}`}>{exp.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORMATIONS */}
      {educations.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><GraduationCap size={18} /> Formations</h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="border-l-2 pl-4" style={{ borderColor: accent }}>
                <p className={`font-semibold ${textPrimary}`}>{edu.degree}</p>
                <p className={`text-sm ${textSecondary}`}>{edu.institution}</p>
                {edu.field_of_study && <p className={`text-xs ${textSecondary}`}>{edu.field_of_study}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CERTIFICATIONS */}
      {certifications.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><Award size={18} /> Certifications</h2>
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="border-l-2 pl-4" style={{ borderColor: accent }}>
                <p className={`font-semibold ${textPrimary}`}>{cert.name}</p>
                <p className={`text-sm ${textSecondary}`}>{cert.issuing_organization}</p>
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: accent }}>
                    Vérifier <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LANGUES */}
      {languages.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><LanguagesIcon size={18} /> Langues</h2>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span key={lang.id} className={`rounded-full px-3 py-1.5 text-xs ${chipBg}`}>
                <span className="font-medium">{lang.name}</span>
                {lang.level && <span className="opacity-60"> · {LANG_LEVEL[lang.level] || lang.level}</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* PROJETS */}
      {projects.length > 0 && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><Sparkles size={18} /> Projets & réalisations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className={`rounded-xl border p-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accent }}>
                  {p.technologies?.[0] ? "Projet" : "Réalisation"}
                </p>
                <p className={`font-semibold ${textPrimary}`}>{p.title}</p>
                {p.description && <p className={`mt-1 text-sm ${textSecondary} line-clamp-2`}>{p.description}</p>}
                {p.technologies?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.technologies.map((t, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${chipBg}`}>{t}</span>)}
                  </div>
                )}
                {p.project_url && (
                  <a href={p.project_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: accent }}>
                    Voir <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ✅ CONTACT (téléphone + origine) */}
      {(hasPhone || hasOrigin) && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-3 ${textPrimary}`}>Contact</h2>
          <div className="space-y-2">
            {hasPhone && (
              <p className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                <Phone size={14} /> {user.phone}
              </p>
            )}
            {hasOrigin && (
              <p className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                <Globe size={14} /> Origine : {user.country}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ✅ CV */}
      {hasCv && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-3 ${textPrimary}`}>Curriculum Vitae</h2>
          <a
            href={`http://localhost:8000/storage/${profile.cv_path}`}
            target="_blank"
            rel="noreferrer"
            className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all hover:shadow-md ${
              isDark
                ? "border-white/10 bg-white/5 hover:border-white/20"
                : "border-slate-200 bg-gradient-to-r from-slate-50 to-white hover:border-navy"
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30">
                <FileText size={20} className="text-white" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 text-[9px] font-bold text-rose-600 shadow-sm">
                  PDF
                </span>
              </div>
              <div className="min-w-0">
                <p className={`truncate font-semibold ${textPrimary}`}>Mon CV</p>
                <p className={`text-xs ${textSecondary}`}>Cliquez pour consulter</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all group-hover:scale-105"
                 style={{ backgroundColor: accent }}>
              <ExternalLink size={12} /> Ouvrir
            </div>
          </a>
        </section>
      )}

      {/* LIENS */}
      {hasLinks && (
        <section className={`rounded-2xl border p-6 ${cardBg}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><LinkIcon size={18} /> Liens externes</h2>
          <div className="flex flex-wrap gap-3">
            {links.portfolio && (
              <a href={links.portfolio} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80 ${isDark ? "border-white/20 text-white" : "border-slate-200 text-navy"}`}>
                <Globe size={14} /> Portfolio
              </a>
            )}
            {links.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80 ${isDark ? "border-white/20 text-white" : "border-slate-200 text-navy"}`}>
                <Briefcase size={14} /> LinkedIn
              </a>
            )}
            {links.github && (
              <a href={links.github} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80 ${isDark ? "border-white/20 text-white" : "border-slate-200 text-navy"}`}>
                <Code size={14} /> GitHub
              </a>
            )}
            {links.behance && (
              <a href={links.behance} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80 ${isDark ? "border-white/20 text-white" : "border-slate-200 text-navy"}`}>
                <Globe size={14} /> Behance
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}