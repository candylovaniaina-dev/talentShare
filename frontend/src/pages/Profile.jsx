import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Edit, X, MapPin, Calendar, GraduationCap, ShieldCheck,
  Eye, ArrowLeft, ExternalLink, Check, Briefcase, AlertCircle, Clock,
  Palette, Globe2, Phone, FileText, Download,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import api from "../services/api";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";

const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
const LEVEL_LABEL = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };

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
    return <AppShell><div className="flex h-64 items-center justify-center text-slate-400">Chargement...</div></AppShell>;
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

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Mon portfolio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Un profil qui raconte plus qu'un CV.</h1>
            <p className="mt-2 max-w-xl text-slate-500">
              Présentez vos compétences, vos projets et votre disponibilité avec le niveau de visibilité qui vous convient.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {portfolio?.public_slug ? (
              <Link to={`/portfolio/${portfolio.public_slug}`}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-navy">
                <Eye size={15} /> Aperçu public
              </Link>
            ) : (
              <button onClick={() => navigate("/portfolio/create")}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 hover:border-navy hover:text-navy">
                <Eye size={15} /> Créer mon portfolio
              </button>
            )}
            <button onClick={() => openModal("info")}
              className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              <Edit size={15} /> Modifier
            </button>
          </div>
        </div>

        {toast && <div className="mt-4 rounded-xl bg-mint/10 px-4 py-2 text-sm font-medium text-navy">{toast}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Carte identité */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="h-20 bg-gradient-to-r from-navy to-navy-light" />
              <div className="px-6 pb-6">
                <div className="-mt-10 flex items-end gap-4">
                  {profile.avatar_path ? (
                    <img src={`http://localhost:8000/storage/${profile.avatar_path}`} className="h-20 w-20 rounded-2xl border-4 border-white object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-mint/20 text-xl font-bold text-navy">
                      {(profile.user?.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{profile.user?.name}</h2>
                  {profile.is_verified && (
                    <span className="flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-xs font-semibold text-navy">
                      <ShieldCheck size={12} /> Vérifié
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-mint">
                  {profile.headline} {profile.profile_type === "student" ? "· Jeune talent" : "· Talent"}
                </p>

                {nextAvail && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Disponible dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                )}

                {/* Localisation + éducation */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {profile.city && profile.country ? `${profile.city}, ${profile.country}` :
                       profile.city || profile.country}
                    </span>
                  )}
                  {profile.user?.country && profile.user.country !== profile.country && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Globe2 size={13} /> Origine : {profile.user.country}
                    </span>
                  )}
                  {latestEducation && (
                    <span className="flex items-center gap-1"><GraduationCap size={13} /> {latestEducation.degree}</span>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>}

                {/* ====== CONTACT (téléphone) ====== */}
                {profile.user?.phone && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Contact</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" /> {profile.user.phone}
                      </span>
                    </div>
                  </div>
                )}

                {/* ====== CV MODERNE ====== */}
                {profile.cv_path && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Curriculum Vitae</p>
                    <a
                      href={`http://localhost:8000/storage/${profile.cv_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 transition-all hover:border-navy hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30">
                          <FileText size={20} className="text-white" />
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 text-[9px] font-bold text-rose-600 shadow-sm">
                            PDF
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">Mon CV</p>
                          <p className="text-xs text-slate-400">Cliquez pour consulter</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-all group-hover:bg-navy-light group-hover:scale-105">
                        <ExternalLink size={12} /> Ouvrir
                      </div>
                    </a>
                  </div>
                )}

                {/* ====== LIENS EXTERNES ====== */}
                {(profile.portfolio_url || profile.linkedin_url || profile.github_url || profile.behance_url) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Liens externes</p>
                    <div className="flex flex-wrap gap-3">
                      {profile.portfolio_url && (
                        <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 text-sm text-navy hover:underline">
                          <ExternalLink size={14} /> Portfolio
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 text-sm text-navy hover:underline">
                          <ExternalLink size={14} /> LinkedIn
                        </a>
                      )}
                      {profile.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 text-sm text-navy hover:underline">
                          <ExternalLink size={14} /> GitHub
                        </a>
                      )}
                      {profile.behance_url && (
                        <a href={profile.behance_url} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 text-sm text-navy hover:underline">
                          <ExternalLink size={14} /> Behance
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilités */}
            <AvailabilitySection
              profile={profile}
              onOpenModal={openModal}
              onDelete={deleteAvailability}
            />

            {/* Apparence du portfolio */}
            {portfolio && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Palette size={18} className="text-navy" />
                    <div>
                      <h3 className="font-bold">Apparence du portfolio</h3>
                      <p className="text-sm text-slate-400">Choisissez le style de votre page publique.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: "minimal",   label: "Minimal",   desc: "Épuré & navy",          preview: "bg-slate-100" },
                    { id: "bold",      label: "Bold",      desc: "Sombre & impactant",    preview: "bg-[#0B1633]" },
                    { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-slate-200" },
                    { id: "vibrant",   label: "Vibrant",   desc: "Coloré & moderne",      preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
                  ].map((theme) => {
                    const active = portfolio.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => changeTheme(theme.id)}
                        className={`text-left rounded-2xl border-2 p-3 transition ${
                          active ? "border-navy ring-2 ring-navy/20" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className={`h-20 rounded-xl mb-2 ${theme.preview}`} />
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{theme.label}</p>
                            <p className="text-xs text-slate-400">{theme.desc}</p>
                          </div>
                          {active && <Check size={16} className="text-navy flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compétences clés */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">Compétences clés</h3>
                  <p className="text-sm text-slate-400">Niveaux déclarés et enrichis au fil des projets.</p>
                </div>
                <button onClick={() => openModal("skill")} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy">
                  <Plus size={13} /> Ajouter
                </button>
              </div>

              {(profile.skills || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Aucune compétence pour l'instant.</p>
              ) : (
                <div className="mt-4 space-y-5">
                  {groupSkillsByCategory(profile.skills).map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                        {group.icon} {group.category}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {group.skills.map((s) => (
                          <div key={s.id} className="group relative rounded-2xl bg-slate-50 p-4">
                            <button onClick={() => detachSkill(s.id)} className="absolute right-2 top-2 hidden text-slate-400 hover:text-red-500 group-hover:block">
                              <X size={14} />
                            </button>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{s.name}</p>
                              {s.pivot?.is_featured && <span className="text-amber-500">★</span>}
                            </div>
                            <p className="text-xs text-slate-400">
                              {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                              {s.pivot?.years_experience ? ` · ${s.pivot.years_experience} an${s.pivot.years_experience > 1 ? "s" : ""}` : ""}
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                              <div className="h-1.5 rounded-full bg-navy" style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{LEVEL_PCT[s.pivot?.level] || 50}% de maîtrise déclarée</p>
                            {s.pivot?.notes && <p className="mt-2 text-xs italic text-slate-500 line-clamp-2">"{s.pivot.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projets */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">Projets & réalisations</h3>
                  <p className="text-sm text-slate-400">Les preuves concrètes donnent de la profondeur au parcours.</p>
                </div>
                <button onClick={() => openModal("project")} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy">
                  <Plus size={13} /> Ajouter
                </button>
              </div>

              {!portfolio || (portfolio.projects || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Aucun projet pour l'instant. <button onClick={() => openModal("project")} className="font-semibold text-navy hover:underline">Ajoutez-en un</button>
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {portfolio.projects.map((p) => (
                    <div key={p.id} className="group relative rounded-2xl border border-slate-200 p-4">
                      <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                        <button onClick={() => openModal("project", p)} className="text-slate-400 hover:text-navy"><Edit size={13} /></button>
                        <button onClick={() => deleteProject(p.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/15 text-navy">
                        <Briefcase size={16} />
                      </span>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mint">
                        {p.technologies?.[0] ? "Projet" : "Réalisation"}
                      </p>
                      <p className="mt-1 font-semibold">{p.title}</p>
                      {p.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                      {p.technologies?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.technologies.map((t, i) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t}</span>)}
                        </div>
                      )}
                      {p.project_url && (
                        <a href={p.project_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
                          Voir <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sections repliables */}
            <CollapsibleSection title="Expériences" items={profile.experiences} onAdd={() => openModal("experience")}
              onEdit={(i) => openModal("experience", i)} onDelete={(id) => handleDelete("experience", id)}
              render={(i) => (<><p className="font-medium">{i.title}</p><p className="text-sm text-slate-500">{i.company}</p></>)} />

            <CollapsibleSection title="Formations" items={profile.educations} onAdd={() => openModal("education")}
              onEdit={(i) => openModal("education", i)} onDelete={(id) => handleDelete("education", id)}
              render={(i) => (<><p className="font-medium">{i.degree}</p><p className="text-sm text-slate-500">{i.institution}</p></>)} />

            <CollapsibleSection title="Certifications" items={profile.certifications} onAdd={() => openModal("certification")}
              onEdit={(i) => openModal("certification", i)} onDelete={(id) => handleDelete("certification", id)}
              render={(i) => (<><p className="font-medium">{i.name}</p><p className="text-sm text-slate-500">{i.issuing_organization}</p></>)} />

            <CollapsibleSection title="Langues" items={profile.languages} onAdd={() => openModal("language")}
              onEdit={(i) => openModal("language", i)} onDelete={(id) => handleDelete("language", id)}
              render={(i) => (<><p className="font-medium">{i.name}</p><p className="text-sm text-slate-500">{LEVEL_LABEL[i.level] || i.level}</p></>)} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-navy p-6 text-white">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-mint">
                <ShieldCheck size={14} /> Visibilité
              </p>
              <h3 className="mt-2 text-lg font-bold">Vous gardez le contrôle.</h3>
              <p className="mt-2 text-sm text-slate-300">
                Choisissez ce que les organisations peuvent découvrir avant toute mise en relation.
              </p>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 p-3">
                <div>
                  <p className="text-sm font-semibold">{profile.visibility === "public" ? "Profil public" : "Profil privé"}</p>
                  <p className="text-xs text-slate-400">Portfolio visible</p>
                </div>
                <button onClick={toggleVisibility}
                  className={`relative h-6 w-11 rounded-full transition-colors ${profile.visibility === "public" ? "bg-mint" : "bg-white/20"}`}>
                 <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${profile.visibility === "public" ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">Les coordonnées restent masquées.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-mint">Profil à {completion}%</p>
              <h3 className="mt-2 font-bold">Encore un peu de contexte ?</h3>
              <p className="mt-1 text-sm text-slate-500">
                Ajoutez une expérience, une langue ou un lien externe pour augmenter la qualité de vos correspondances.
              </p>
              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button onClick={c.action} className="flex w-full items-center gap-2 text-left text-sm">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-mint/20 text-navy" : "bg-slate-100 text-slate-400"}`}>
                        {c.done ? <Check size={12} /> : <Plus size={12} />}
                      </span>
                      <span className={c.done ? "font-medium text-navy" : "text-slate-500 hover:text-navy"}>{c.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/opportunites" className="mt-4 block rounded-full bg-mint/15 px-4 py-2.5 text-center text-sm font-semibold text-navy hover:bg-mint/25">
                Voir les opportunités →
              </Link>
            </div>
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
// COMPOSANTS UTILITAIRES
// ============================================

function CollapsibleSection({ title, items = [], onAdd, onEdit, onDelete, render }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 font-bold">
          {title} <span className="text-sm font-normal text-slate-400">({items.length})</span>
          <span className="text-slate-400">{open ? "▾" : "▸"}</span>
        </button>
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy">
          <Plus size={13} /> Ajouter
        </button>
      </div>
      {open && (
        items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Aucun élément pour l'instant.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-3">
                <div className="flex-1">{render(item)}</div>
                <div className="ml-3 flex gap-2">
                  <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-navy"><Edit size={15} /></button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
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
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-bold">Créons votre profil</h1>
      <p className="mt-1 text-sm text-slate-500">Un titre professionnel suffit pour commencer.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.profile_type} onChange={(e) => setForm({ ...form, profile_type: e.target.value })}>
          <option value="employee">Salarié</option>
          <option value="student">Étudiant</option>
        </select>
        <input required placeholder="Titre professionnel" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <button disabled={saving} className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
      setConflict(null);
      return;
    }
    setChecking(true);
    const timeout = setTimeout(() => {
      api.post("/availability/check-overlap", {
        start_at: form.start_at,
        end_at: form.end_at,
        exclude_id: item?.id,
      })
        .then((res) => setConflict(res.data))
        .catch(() => setConflict(null))
        .finally(() => setChecking(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.start_at, form.end_at, item?.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (conflict?.has_overlap || conflict?.has_mission_conflict) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        workload_value: Number(form.workload_value),
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      };
      if (item) {
        await api.patch(`/availability/${item.id}`, payload);
      } else {
        await api.post("/availability", payload);
      }
      onSaved();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={item ? "Modifier la disponibilité" : "Ajouter une disponibilité"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-500">Début</label>
            <input type="date" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Fin</label>
            <input type="date" required value={form.end_at} min={form.start_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        {checking && <p className="text-xs text-slate-400">Vérification des chevauchements...</p>}
        {conflict?.has_overlap && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Chevauchement détecté</p>
              <p className="text-xs mt-0.5">Du {new Date(conflict.availability_conflict.start_at).toLocaleDateString("fr-FR")} au {new Date(conflict.availability_conflict.end_at).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        )}
        {conflict?.has_mission_conflict && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Mission existante sur cette période</p>
              <p className="text-xs mt-0.5">Du {new Date(conflict.mission_conflict.start_at).toLocaleDateString("fr-FR")} au {new Date(conflict.mission_conflict.end_at).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        )}
        {conflict && !conflict.has_overlap && !conflict.has_mission_conflict && form.start_at && form.end_at && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
            <Check size={16} /> Aucun conflit détecté
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500">Statut</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="available">🟢 Disponible</option>
            <option value="partially_available">🟡 Partiellement disponible</option>
            <option value="unavailable">🔴 Non disponible</option>
            <option value="on_mission">🔵 En mission</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="full_time">Temps plein</option>
            <option value="part_time">Temps partiel</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Stage</option>
            <option value="mission">Mission</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Charge disponible</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <input type="number" min="0" max="100" value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select value={form.workload_unit} onChange={(e) => setForm({ ...form, workload_unit: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="percentage">%</option>
              <option value="hours_per_week">heures/semaine</option>
              <option value="days_per_week">jours/semaine</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Localisation</label>
          <select value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="onsite">🏢 Sur site</option>
            <option value="remote">🏠 Télétravail</option>
            <option value="hybrid">🔄 Hybride</option>
          </select>
          {(form.location_type === "onsite" || form.location_type === "hybrid") && (
            <input type="text" placeholder="Ville (optionnel)" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
          🔁 Disponibilité récurrente
        </label>
        {form.is_recurring && (
          <select value={form.recurrence_pattern} onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Choisir un motif</option>
            <option value="weekly">Chaque semaine</option>
            <option value="biweekly">Toutes les 2 semaines</option>
            <option value="monthly">Chaque mois</option>
          </select>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500">Notes (optionnel)</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Disponible pour missions courtes..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <button type="submit" disabled={saving || conflict?.has_overlap || conflict?.has_mission_conflict} className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter la disponibilité"}
        </button>
      </form>
    </ModalShell>
  );
}

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
  });
  const [uploadingCv, setUploadingCv] = useState(false);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Photo trop lourde (max 10 Mo)."); return; }
    const okFormats = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/heic", "image/heif"];
    if (!okFormats.includes(file.type)) { alert("Format non supporté."); return; }

    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/profile/avatar", fd);
      onSaved();
    } catch (err) {
      alert("Erreur upload : " + (err.response?.data?.message || err.message));
    }
  };

  const uploadCv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { alert("CV trop lourd (max 5 Mo)."); return; }

    const okFormats = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!okFormats.includes(file.type)) { alert("Format non supporté. Utilisez PDF, DOC ou DOCX."); return; }

    setUploadingCv(true);
    const fd = new FormData();
    fd.append("cv", file);

    try {
      await api.post("/profile/cv", fd);
      alert("✅ CV mis à jour !");
      onSaved();
    } catch (err) {
      console.error("Erreur:", err.response?.data);
      alert("Erreur upload CV : " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingCv(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/account/profile", {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        country: form.user_country,
      });

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
      });

      onSaved();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  return (
    <ModalShell title="Modifier mon profil" onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <label className="cursor-pointer text-sm rounded-xl border border-slate-200 px-3 py-1.5 hover:border-navy">
          Changer la photo
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </label>
        <label className="cursor-pointer text-sm rounded-xl border border-slate-200 px-3 py-1.5 hover:border-navy">
          {uploadingCv ? "Envoi..." : "Téléverser CV"}
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCv} />
        </label>
      </div>

      <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-400">Identité</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">Prénom</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Nom</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Téléphone</label>
            <input placeholder="+261 34 12 345 67" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Pays d'origine</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.user_country} onChange={(e) => setForm({ ...form, user_country: e.target.value })}>
              <option value="">Sélectionner</option>
              {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Type de profil</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.profile_type} onChange={(e) => setForm({ ...form, profile_type: e.target.value })}>
              <option value="employee">Salarié</option>
              <option value="student">Étudiant</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Titre professionnel *</label>
            <input required placeholder="Ex: Développeur Laravel senior"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Bio</label>
            <textarea rows={3} placeholder="Décrivez votre parcours..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
        </section>

        <section className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold uppercase text-slate-400">Localisation actuelle</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">Pays</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">Sélectionner</option>
                {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Ville</label>
              <input list="city-list" placeholder="Ex: Antananarivo"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold uppercase text-slate-400">Liens externes</p>
          {[
            ["portfolio_url", "Portfolio", "https://monportfolio.com"],
            ["linkedin_url", "LinkedIn", "https://linkedin.com/in/..."],
            ["github_url", "GitHub", "https://github.com/..."],
            ["behance_url", "Behance", "https://behance.net/..."],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500">{label}</label>
              <input type="url" placeholder={placeholder}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </section>

        <button className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white">
          Enregistrer le profil
        </button>
      </form>
    </ModalShell>
  );
}

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
    Promise.all([
      api.get("/skill-categories"),
      api.get("/skills", { params: { limit: 500, sort: "popular" } }),
    ])
      .then(([catRes, skillsRes]) => {
        setRootCategories(catRes.data);
        setAllSkills(skillsRes.data);
      })
      .catch((err) => console.error("Erreur chargement skills:", err))
      .finally(() => setLoading(false));
  }, []);

  const normalize = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = allSkills
    .filter((s) => {
      if (activeCategory) {
        const rootId = s.category?.parent?.id || s.category?.id;
        if (rootId !== activeCategory.id) return false;
      }
      if (search.trim().length === 0) return true;
      return normalize(s.name).includes(normalize(search));
    })
    .slice(0, 50);

  const createNewSkill = async () => {
    if (search.trim().length < 2) return;
    try {
      const subCategories = rootCategories.flatMap((root) =>
        (root.children || []).map((sub) => ({ id: sub.id, label: `${root.name} › ${sub.name}` }))
      );
      const choice = prompt(
        `Dans quelle sous-catégorie classer "${search}" ?\n\n` +
        subCategories.map((s, i) => `${i + 1}. ${s.label}`).join("\n") +
        "\n\nRéponds par le numéro :"
      );
      const index = Number(choice) - 1;
      const categoryId = subCategories[index]?.id || null;
      const res = await api.post("/skills", { name: search.trim(), skill_category_id: categoryId });
      setAllSkills([...allSkills, res.data]);
      setSelectedSkill(res.data);
      setSearch("");
      setActiveCategory(null);
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setSaving(true);
    try {
      const payload = {
        skill_id: selectedSkill.id,
        level,
        years_experience: years === "" ? null : Number(years),
        notes: notes || null,
        is_featured: isFeatured,
      };
      if (item) {
        await api.patch(`/skills/${item.id}/level`, payload);
      } else {
        await api.post("/skills/attach", payload);
      }
      onSaved();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Erreur serveur"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={item ? "Modifier la compétence" : "Ajouter une compétence"} onClose={onClose}>
      {loading ? (
        <p className="text-center text-slate-400 py-8">Chargement du référentiel...</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Rechercher une compétence</label>
            <div className="relative">
              <input type="text" value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedSkill(null); }}
                placeholder="Ex: Laravel, SEO, Comptabilité, AutoCAD..." autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              {search && (
                <button type="button" onClick={() => { setSearch(""); setSelectedSkill(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {search.length > 0
                ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} pour "${search}"`
                : `${filtered.length} compétence${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
            <button type="button" onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${!activeCategory ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              Toutes
            </button>
            {rootCategories.map((cat) => (
              <button key={cat.id} type="button"
                onClick={() => setActiveCategory(activeCategory?.id === cat.id ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activeCategory?.id === cat.id ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-400">Aucune compétence trouvée</p>
                {search.trim().length >= 2 && (
                  <button type="button" onClick={createNewSkill}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                    <Plus size={14} /> Créer "{search}"
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
                const subName = rootCategory ? subCategory?.name : null;
                const breadcrumb = subName ? `${rootName} › ${subName}` : rootName;

                return (
                  <button key={s.id} type="button" onClick={() => setSelectedSkill(s)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition ${isSelected ? "bg-navy/5 border-l-2 border-navy" : "hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{rootIcon}</span>
                      <div>
                        <p className="text-sm font-medium text-navy">{s.name}</p>
                        <p className="text-xs text-slate-400">{breadcrumb}</p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-navy" />}
                  </button>
                );
              })
            )}
          </div>

          {selectedSkill && (
            <div className="rounded-xl bg-mint/10 px-3 py-2 text-sm">
              <span className="text-slate-500">Compétence choisie :</span>{" "}
              <span className="font-semibold text-navy">
                {selectedSkill.category?.parent?.icon || "🏷️"} {selectedSkill.name}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {selectedSkill.category?.parent?.name || selectedSkill.category?.name || "Non classée"}
                {selectedSkill.category?.parent ? ` › ${selectedSkill.category.name}` : ""}
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500">Niveau</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="beginner">🌱 Débutant</option>
              <option value="intermediate">📘 Intermédiaire</option>
              <option value="advanced">🚀 Avancé</option>
              <option value="expert">🏆 Expert</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Années d'expérience (optionnel)</label>
            <input type="number" min="0" max="60" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Ex: 3" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Notes complémentaires (optionnel)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Projets réalisés, contexte..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            ⭐ Mettre en avant cette compétence
          </label>

          <button type="submit" disabled={saving || !selectedSkill} className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter la compétence"}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

function ProjectModal({ item, onClose, onSaved, flash }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    project_url: item?.project_url || "",
    start_date: item?.start_date || "",
    end_date: item?.end_date || "",
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
      if (item) {
        await api.patch(`/portfolio/projects/${item.id}`, data);
      } else {
        await api.post("/portfolio/projects", data);
      }
      onSaved();
    } catch (err) {
      flash("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={item ? "Modifier le projet" : "Ajouter un projet"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="Titre" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={3} placeholder="Description" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="url" placeholder="Lien du projet" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="rounded-xl border border-slate-200 px-3 py-2" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <input type="date" className="rounded-xl border border-slate-200 px-3 py-2" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <input placeholder="Technologies (séparées par virgule)" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={techInput} onChange={(e) => setTechInput(e.target.value)} />
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Enregistrement..." : (item ? "Mettre à jour" : "Ajouter")}
        </button>
      </form>
    </ModalShell>
  );
}

function EntityModal({ type, item, onClose, onSaved }) {
  const editingId = item?.id || null;
  const [form, setForm] = useState(item || getDefaultForm(type));

  function getDefaultForm(t) {
    switch (t) {
      case "experience": return { title: "", company: "", location: "", start_date: "", end_date: "", is_current: false, description: "" };
      case "education": return { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", is_current: false };
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
    const endpoint = endpoints[type];
    try {
      if (editingId) await api.patch(`${endpoint}/${editingId}`, form);
      else await api.post(endpoint, form);
      onSaved();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  return (
    <ModalShell title={titles[type]} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {type === "experience" && (
          <>
            <input required name="title" placeholder="Intitulé du poste" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.title || ""} onChange={handleChange} />
            <input required name="company" placeholder="Entreprise" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.company || ""} onChange={handleChange} />
            <input name="location" placeholder="Lieu (optionnel)" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.location || ""} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-2">
              <input required type="date" name="start_date" className="rounded-xl border border-slate-200 px-3 py-2" value={form.start_date || ""} onChange={handleChange} />
              <input type="date" name="end_date" disabled={form.is_current} className="rounded-xl border border-slate-200 px-3 py-2" value={form.end_date || ""} onChange={handleChange} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_current" checked={form.is_current || false} onChange={handleChange} /> Poste actuel</label>
            <textarea name="description" placeholder="Description" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.description || ""} onChange={handleChange} />
          </>
        )}
        {type === "education" && (
          <>
            <input required name="institution" placeholder="Établissement" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.institution || ""} onChange={handleChange} />
            <input required name="degree" placeholder="Diplôme" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.degree || ""} onChange={handleChange} />
            <input name="field_of_study" placeholder="Filière" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.field_of_study || ""} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-2">
              <input required type="date" name="start_date" className="rounded-xl border border-slate-200 px-3 py-2" value={form.start_date || ""} onChange={handleChange} />
              <input type="date" name="end_date" disabled={form.is_current} className="rounded-xl border border-slate-200 px-3 py-2" value={form.end_date || ""} onChange={handleChange} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_current" checked={form.is_current || false} onChange={handleChange} /> Formation en cours</label>
          </>
        )}
        {type === "certification" && (
          <>
            <input required name="name" placeholder="Nom" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.name || ""} onChange={handleChange} />
            <input required name="issuing_organization" placeholder="Organisme" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.issuing_organization || ""} onChange={handleChange} />
            <input required type="date" name="issue_date" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.issue_date || ""} onChange={handleChange} />
            <input name="credential_url" placeholder="Lien de vérification" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.credential_url || ""} onChange={handleChange} />
          </>
        )}
        {type === "language" && (
          <>
            <select required name="name" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.name || ""} onChange={handleChange}>
              <option value="">Choisir une langue</option>
              {["Français", "Anglais", "Malagasy", "Espagnol", "Allemand", "Italien", "Portugais", "Russe", "Chinois", "Japonais", "Arabe", "Hindi"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select name="level" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.level || "conversational"} onChange={handleChange}>
              <option value="basic">Notions</option>
              <option value="conversational">Intermédiaire</option>
              <option value="fluent">Courant</option>
              <option value="native">Langue maternelle</option>
            </select>
          </>
        )}
        <button className="w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white">{editingId ? "Mettre à jour" : "Enregistrer"}</button>
      </form>
    </ModalShell>
  );
}