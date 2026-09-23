import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Edit, X, MapPin, GraduationCap, ShieldCheck,
  Eye, ExternalLink, Check, Briefcase, AlertCircle,
  Palette, Globe2, Phone, FileText, Sparkles, Search,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import api from "../services/api";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";

const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
const LEVEL_LABEL = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };

const STUDY_LEVELS = [
  { value: "L1", label: "Licence 1" },
  { value: "L2", label: "Licence 2" },
  { value: "L3", label: "Licence 3" },
  { value: "M1", label: "Master 1" },
  { value: "M2", label: "Master 2" },
  { value: "Doctorat", label: "Doctorat" },
  { value: "BTS", label: "BTS" },
  { value: "DUT", label: "DUT" },
  { value: "Autre", label: "Autre" },
];

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

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const [profileRes, availRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/availability").catch(() => ({ data: [] })),
      ]);
      const profileData = profileRes.data;
      profileData.availability_windows = availRes.data || [];
      setProfile(profileData);
      setAvailability(availRes.data || []);

      if (profileData) {
        try {
          const pf = await api.get("/portfolio/my");
          setPortfolio(pf.data);
        } catch { setPortfolio(null); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (text) => { setToast(text); setTimeout(() => setToast(null), 2500); };
  const openModal = (type, item = null) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const handleDelete = async (type, id) => {
    if (!confirm("Supprimer cet élément ?")) return;
    const endpoints = { experience: "/experiences", education: "/educations", certification: "/certifications", language: "/languages" };
    try {
      await api.delete(`${endpoints[type]}/${id}`);
      flash("Élément supprimé");
      load();
    } catch { flash("Erreur lors de la suppression"); }
  };

  const detachSkill = async (id) => {
    try { await api.delete(`/skills/${id}/detach`); flash("Compétence retirée"); load(); }
    catch { flash("Erreur"); }
  };

  const deleteProject = async (id) => {
    if (!confirm("Supprimer ce projet ?")) return;
    try { await api.delete(`/portfolio/projects/${id}`); flash("Projet supprimé"); load(); }
    catch { flash("Erreur"); }
  };

  const deleteAvailability = async (id) => {
    if (!confirm("Supprimer cette disponibilité ?")) return;
    try {
      await api.delete(`/availability/${id}`);
      flash("Disponibilité supprimée");
      load();
    } catch { flash("Erreur"); }
  };

  const toggleVisibility = async () => {
    const newVisibility = profile.visibility === "public" ? "private" : "public";
    try {
      await api.patch("/profile/visibility", { visibility: newVisibility });
      flash(newVisibility === "public" ? "Profil rendu public" : "Profil rendu privé");
      load();
    } catch (err) {
      flash("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  const changeTheme = async (themeId) => {
    if (!portfolio || portfolio.theme === themeId) return;
    try {
      await api.patch("/portfolio", { theme: themeId });
      setPortfolio({ ...portfolio, theme: themeId });
    } catch (err) {
      flash("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  if (loading) {
    return <AppShell><div className="flex h-64 items-center justify-center text-sm text-slate-400">Chargement...</div></AppShell>;
  }

  if (!profile) {
    return (
      <AppShell>
        <EmptyProfileCreate onCreated={load} />
      </AppShell>
    );
  }

  const nextAvail = (profile.availability_windows || [])
    .filter((a) => a.status === "available" && new Date(a.end_at) >= new Date())
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0];

  const latestEducation = (profile.educations || [])[0];
  const hasAnyLink = profile.linkedin_url || profile.github_url || profile.behance_url || profile.portfolio_url;

  const checklist = [
    { done: (profile.skills || []).length > 0, label: "Compétences renseignées", action: () => openModal("skill") },
    { done: (profile.experiences || []).length > 0, label: "Ajouter une expérience", action: () => openModal("experience") },
    { done: hasAnyLink, label: "Ajouter un lien professionnel", action: () => openModal("info") },
    { done: (profile.educations || []).length > 0, label: "Ajouter une formation", action: () => openModal("education") },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  // ✅ Compteurs Young Talent
  const academicProjects = (portfolio?.projects || []).filter(p => p.project_type === "academic").length;
  const personalProjects = (portfolio?.projects || []).filter(p => p.project_type === "personal").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">

        {/* ===== HEADER COMPACT ===== */}
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white">Mon profil</h1>
            <p className="text-xs text-slate-500">Portfolio, compétences et disponibilité</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {portfolio?.public_slug ? (
              <Link to={`/portfolio/${portfolio.public_slug}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5">
                <Eye size={13} /> Aperçu
              </Link>
            ) : (
              <button onClick={() => navigate("/portfolio/create")}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5">
                <Eye size={13} /> Créer
              </button>
            )}
            <button onClick={() => openModal("info")}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400">
              <Edit size={13} /> Modifier
            </button>
          </div>
        </div>

        {toast && (
          <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            {toast}
          </div>
        )}

        {/* ===== LAYOUT 2 COLONNES ===== */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* ---- COLONNE PRINCIPALE ---- */}
          <div className="space-y-4 lg:col-span-2">

            {/* Carte identité */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="h-16 rounded-t-lg bg-gradient-to-r from-[#0F1E45] to-emerald-600/30" />

              <div className="px-5 pb-5">
                <div className="-mt-10 flex items-end gap-4">
                  {profile.avatar_path ? (
                    <img src={`http://localhost:8000/storage/${profile.avatar_path}`}
                      className="h-16 w-16 rounded-lg border-4 border-[#0A1229] object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-[#0A1229] bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white">
                      {(profile.user?.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-white">{profile.user?.name}</h2>
                      {profile.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          <ShieldCheck size={10} /> Vérifié
                        </span>
                      )}
                      {/* ✅ BADGE YOUNG TALENT */}
                      {profile.is_young_talent && (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          <Sparkles size={10} /> Young Talent
                        </span>
                      )}
                      {profile.looking_for_opportunity && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                          <Search size={10} /> En recherche
                        </span>
                      )}
                      {nextAvail && (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                          Dispo {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-emerald-400">
                      {profile.headline} {profile.profile_type === "student" ? "· Jeune talent" : "· Talent"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {(profile.city || profile.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country}
                        </span>
                      )}
                      {profile.user?.country && profile.user.country !== profile.country && (
                        <span className="flex items-center gap-1">
                          <Globe2 size={11} /> Origine : {profile.user.country}
                        </span>
                      )}
                      {/* ✅ Formation actuelle (Young Talent) */}
                      {profile.university && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <GraduationCap size={11} />
                          {profile.study_level && `${profile.study_level} · `}
                          {profile.field_of_study || profile.university}
                        </span>
                      )}
                      {!profile.university && latestEducation && (
                        <span className="flex items-center gap-1"><GraduationCap size={11} /> {latestEducation.degree}</span>
                      )}
                    </div>
                  </div>
                </div>

                {profile.bio && <p className="mt-3 text-xs leading-relaxed text-slate-400">{profile.bio}</p>}

                <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
                  {profile.user?.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone size={12} className="text-slate-500" />
                      {profile.user.phone}
                    </div>
                  )}
                  {profile.cv_path && (
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-rose-400" />
                      <a href={`http://localhost:8000/storage/${profile.cv_path}`}
                        target="_blank" rel="noreferrer"
                        className="text-slate-400 transition hover:text-emerald-400">
                        Mon CV
                      </a>
                      <span className="text-[10px] text-slate-600">PDF</span>
                    </div>
                  )}
                  {(profile.portfolio_url || profile.linkedin_url || profile.github_url || profile.behance_url) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {profile.portfolio_url && (
                        <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <ExternalLink size={11} /> Portfolio
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <ExternalLink size={11} /> LinkedIn
                        </a>
                      )}
                      {profile.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <ExternalLink size={11} /> GitHub
                        </a>
                      )}
                      {profile.behance_url && (
                        <a href={profile.behance_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <ExternalLink size={11} /> Behance
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ CARTE YOUNG TALENT (parcours académique) */}
            {profile.is_young_talent && (profile.university || profile.study_level) && (
              <Card>
                <SectionTitle icon={GraduationCap} title="Parcours académique" />
                <div className="space-y-2">
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-300">
                      {profile.study_level && `${profile.study_level}`}
                      {profile.field_of_study && ` · ${profile.field_of_study}`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {profile.university}
                    </p>
                    {profile.looking_for_opportunity && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        <Search size={9} /> Recherche active
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Carte Disponibilités */}
            <Card>
              <AvailabilitySection
                profile={profile}
                onOpenModal={openModal}
                onDelete={deleteAvailability}
              />
            </Card>

            {/* Carte Apparence du portfolio */}
            {portfolio && (
              <Card>
                <SectionTitle icon={Palette} title="Apparence du portfolio" />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: "minimal",   label: "Minimal",   desc: "Épuré & navy",          preview: "bg-slate-200" },
                    { id: "bold",      label: "Bold",      desc: "Sombre & impactant",    preview: "bg-[#0B1633]" },
                    { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-white/20" },
                    { id: "vibrant",   label: "Vibrant",   desc: "Coloré & moderne",      preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
                  ].map((theme) => {
                    const active = portfolio.theme === theme.id;
                    return (
                      <button key={theme.id} onClick={() => changeTheme(theme.id)}
                        className={`rounded-md border p-2 text-left transition ${
                          active ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}>
                        <div className={`mb-1.5 h-12 rounded ${theme.preview}`} />
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium text-white">{theme.label}</p>
                          {active && <Check size={12} className="text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-500">{theme.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Carte Compétences */}
            <Card>
              <SectionTitle
                title="Compétences clés"
                action={
                  <button onClick={() => openModal("skill")}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-transparent px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/5">
                    <Plus size={11} /> Ajouter
                  </button>
                }
              />
              {(profile.skills || []).length === 0 ? (
                <EmptyState text="Aucune compétence pour l'instant." />
              ) : (
                <div className="space-y-4">
                  {groupSkillsByCategory(profile.skills).map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {group.icon} {group.category}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {group.skills.map((s) => (
                          <div key={s.id} className="group relative rounded-md border border-white/5 bg-white/[0.02] p-2.5">
                            <button onClick={() => detachSkill(s.id)}
                              className="absolute right-1.5 top-1.5 hidden text-slate-600 hover:text-rose-400 group-hover:block">
                              <X size={11} />
                            </button>
                            <div className="flex items-center justify-between gap-1">
                              <p className="truncate text-xs font-medium text-white">{s.name}</p>
                              {s.pivot?.is_featured && <span className="text-[10px] text-amber-400">★</span>}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                              {s.pivot?.years_experience ? ` · ${s.pivot.years_experience} an${s.pivot.years_experience > 1 ? "s" : ""}` : ""}
                            </p>
                            <div className="mt-1.5 h-1 rounded-full bg-white/5">
                              <div className="h-1 rounded-full bg-emerald-400" style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Carte Projets */}
            <Card>
              <SectionTitle
                title="Projets & réalisations"
                action={
                  <button onClick={() => openModal("project")}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-transparent px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/5">
                    <Plus size={11} /> Ajouter
                  </button>
                }
              />
              {!portfolio || (portfolio.projects || []).length === 0 ? (
                <EmptyState text="Aucun projet pour l'instant." action={
                  <button onClick={() => openModal("project")} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
                    Ajoutez-en un
                  </button>
                } />
              ) : (
                <>
                  {/* Compteurs */}
                  {(academicProjects > 0 || personalProjects > 0) && (
                    <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
                      {academicProjects > 0 && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                          🎓 {academicProjects} universitaire{academicProjects > 1 ? "s" : ""}
                        </span>
                      )}
                      {personalProjects > 0 && (
                        <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-300">
                          👤 {personalProjects} personnel{personalProjects > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {portfolio.projects.map((p) => {
                      const typeConfig = {
                        academic:     { icon: "🎓", label: "Universitaire", color: "text-emerald-400", bg: "bg-emerald-500/15" },
                        personal:     { icon: "👤", label: "Personnel",     color: "text-blue-400",   bg: "bg-blue-500/15" },
                        professional: { icon: "💼", label: "Professionnel", color: "text-slate-400", bg: "bg-white/10" },
                      }[p.project_type || "professional"];

                      return (
                        <div key={p.id} className="group relative rounded-md border border-white/10 bg-white/[0.02] p-3">
                          <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                            <button onClick={() => openModal("project", p)} className="text-slate-500 hover:text-emerald-400"><Edit size={11} /></button>
                            <button onClick={() => deleteProject(p.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={11} /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded text-xs ${typeConfig.bg} ${typeConfig.color}`}>
                              {typeConfig.icon}
                            </span>
                            <p className="truncate text-xs font-medium text-white">{p.title}</p>
                          </div>
                          {p.description && <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-400">{p.description}</p>}
                          {p.technologies?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {p.technologies.slice(0, 3).map((t, i) => (
                                <span key={i} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">{t}</span>
                              ))}
                            </div>
                          )}
                          {p.project_url && (
                            <a href={p.project_url} target="_blank" rel="noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300">
                              Voir <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Sections repliables */}
            <CompactSection title="Expériences" items={profile.experiences} onAdd={() => openModal("experience")}
              onEdit={(i) => openModal("experience", i)} onDelete={(id) => handleDelete("experience", id)}
              render={(i) => (<><p className="text-xs font-medium text-white">{i.title}</p><p className="text-[11px] text-slate-500">{i.company}</p></>) } />

            <CompactSection title="Formations" items={profile.educations} onAdd={() => openModal("education")}
              onEdit={(i) => openModal("education", i)} onDelete={(id) => handleDelete("education", id)}
              render={(i) => (
                <>
                  <p className="text-xs font-medium text-white">
                    {i.degree} {i.study_level && <span className="text-emerald-400">· {i.study_level}</span>}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {i.institution}{i.field_of_study && ` · ${i.field_of_study}`}
                  </p>
                </>
              )} />

            <CompactSection title="Certifications" items={profile.certifications} onAdd={() => openModal("certification")}
              onEdit={(i) => openModal("certification", i)} onDelete={(id) => handleDelete("certification", id)}
              render={(i) => (<><p className="text-xs font-medium text-white">{i.name}</p><p className="text-[11px] text-slate-500">{i.issuing_organization}</p></>) } />

            <CompactSection title="Langues" items={profile.languages} onAdd={() => openModal("language")}
              onEdit={(i) => openModal("language", i)} onDelete={(id) => handleDelete("language", id)}
              render={(i) => (<><p className="text-xs font-medium text-white">{i.name}</p><p className="text-[11px] text-slate-500">{LEVEL_LABEL[i.level] || i.level}</p></>) } />

          </div>

          {/* ---- SIDEBAR ---- */}
          <div className="space-y-4">

            {/* Carte Visibilité */}
            <Card>
              <SectionTitle icon={ShieldCheck} title="Visibilité" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Choisissez ce que les organisations peuvent découvrir avant toute mise en relation.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-white">
                    {profile.visibility === "public" ? "Profil public" : "Profil privé"}
                  </p>
                  <p className="text-[10px] text-slate-500">Portfolio visible</p>
                </div>
                <button onClick={toggleVisibility}
                  className={`relative h-5 w-9 rounded-full transition-colors ${profile.visibility === "public" ? "bg-emerald-500" : "bg-white/15"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${profile.visibility === "public" ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Les coordonnées restent masquées.</p>
            </Card>

            {/* Carte Complétion */}
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle title="Complétion" />
                <span className="text-xs font-semibold text-emerald-400">{completion}%</span>
              </div>
              <div className="mb-3 h-1 rounded-full bg-white/5">
                <div className="h-1 rounded-full bg-emerald-400 transition-all" style={{ width: `${completion}%` }} />
              </div>
              <ul className="space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button onClick={c.action} className="flex w-full items-center gap-2 text-left">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-500"}`}>
                        {c.done ? <Check size={10} /> : <Plus size={10} />}
                      </span>
                      <span className={`text-[11px] ${c.done ? "text-slate-400 line-through" : "text-slate-300 hover:text-white"}`}>{c.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/opportunites"
                className="mt-3 block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20">
                Voir les opportunités →
              </Link>
            </Card>

            {/* ✅ Carte Young Talent tips */}
            {profile.is_young_talent && (
              <Card>
                <SectionTitle icon={Sparkles} title="Conseils Young Talent" />
                <ul className="space-y-2 text-[11px] text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-emerald-400">1.</span>
                    Ajoute tes <strong className="text-white">projets universitaires</strong> pour montrer tes compétences.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400">2.</span>
                    Précise tes <strong className="text-white">disponibilités</strong> (stage, alternance, premier emploi).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400">3.</span>
                    Mets à jour ton <strong className="text-white">CV</strong> et ton LinkedIn.
                  </li>
                </ul>
              </Card>
            )}

          </div>
        </div>
      </div>

      {modal && (
        <ModalRouter
          modal={modal}
          profile={profile}
          onClose={closeModal}
          onSaved={() => { closeModal(); load(); }}
          flash={flash}
        />
      )}
    </AppShell>
  );
}

// ============================================
// COMPOSANTS DE BLOC
// ============================================

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon size={12} />} {title}
      </h3>
      {action}
    </div>
  );
}

function EmptyState({ text, action }) {
  return (
    <div className="rounded-md border border-dashed border-white/10 px-3 py-4 text-center">
      <p className="text-[11px] text-slate-500">
        {text} {action && <> <span className="inline">{action}</span></>}
      </p>
    </div>
  );
}

function CompactSection({ title, items = [], onAdd, onEdit, onDelete, render }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white">
          <span className="text-slate-500">{open ? "▾" : "▸"}</span>
          {title}
          <span className="text-[10px] font-normal normal-case tracking-normal text-slate-600">({items.length})</span>
        </button>
        <button onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-transparent px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/5">
          <Plus size={11} /> Ajouter
        </button>
      </div>
      {open && (
        items.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-500">Aucun élément pour l'instant.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {items.map((item) => (
              <div key={item.id} className="group flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0 flex-1">{render(item)}</div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-emerald-400"><Edit size={12} /></button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

function EmptyProfileCreate({ onCreated }) {
  const [form, setForm] = useState({ profile_type: "employee", headline: "", visibility: "public" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.post("/profile", form); onCreated(); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h1 className="text-base font-semibold text-white">Créons votre profil</h1>
      <p className="mt-1 text-xs text-slate-400">Un titre professionnel suffit pour commencer.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <select className={selectCls} value={form.profile_type} onChange={(e) => setForm({ ...form, profile_type: e.target.value })}>
          <option value="employee">Salarié</option>
          <option value="student">Étudiant</option>
        </select>
        <input required placeholder="Titre professionnel" className={inputCls} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <button disabled={saving} className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60">
          {saving ? "Création..." : "Créer mon profil"}
        </button>
      </form>
    </div>
  );
}

// ============================================
// MODAL ROUTER
// ============================================
function ModalRouter({ modal, profile, onClose, onSaved, flash }) {
  const { type, item } = modal;
  if (type === "info") return <InfoModal profile={profile} item={item} onClose={onClose} onSaved={onSaved} />;
  if (type === "skill") return <SkillModal item={item} onClose={onClose} onSaved={onSaved} />;
  if (type === "project") return <ProjectModal item={item} onClose={onClose} onSaved={onSaved} flash={flash} />;
  if (type === "availability") return <AvailabilityModal item={item} onClose={onClose} onSaved={onSaved} />;
  return <EntityModal type={type} item={item} onClose={onClose} onSaved={onSaved} />;
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-[#0F1E45] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================
// STYLES PARTAGÉS
// ============================================
const inputCls =
  "w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20";
const selectCls = inputCls;
const labelCls = "text-[10px] font-semibold uppercase tracking-wide text-slate-500";

// ============================================
// AVAILABILITY MODAL
// ============================================
function AvailabilityModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    start_at: item?.start_at?.slice(0, 10) || "",
    end_at: item?.end_at?.slice(0, 10) || "",
    status: item?.status || "available",
    type: item?.type || "part_time",
    workload_unit: item?.workload_unit || "percentage",
    workload_value: item?.workload_value ?? 100,
    location_type: item?.location_type || "onsite",
    location_city: item?.location_city || "",
    notes: item?.notes || "",
    is_recurring: item?.is_recurring || false,
    recurrence_pattern: item?.recurrence_pattern || "",
  });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!form.start_at || !form.end_at || new Date(form.end_at) < new Date(form.start_at)) {
      setConflict(null); return;
    }
    setChecking(true);
    const timeout = setTimeout(() => {
      api.post("/availability/check-overlap", { start_at: form.start_at, end_at: form.end_at, exclude_id: item?.id })
        .then((res) => setConflict(res.data)).catch(() => setConflict(null)).finally(() => setChecking(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.start_at, form.end_at, item?.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (conflict?.has_overlap || conflict?.has_mission_conflict) return;
    setSaving(true);
    try {
      const payload = { ...form, workload_value: Number(form.workload_value), is_recurring: form.is_recurring, recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null };
      if (item) await api.patch(`/availability/${item.id}`, payload);
      else await api.post("/availability", payload);
      onSaved();
    } catch (err) { alert("Erreur : " + (err.response?.data?.message || "Erreur serveur")); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={item ? "Modifier la disponibilité" : "Ajouter une disponibilité"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Début</label>
            <input type="date" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Fin</label>
            <input type="date" required value={form.end_at} min={form.start_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className={`mt-1 ${inputCls}`} />
          </div>
        </div>

        {checking && <p className="text-[10px] text-slate-500">Vérification...</p>}
        {conflict?.has_overlap && (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <p>Chevauchement : du {new Date(conflict.availability_conflict.start_at).toLocaleDateString("fr-FR")} au {new Date(conflict.availability_conflict.end_at).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
        {conflict?.has_mission_conflict && (
          <div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] text-blue-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <p>Mission existante : du {new Date(conflict.mission_conflict.start_at).toLocaleDateString("fr-FR")} au {new Date(conflict.mission_conflict.end_at).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
        {conflict && !conflict.has_overlap && !conflict.has_mission_conflict && form.start_at && form.end_at && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300">
            <Check size={12} /> Aucun conflit
          </div>
        )}

        <div>
          <label className={labelCls}>Statut</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`mt-1 ${selectCls}`}>
            <option value="available">🟢 Disponible</option>
            <option value="partially_available">🟡 Partiel</option>
            <option value="unavailable">🔴 Indisponible</option>
            <option value="on_mission">🔵 En mission</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`mt-1 ${selectCls}`}>
            <option value="full_time">Temps plein</option>
            <option value="part_time">Temps partiel</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Stage</option>
            <option value="mission">Mission</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Charge</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input type="number" min="0" max="100" value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: e.target.value })} className={inputCls} />
            <select value={form.workload_unit} onChange={(e) => setForm({ ...form, workload_unit: e.target.value })} className={selectCls}>
              <option value="percentage">%</option>
              <option value="hours_per_week">h/sem</option>
              <option value="days_per_week">j/sem</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Localisation</label>
          <select value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })} className={`mt-1 ${selectCls}`}>
            <option value="onsite">🏢 Sur site</option>
            <option value="remote">🏠 Télétravail</option>
            <option value="hybrid">🔄 Hybride</option>
          </select>
          {(form.location_type === "onsite" || form.location_type === "hybrid") && (
            <input type="text" placeholder="Ville" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className={`mt-1.5 ${inputCls}`} />
          )}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
          🔁 Récurrente
        </label>
        {form.is_recurring && (
          <select value={form.recurrence_pattern} onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })} className={selectCls}>
            <option value="">Motif</option>
            <option value="weekly">Hebdo</option>
            <option value="biweekly">Bi-hebdo</option>
            <option value="monthly">Mensuel</option>
          </select>
        )}

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`mt-1 ${inputCls}`} />
        </div>

        <button type="submit" disabled={saving || conflict?.has_overlap || conflict?.has_mission_conflict}
          className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60">
          {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>
    </ModalShell>
  );
}

// ============================================
// INFO MODAL — avec section Young Talent
// ============================================
function InfoModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: profile.user?.first_name || "",
    last_name:  profile.user?.last_name  || "",
    phone:      profile.user?.phone      || "",
    user_country: profile.user?.country  || "",
    profile_type: profile.profile_type || "employee",
    headline: profile.headline || "",
    bio: profile.bio || "",
    country: profile.country || "Madagascar",
    city: profile.city || "",
    visibility: profile.visibility || "public",
    portfolio_url: profile.portfolio_url || "",
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    behance_url: profile.behance_url || "",
    // ✅ Young Talent fields
    is_young_talent: profile.is_young_talent || profile.profile_type === "student",
    looking_for_opportunity: profile.looking_for_opportunity || false,
    university: profile.university || "",
    field_of_study: profile.field_of_study || "",
    study_level: profile.study_level || "",
  });
  const [uploadingCv, setUploadingCv] = useState(false);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Photo trop lourde (max 10 Mo).");
    const fd = new FormData(); fd.append("avatar", file);
    try { await api.post("/profile/avatar", fd); onSaved(); }
    catch (err) { alert("Erreur upload : " + (err.response?.data?.message || err.message)); }
  };

  const uploadCv = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("CV trop lourd (max 5 Mo).");
    setUploadingCv(true);
    const fd = new FormData(); fd.append("cv", file);
    try { await api.post("/profile/cv", fd); alert("✅ CV mis à jour !"); onSaved(); }
    catch (err) { alert("Erreur upload CV : " + (err.response?.data?.message || err.message)); }
    finally { setUploadingCv(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      // 1. Mise à jour du compte utilisateur
      await api.patch("/account/profile", {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        country: form.user_country,
      });

      // 2. Mise à jour du profil professionnel
      await api.patch(`/professional-profiles/${profile.id}`, {
        profile_type: form.profile_type,
        headline: form.headline,
        bio: form.bio,
        country: form.country,
        city: form.city,
        visibility: form.visibility,
        portfolio_url: form.portfolio_url,
        linkedin_url: form.linkedin_url,
        github_url: form.github_url,
        behance_url: form.behance_url,
        // ✅ Young Talent
        is_young_talent: form.is_young_talent,
        looking_for_opportunity: form.looking_for_opportunity,
        university: form.is_young_talent ? form.university : null,
        field_of_study: form.is_young_talent ? form.field_of_study : null,
        study_level: form.is_young_talent ? form.study_level : null,
      });

      // 3. Sync automatique avec Education si Young Talent
      if (form.is_young_talent && form.university) {
        const educationPayload = {
          institution: form.university,
          degree: form.study_level || "Diplôme",
          field_of_study: form.field_of_study,
          study_level: form.study_level,
          is_current: true,
          is_young_talent: true,
        };

        const existingEdu = profile.educations?.[0];
        if (existingEdu) {
          await api.patch(`/educations/${existingEdu.id}`, educationPayload);
        } else {
          await api.post("/educations", educationPayload);
        }
      }

      onSaved();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  return (
    <ModalShell title="Modifier mon profil" onClose={onClose}>
      <div className="mb-3 flex items-center gap-2">
        <label className="cursor-pointer rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/10">
          Changer la photo
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </label>
        <label className="cursor-pointer rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/10">
          {uploadingCv ? "Envoi..." : "Téléverser CV"}
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCv} />
        </label>
      </div>

      <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <section className="space-y-2">
          <p className={labelCls}>Identité</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Prénom</label><input className={`mt-1 ${inputCls}`} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label className={labelCls}>Nom</label><input className={`mt-1 ${inputCls}`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div><label className={labelCls}>Téléphone</label><input className={`mt-1 ${inputCls}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <label className={labelCls}>Pays d'origine</label>
            <select className={`mt-1 ${selectCls}`} value={form.user_country} onChange={(e) => setForm({ ...form, user_country: e.target.value })}>
              <option value="">Sélectionner</option>
              {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* ✅ YOUNG TALENT TOGGLE */}
          <label className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300">
            <input
              type="checkbox"
              checked={form.is_young_talent}
              onChange={(e) => setForm({
                ...form,
                is_young_talent: e.target.checked,
                profile_type: e.target.checked ? "student" : "employee",
              })}
            />
            🎓 Je suis un Young Talent (étudiant / jeune diplômé)
          </label>

          {/* ✅ SECTION PARCOURS ACADÉMIQUE */}
          {form.is_young_talent && (
            <section className="space-y-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Parcours académique
              </p>

              <div>
                <label className={labelCls}>Université / École</label>
                <input
                  className={`mt-1 ${inputCls}`}
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  placeholder="Ex: Université d'Antananarivo"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Niveau d'étude</label>
                  <select
                    className={`mt-1 ${selectCls}`}
                    value={form.study_level}
                    onChange={(e) => setForm({ ...form, study_level: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    {STUDY_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Filière</label>
                  <input
                    className={`mt-1 ${inputCls}`}
                    value={form.field_of_study}
                    onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                    placeholder="Ex: Informatique"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-emerald-300">
                <input
                  type="checkbox"
                  checked={form.looking_for_opportunity}
                  onChange={(e) => setForm({ ...form, looking_for_opportunity: e.target.checked })}
                />
                🔍 Je recherche activement une opportunité (stage, alternance, premier emploi)
              </label>
            </section>
          )}

          <div>
            <label className={labelCls}>Type de profil</label>
            <select className={`mt-1 ${selectCls}`} value={form.profile_type} onChange={(e) => setForm({ ...form, profile_type: e.target.value })}>
              <option value="employee">Salarié</option>
              <option value="student">Étudiant</option>
            </select>
          </div>
          <div><label className={labelCls}>Titre pro *</label><input required className={`mt-1 ${inputCls}`} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div>
          <div><label className={labelCls}>Bio</label><textarea rows={3} className={`mt-1 ${inputCls}`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className={labelCls}>Localisation</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Pays</label>
              <select className={`mt-1 ${selectCls}`} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">Sélectionner</option>
                {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input list="city-list" className={`mt-1 ${inputCls}`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className={labelCls}>Liens externes</p>
          {[
            ["portfolio_url", "Portfolio", "https://monportfolio.com"],
            ["linkedin_url", "LinkedIn", "https://linkedin.com/in/..."],
            ["github_url", "GitHub", "https://github.com/..."],
            ["behance_url", "Behance", "https://behance.net/..."],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input type="url" placeholder={placeholder} className={`mt-1 ${inputCls}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </section>

        <button className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400">
          Enregistrer
        </button>
      </form>
    </ModalShell>
  );
}

// ============================================
// SKILL MODAL
// ============================================
function SkillModal({ item, onClose, onSaved }) {
  const [allSkills, setAllSkills] = useState([]);
  const [rootCategories, setRootCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(item || null);
  const [level, setLevel] = useState(item?.pivot?.level || "intermediate");
  const [years, setYears] = useState(item?.pivot?.years_experience || "");
  const [notes, setNotes] = useState(item?.pivot?.notes || "");
  const [isFeatured, setIsFeatured] = useState(item?.pivot?.is_featured || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/skill-categories"), api.get("/skills", { params: { limit: 500, sort: "popular" } })])
      .then(([catRes, skillsRes]) => { setRootCategories(catRes.data); setAllSkills(skillsRes.data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = allSkills.filter((s) => {
    if (activeCategory) {
      const rootId = s.category?.parent?.id || s.category?.id;
      if (rootId !== activeCategory.id) return false;
    }
    if (search.trim().length === 0) return true;
    return normalize(s.name).includes(normalize(search));
  }).slice(0, 50);

  const createNewSkill = async () => {
    if (search.trim().length < 2) return;
    try {
      const subCategories = rootCategories.flatMap((root) => (root.children || []).map((sub) => ({ id: sub.id, label: `${root.name} › ${sub.name}` })));
      const choice = prompt(`Sous-catégorie ?\n\n` + subCategories.map((s, i) => `${i + 1}. ${s.label}`).join("\n"));
      const categoryId = subCategories[Number(choice) - 1]?.id || null;
      const res = await api.post("/skills", { name: search.trim(), skill_category_id: categoryId });
      setAllSkills([...allSkills, res.data]);
      setSelectedSkill(res.data); setSearch(""); setActiveCategory(null);
    } catch (err) { alert("Erreur : " + (err.response?.data?.message || err.message)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setSaving(true);
    try {
      const payload = { skill_id: selectedSkill.id, level, years_experience: years === "" ? null : Number(years), notes: notes || null, is_featured: isFeatured };
      if (item) await api.patch(`/skills/${item.id}/level`, payload);
      else await api.post("/skills/attach", payload);
      onSaved();
    } catch (err) { alert("Erreur: " + (err.response?.data?.message || "Erreur serveur")); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={item ? "Modifier la compétence" : "Ajouter une compétence"} onClose={onClose}>
      {loading ? <p className="py-6 text-center text-xs text-slate-500">Chargement...</p> : (
        <form onSubmit={submit} className="space-y-2.5">
          <div>
            <label className={labelCls}>Rechercher</label>
            <div className="relative mt-1">
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedSkill(null); }}
                placeholder="Ex: Laravel, SEO..." autoFocus className={inputCls} />
              {search && (
                <button type="button" onClick={() => { setSearch(""); setSelectedSkill(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setActiveCategory(null)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${!activeCategory ? "bg-emerald-500 text-[#0A1229]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              Toutes
            </button>
            {rootCategories.map((cat) => (
              <button key={cat.id} type="button"
                onClick={() => setActiveCategory(activeCategory?.id === cat.id ? null : cat)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${activeCategory?.id === cat.id ? "bg-emerald-500 text-[#0A1229]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <div className="max-h-60 overflow-y-auto rounded-md border border-white/10 bg-white/[0.02]">
            {filtered.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-[11px] text-slate-500">Aucun résultat</p>
                {search.trim().length >= 2 && (
                  <button type="button" onClick={createNewSkill}
                    className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-[#0A1229] hover:bg-emerald-400">
                    <Plus size={10} /> Créer "{search}"
                  </button>
                )}
              </div>
            ) : (
              filtered.map((s) => {
                const isSelected = selectedSkill?.id === s.id;
                const rootCategory = s.category?.parent;
                const subCategory = s.category;
                const rootName = rootCategory?.name || subCategory?.name || "Non classée";
                const rootIcon = rootCategory?.icon || subCategory?.icon || "🏷️";
                const breadcrumb = rootCategory ? `${rootName} › ${subCategory?.name}` : rootName;
                return (
                  <button key={s.id} type="button" onClick={() => setSelectedSkill(s)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left transition ${isSelected ? "border-l-2 border-emerald-400 bg-emerald-500/10" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{rootIcon}</span>
                      <div>
                        <p className="text-[11px] font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500">{breadcrumb}</p>
                      </div>
                    </div>
                    {isSelected && <Check size={12} className="text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>

          {selectedSkill && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px]">
              <span className="text-slate-400">Sélection :</span>{" "}
              <span className="font-semibold text-emerald-300">{selectedSkill.name}</span>
            </div>
          )}

          <div>
            <label className={labelCls}>Niveau</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={`mt-1 ${selectCls}`}>
              <option value="beginner">🌱 Débutant</option>
              <option value="intermediate">📘 Intermédiaire</option>
              <option value="advanced">🚀 Avancé</option>
              <option value="expert">🏆 Expert</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Années d'expérience</label>
            <input type="number" min="0" max="60" value={years} onChange={(e) => setYears(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>

          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            ⭐ Mettre en avant
          </label>

          <button type="submit" disabled={saving || !selectedSkill}
            className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60">
            {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter"}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

// ============================================
// PROJECT MODAL — avec type de projet
// ============================================
function ProjectModal({ item, onClose, onSaved, flash }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    project_url: item?.project_url || "",
    start_date: item?.start_date || "",
    end_date: item?.end_date || "",
    project_type: item?.project_type || "professional", // ✅ AJOUT
  });
  const [techInput, setTechInput] = useState((item?.technologies || []).join(", "));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const technologies = techInput.split(",").map((t) => t.trim()).filter(Boolean);
    const data = { ...form, technologies };
    if (!data.project_url) delete data.project_url;
    if (!data.start_date) delete data.start_date;
    if (!data.end_date) delete data.end_date;
    try {
      if (item) await api.patch(`/portfolio/projects/${item.id}`, data);
      else await api.post("/portfolio/projects", data);
      onSaved();
    } catch (err) { flash("Erreur : " + (err.response?.data?.message || "Erreur serveur")); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={item ? "Modifier le projet" : "Ajouter un projet"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5">
        <input required placeholder="Titre" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={3} placeholder="Description" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        {/* ✅ TYPE DE PROJET */}
        <div>
          <label className={labelCls}>Type de projet</label>
          <select
            value={form.project_type}
            onChange={(e) => setForm({ ...form, project_type: e.target.value })}
            className={`mt-1 ${selectCls}`}
          >
            <option value="academic">🎓 Projet universitaire</option>
            <option value="personal">👤 Projet personnel</option>
            <option value="professional">💼 Projet professionnel</option>
          </select>
        </div>

        <input type="url" placeholder="Lien du projet" className={inputCls} value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <input placeholder="Technologies (virgules)" className={inputCls} value={techInput} onChange={(e) => setTechInput(e.target.value)} />
        <button type="submit" disabled={saving}
          className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60">
          {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>
    </ModalShell>
  );
}

// ============================================
// ENTITY MODAL — avec study_level
// ============================================
function EntityModal({ type, item, onClose, onSaved }) {
  const editingId = item?.id || null;
  const [form, setForm] = useState(item || getDefaultForm(type));

  function getDefaultForm(t) {
    switch (t) {
      case "experience": return { title: "", company: "", location: "", start_date: "", end_date: "", is_current: false, description: "" };
      case "education": return { institution: "", degree: "", field_of_study: "", study_level: "", start_date: "", end_date: "", is_current: false, is_young_talent: false };
      case "certification": return { name: "", issuing_organization: "", issue_date: "", credential_url: "" };
      case "language": return { name: "", level: "conversational" };
      default: return {};
    }
  }

  const titles = {
    experience: editingId ? "Modifier l'expérience" : "Ajouter une expérience",
    education: editingId ? "Modifier la formation" : "Ajouter une formation",
    certification: editingId ? "Modifier la certification" : "Ajouter une certification",
    language: editingId ? "Modifier la langue" : "Ajouter une langue",
  };

  const handleChange = (e) => {
    const { name, value, type: t, checked } = e.target;
    setForm({ ...form, [name]: t === "checkbox" ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    const endpoints = { experience: "/experiences", education: "/educations", certification: "/certifications", language: "/languages" };
    try {
      if (editingId) await api.patch(`${endpoints[type]}/${editingId}`, form);
      else await api.post(endpoints[type], form);
      onSaved();
    } catch (err) { alert("Erreur: " + (err.response?.data?.message || "Erreur serveur")); }
  };

  return (
    <ModalShell title={titles[type]} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5">
        {type === "experience" && (<>
          <input required name="title" placeholder="Poste" className={inputCls} value={form.title || ""} onChange={handleChange} />
          <input required name="company" placeholder="Entreprise" className={inputCls} value={form.company || ""} onChange={handleChange} />
          <input name="location" placeholder="Lieu" className={inputCls} value={form.location || ""} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" name="start_date" className={inputCls} value={form.start_date || ""} onChange={handleChange} />
            <input type="date" name="end_date" disabled={form.is_current} className={inputCls} value={form.end_date || ""} onChange={handleChange} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" name="is_current" checked={form.is_current || false} onChange={handleChange} /> Poste actuel</label>
          <textarea name="description" placeholder="Description" rows={2} className={inputCls} value={form.description || ""} onChange={handleChange} />
        </>)}

        {type === "education" && (<>
          <input required name="institution" placeholder="Établissement" className={inputCls} value={form.institution || ""} onChange={handleChange} />
          <input required name="degree" placeholder="Diplôme" className={inputCls} value={form.degree || ""} onChange={handleChange} />

          {/* ✅ NOUVEAU : Niveau d'étude */}
          <div>
            <label className={labelCls}>Niveau d'étude</label>
            <select name="study_level" className={`mt-1 ${selectCls}`} value={form.study_level || ""} onChange={handleChange}>
              <option value="">Sélectionner</option>
              {STUDY_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <input name="field_of_study" placeholder="Filière" className={inputCls} value={form.field_of_study || ""} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" name="start_date" className={inputCls} value={form.start_date || ""} onChange={handleChange} />
            <input type="date" name="end_date" disabled={form.is_current} className={inputCls} value={form.end_date || ""} onChange={handleChange} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" name="is_current" checked={form.is_current || false} onChange={handleChange} /> En cours</label>

          {/* ✅ NOUVEAU : Young Talent flag */}
          <label className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-300">
            <input type="checkbox" name="is_young_talent" checked={form.is_young_talent || false} onChange={handleChange} />
            🎓 Formation en cours (Young Talent)
          </label>
        </>)}

        {type === "certification" && (<>
          <input required name="name" placeholder="Nom" className={inputCls} value={form.name || ""} onChange={handleChange} />
          <input required name="issuing_organization" placeholder="Organisme" className={inputCls} value={form.issuing_organization || ""} onChange={handleChange} />
          <input required type="date" name="issue_date" className={inputCls} value={form.issue_date || ""} onChange={handleChange} />
          <input name="credential_url" placeholder="Lien" className={inputCls} value={form.credential_url || ""} onChange={handleChange} />
        </>)}

        {type === "language" && (<>
          <select required name="name" className={selectCls} value={form.name || ""} onChange={handleChange}>
            <option value="">Choisir une langue</option>
            {["Français", "Anglais", "Malagasy", "Espagnol", "Allemand", "Italien", "Portugais", "Russe", "Chinois", "Japonais", "Arabe", "Hindi"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select name="level" className={selectCls} value={form.level || "conversational"} onChange={handleChange}>
            <option value="basic">Notions</option>
            <option value="conversational">Intermédiaire</option>
            <option value="fluent">Courant</option>
            <option value="native">Langue maternelle</option>
          </select>
        </>)}

        <button className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400">
          {editingId ? "Mettre à jour" : "Enregistrer"}
        </button>
      </form>
    </ModalShell>
  );
}