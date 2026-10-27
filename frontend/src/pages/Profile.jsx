import React, { useEffect, useRef, useState, useMemo } from "react";
import { Check, ChevronDown, FolderTree, Plus, Search, X, MapPin, Phone, Building2, MessageCircle, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import MapPicker from "../components/MapPicker";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import PublicPortfolio from "./PublicPortfolio";

/* ============================================================
   CONSTANTES & HELPERS
============================================================ */
const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const STORAGE_URL = "/storage";

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

const LANGUAGE_LEVEL_LABEL = {
  basic: "Notions",
  conversational: "Intermédiaire",
  fluent: "Courant",
  native: "Langue maternelle",
};

const PROJECT_TYPES = {
  academic: {
    label: "Universitaire",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    grad: "from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10",
    ink: "text-emerald-700/25 dark:text-emerald-400/20",
  },
  personal: {
    label: "Personnel",
    cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    grad: "from-sky-100 to-indigo-100 dark:from-sky-500/10 dark:to-indigo-500/10",
    ink: "text-sky-700/25 dark:text-sky-400/20",
  },
  professional: {
    label: "Professionnel",
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
    grad: "from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10",
    ink: "text-slate-600/25 dark:text-slate-400/20",
  },
};

const THEMES = [
  { id: "minimal", label: "Minimal", desc: "Épuré & navy", preview: "bg-slate-200 dark:bg-slate-700" },
  { id: "bold", label: "Bold", desc: "Sombre & impactant", preview: "bg-[#0B1633] dark:bg-black" },
  { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-slate-200 dark:bg-white/10 dark:border-white/10" },
  { id: "vibrant", label: "Vibrant", desc: "Coloré & moderne", preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
];

const CARD = "rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,42,61,0.04)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none";

const FIELD_CLS =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition " +
  "hover:border-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15 " +
  "dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20";

const SKILL_FIELD = FIELD_CLS;
const LABEL_CLS = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";
const PILL_ON = "border-[#0B2A35] bg-[#0B2A35] text-white dark:border-[#13B89A] dark:bg-[#13B89A] dark:text-[#06251F]";
const PILL_OFF = "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-400 dark:hover:bg-white/5";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B2A35] px-4 py-2.5 text-sm font-medium text-white transition " +
  "hover:bg-[#0E3B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-[#13B89A] dark:hover:bg-[#18C6A6] dark:focus-visible:ring-offset-[#112A3A]";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition " +
  "hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-60 " +
  "dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:ring-offset-[#112A3A]";

const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

function getDisplayName(user) {
  if (!user) return "Mon profil";
  if (user.name && user.name.trim()) return user.name;
  const first = user.first_name?.trim() || "";
  const last = user.last_name?.trim() || "";
  if (first || last) return `${first} ${last}`.trim();
  if (user.email) {
    const localPart = user.email.split("@")[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }
  return "Mon profil";
}

function getInitials(user) {
  if (!user) return "?";
  const first = user.first_name?.trim() || "";
  const last = user.last_name?.trim() || "";
  if (first || last) return `${first[0] || ""}${last[0] || ""}`.toUpperCase() || "?";
  if (user.name && user.name.trim()) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
}

const fmtMonth = (value) =>
  value ? new Date(value).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "";

const fmtRange = (item) => {
  const start = fmtMonth(item.start_date);
  const end = item.is_current ? "Présent" : fmtMonth(item.end_date);
  return [start, end].filter(Boolean).join(" – ");
};

const prettyUrl = (url) => {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
};

/* ============================================================
   PAGE PROFIL
============================================================ */

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [myCompanies, setMyCompanies] = useState([]);
 

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const load = async () => {
    try {
      const [profileRes, availRes] = await Promise.all([
        api.get("/profile/me").catch((err) => {
          console.error("Erreur /profile/me :", err.response?.status, err.response?.data);
          return { data: null };
        }),
        api.get("/availability").catch(() => ({ data: [] })),
      ]);

      const profileData = profileRes.data;

      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      profileData.availability_windows = availRes.data || [];
      setProfile(profileData);

      try {
        const pf = await api.get("/portfolio/my");
        setPortfolio(pf.data);
      } catch (err) {
        const status = err.response?.status;
        if (status !== 404 && status !== 422) {
          console.error("Erreur /portfolio/my :", status, err.response?.data);
        }
        setPortfolio(null);
      }
    } catch (e) {
      console.error("Erreur load :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get("/profile/my-companies")
      .then((res) => setMyCompanies(res.data || []))
      .catch(() => setMyCompanies([]));
  }, []);

  const flash = (text, type = "success") => showToast(text, type);
  const openModal = (type, item = null) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const handleDelete = async (type, id) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const endpoints = {
      experience: "/experiences",
      education: "/educations",
      certification: "/certifications",
      language: "/languages",
    };
    try {
      await api.delete(`${endpoints[type]}/${id}`);
      flash("Élément supprimé", "success");
      load();
    } catch {
      flash("Erreur lors de la suppression", "error");
    }
  };

  const detachSkill = async (id) => {
    try {
      await api.delete(`/skills/${id}/detach`);
      flash("Compétence retirée", "success");
      load();
    } catch {
      flash("Erreur", "error");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Supprimer ce projet ?")) return;
    try {
      await api.delete(`/portfolio/projects/${id}`);
      flash("Projet supprimé", "success");
      load();
    } catch {
      flash("Erreur", "error");
    }
  };

  const deleteAvailability = async (id) => {
    if (!window.confirm("Supprimer cette disponibilité ?")) return;
    try {
      await api.delete(`/availability/${id}`);
      flash("Disponibilité supprimée", "success");
      load();
    } catch {
      flash("Erreur", "error");
    }
  };

  const toggleVisibility = async () => {
    const newVisibility = profile.visibility === "public" ? "private" : "public";
    try {
      await api.patch("/profile/visibility", { visibility: newVisibility });
      flash(newVisibility === "public" ? "Profil rendu public" : "Profil rendu privé", "success");
      load();
    } catch (err) {
      flash("Erreur : " + (err.response?.data?.message || "Erreur serveur"), "error");
    }
  };

  const changeTheme = async (themeId) => {
    if (!portfolio || portfolio.theme === themeId) return;
    try {
      await api.patch("/portfolio", { theme: themeId });
      setPortfolio({ ...portfolio, theme: themeId });
    } catch (err) {
      flash("Erreur : " + (err.response?.data?.message || "Erreur serveur"), "error");
    }
  };

  const uploadImage = async (e, field, setBusy, ref, successText, tooBigText) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return flash(tooBigText, "error");
    setBusy(true);
    const fd = new FormData();
    fd.append(field, file);
    try {
      await api.post(`/profile/${field}`, fd);
      flash(successText, "success");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const handleAvatarUpload = (e) =>
    uploadImage(e, "avatar", setUploadingAvatar, avatarInputRef, "Photo de profil mise à jour", "Photo trop lourde (max 10 Mo)");
  const handleCoverUpload = (e) =>
    uploadImage(e, "cover", setUploadingCover, coverInputRef, "Photo de couverture mise à jour", "Image trop lourde (max 10 Mo)");

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <AppShell>
        <EmptyProfileCreate onCreated={load} showToast={showToast} />
      </AppShell>
    );
  }

  const skills = profile.skills || [];
  const experiences = profile.experiences || [];
  const educations = profile.educations || [];
  const projects = portfolio?.projects || [];

  const nextAvail = (profile.availability_windows || [])
    .filter((a) => a.status === "available" && new Date(a.end_at) >= new Date())
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0];

  const links = [
    { key: "linkedin_url", label: "LinkedIn" },
    { key: "portfolio_url", label: "Portfolio personnel" },
    { key: "github_url", label: "GitHub" },
    { key: "behance_url", label: "Behance" },
  ].filter((l) => profile[l.key]);

  const checklist = [
    { done: skills.length > 0, label: "Ajouter des compétences", action: () => openModal("skill") },
    { done: experiences.length > 0, label: "Ajouter une expérience", action: () => openModal("experience") },
    { done: links.length > 0, label: "Ajouter un lien professionnel", action: () => openModal("info") },
    { done: educations.length > 0, label: "Ajouter une formation", action: () => openModal("education") },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const completion = Math.round((doneCount / checklist.length) * 100);
  const missing = checklist.filter((c) => !c.done);

  const ringR = 44;
  const ringC = 2 * Math.PI * ringR;

  return (
    <AppShell>
      {/* ✅ FOND ADAPTÉ AU MODE CLAIR ET SOMBRE */}
      <div className="min-h-screen bg-[#F4F7FA] px-3 py-4 transition-colors duration-300 dark:bg-transparent sm:px-5 sm:py-5">
        <div className="mx-auto max-w-[1500px] text-slate-900 dark:text-slate-200">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ================= COLONNE PRINCIPALE ================= */}
          <div className="min-w-0 space-y-5">
            {/* ----- Carte d'identité ----- */}
            <section className={`overflow-hidden ${CARD}`}>
              <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#0B2A35] via-[#0B3A36] to-[#0E4B42] sm:h-44">
                {profile.cover_path ? (
                  <img
                    src={`${STORAGE_URL}/${profile.cover_path}`}
                    alt="Couverture du profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="absolute right-4 top-4 rounded-lg bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-800 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60 dark:bg-black/50 dark:text-white dark:hover:bg-black/70"
                >
                  {uploadingCover ? "Envoi..." : profile.cover_path ? "Changer la couverture" : "Ajouter une couverture"}
                </button>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>

              <div className="px-5 pb-6 sm:px-7">
                <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="relative w-fit shrink-0">
                    {profile.avatar_path ? (
                      <img
                        src={`${STORAGE_URL}/${profile.avatar_path}`}
                        alt="Photo de profil"
                        className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-sm ring-1 ring-slate-200 dark:border-[#112A3A] dark:ring-white/10"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-600 to-[#0B2A35] text-3xl font-semibold text-white shadow-sm ring-1 ring-slate-200 dark:border-[#112A3A] dark:ring-white/10">
                        {getInitials(profile.user)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B2A35] px-2.5 py-1 text-[11px] font-medium text-white ring-2 ring-white transition hover:bg-[#0E3B3A] focus:outline-none focus-visible:ring-teal-400 disabled:opacity-60 dark:bg-emerald-600 dark:ring-[#112A3A] dark:hover:bg-emerald-500"
                    >
                      {uploadingAvatar ? "Envoi..." : "Changer"}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openModal("info")} className={BTN_PRIMARY}>
                      Modifier le profil
                    </button>
                    {portfolio?.public_slug ? (
                      <button type="button" onClick={() => setPreviewOpen(true)} className={BTN_SECONDARY}>
                        Aperçu public
                      </button>
                    ) : (
                      <button type="button" onClick={() => navigate("/portfolio/create")} className={BTN_SECONDARY}>
                        Créer mon portfolio
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
                      {getDisplayName(profile.user)}
                    </h2>
                    {profile.is_verified && <Chip tone="emerald">Vérifié</Chip>}
                    {profile.is_young_talent && <Chip tone="emerald">Young Talent</Chip>}
                    {profile.looking_for_opportunity && <Chip tone="amber">En recherche</Chip>}
                  </div>

                  {profile.headline && <p className="mt-1 text-sm text-teal-700 dark:text-emerald-400">{profile.headline}</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500 dark:text-slate-400">
                    {(profile.city || profile.country) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                        {[profile.city, profile.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {profile.user?.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400 dark:text-slate-500" />
                        {profile.user.phone}
                      </span>
                    )}
                    {nextAvail && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Disponible dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 line-clamp-3 dark:text-slate-400">{profile.bio}</p>
                  )}

                  {profile.cv_path && (
                    <a
                      href={`${STORAGE_URL}/${profile.cv_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Télécharger mon CV
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* ----- Compétences ----- */}
            <Panel
              title="Compétences clés"
              count={skills.length}
              action={<AddButton onClick={() => openModal("skill")}>Ajouter</AddButton>}
            >
              {skills.length === 0 ? (
                <EmptyBlock text="Aucune compétence pour l'instant." actionLabel="Ajouter une compétence" onAction={() => openModal("skill")} />
              ) : (
                <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {skills.map((s) => {
                   const catObj = s.category || s.skill_category || s.skillCategory || s.skill_category_data;
const catName = catObj?.name;
const subCatName = catObj?.parent?.name || catObj?.parent_category?.name;
const displayPath = [subCatName, catName].filter(Boolean).join(" · ");

                    return (
                      <li
                        key={s.id}
                        className="group relative rounded-lg border border-slate-200 bg-white px-3.5 py-3 pr-9 transition hover:border-teal-300 hover:bg-slate-50/60 dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-[#13B89A]/40 dark:hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                          {s.pivot?.is_featured && <span className="text-xs text-amber-500">★</span>}
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          <LevelDots level={s.pivot?.level} />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}</span>
                        </div>

                        {displayPath && <p className="mt-1.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{displayPath}</p>}

                        {s.pivot?.years_experience > 0 && (
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {s.pivot.years_experience} an{s.pivot.years_experience > 1 ? "s" : ""} d'expérience
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => detachSkill(s.id)}
                          aria-label={`Retirer ${s.name}`}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            {/* ----- Expériences / Formations ----- */}
            <div className="grid gap-5 md:grid-cols-2">
              <TimelineCard
                title="Expériences"
                items={experiences}
                emptyText="Aucune expérience renseignée."
                onAdd={() => openModal("experience")}
                onEdit={(i) => openModal("experience", i)}
                onDelete={(id) => handleDelete("experience", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{i.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{[i.company, i.location].filter(Boolean).join(" · ")}</p>
                    {fmtRange(i) && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{fmtRange(i)}</p>}
                  </>
                )}
              />
              <TimelineCard
                title="Formations"
                items={educations}
                emptyText="Aucune formation renseignée."
                onAdd={() => openModal("education")}
                onEdit={(i) => openModal("education", i)}
                onDelete={(id) => handleDelete("education", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {i.degree}
                      {i.study_level && <span className="font-normal text-teal-700 dark:text-emerald-400"> · {i.study_level}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {[i.institution, i.field_of_study].filter(Boolean).join(" · ")}
                    </p>
                    {fmtRange(i) && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{fmtRange(i)}</p>}
                  </>
                )}
              />
            </div>

            <ProjectsPanel
              projects={projects}
              onAdd={() => openModal("project")}
              onEdit={(p) => openModal("project", p)}
              onDelete={deleteProject}
            />

            <AvailabilitySection profile={profile} onOpenModal={openModal} onDelete={deleteAvailability} />

            <div className="grid gap-5 md:grid-cols-2">
              <TimelineCard
                title="Certifications"
                items={profile.certifications || []}
                emptyText="Aucune certification renseignée."
                onAdd={() => openModal("certification")}
                onEdit={(i) => openModal("certification", i)}
                onDelete={(id) => handleDelete("certification", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{i.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{i.issuing_organization}</p>
                    {i.issue_date && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{fmtMonth(i.issue_date)}</p>}
                  </>
                )}
              />
              <TimelineCard
                title="Langues"
                items={profile.languages || []}
                emptyText="Aucune langue renseignée."
                onAdd={() => openModal("language")}
                onEdit={(i) => openModal("language", i)}
                onDelete={(id) => handleDelete("language", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{i.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{LANGUAGE_LEVEL_LABEL[i.level] || LEVEL_LABEL[i.level] || i.level}</p>
                  </>
                )}
              />
            </div>
          </div>

          {/* ================= COLONNE LATÉRALE ================= */}
          <aside className="space-y-5 xl:sticky xl:top-[100px] xl:self-start">
            {/* Complétion */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0B2A35] via-[#0B3A36] to-[#0E4B42] p-5 text-white shadow-[0_8px_24px_rgba(8,60,55,0.18)]">
              <p className="text-xs font-medium text-emerald-300/90">Complétion du profil</p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="relative h-20 w-20 shrink-0"
                  role="progressbar"
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Complétion du profil"
                >
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r={ringR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r={ringR}
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={ringC}
                      strokeDashoffset={ringC * (1 - completion / 100)}
                      className="transition-all duration-700 motion-reduce:transition-none"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-semibold">{completion} %</span>
                </div>
                <p className="text-[13px] leading-5 text-white/70">
                  {missing.length === 0
                    ? "Votre profil est complet."
                    : `À renseigner : ${missing.map((m) => m.label.replace(/^Ajouter (des |une |un )?/, "")).join(", ")}.`}
                </p>
              </div>
              {missing.length > 0 && (
                <button
                  type="button"
                  onClick={missing[0].action}
                  className="mt-5 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#0B2A35] transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Compléter mon profil
                </button>
              )}
            </section>

            {/* Visibilité */}
            <Panel title="Visibilité du profil">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Choisissez ce que les organisations peuvent découvrir avant toute mise en relation.
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {profile.visibility === "public" ? "Profil visible" : "Profil privé"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {profile.visibility === "public"
                      ? "Les recruteurs et entreprises peuvent consulter votre profil."
                      : "Seul vous pouvez voir votre profil."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.visibility === "public"}
                  aria-label="Rendre le profil public"
                  onClick={toggleVisibility}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    profile.visibility === "public" ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                      profile.visibility === "public" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2.5 text-xs text-slate-400 dark:text-slate-500">Les coordonnées restent masquées.</p>
            </Panel>

            {/* Liens */}
            <Panel title="Liens professionnels">
              {links.length === 0 ? (
                <EmptyBlock text="Aucun lien renseigné." compact />
              ) : (
                <ul className="space-y-2">
                  {links.map(({ key, label }) => (
                    <li key={key}>
                      <a
                        href={profile[key]}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-teal-300 hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-[#13B89A]/40 dark:hover:bg-white/5"
                      >
                        <PlatformIcon platform={key} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
                          <span className="block truncate text-xs text-slate-400 dark:text-slate-500">{prettyUrl(profile[key])}</span>
                        </span>
                        <span className="shrink-0 text-sm text-slate-300 transition group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-emerald-400">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => openModal("info")}
                className="mt-3 w-full rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/20 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-white/5 dark:hover:text-emerald-400"
              >
                + {links.length === 0 ? "Ajouter un lien" : "Ajouter ou modifier un lien"}
              </button>
            </Panel>

            {/* Conseils */}
            <Panel title="Conseils pour votre profil">
              <ul className="space-y-0.5">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={c.action}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-white/5"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          c.done ? "bg-teal-600" : "border border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {c.done && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className={`text-sm ${c.done ? "text-slate-400 line-through dark:text-slate-600" : "text-slate-700 dark:text-slate-300"}`}>
                        {c.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/job-offers"
                className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#13B89A]/40 dark:hover:text-emerald-400"
              >
                Voir les opportunités <span>→</span>
              </Link>
            </Panel>

            {/* Apparence */}
            {portfolio && (
              <Panel title="Apparence du portfolio">
                <div className="grid grid-cols-2 gap-2.5">
                  {THEMES.map((theme) => {
                    const active = portfolio.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => changeTheme(theme.id)}
                        aria-pressed={active}
                        title={theme.desc}
                        className={`rounded-lg border p-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                          active
                            ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 dark:border-emerald-500 dark:bg-emerald-500/10 dark:ring-emerald-500"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-white/20"
                        }`}
                      >
                        <span className={`block h-10 w-full rounded-md ${theme.preview}`} />
                        <span className="mt-2 flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{theme.label}</span>
                          {active && <span className="rounded bg-teal-600 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white dark:bg-emerald-600">Actif</span>}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500">{theme.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            )}

            {profile.is_young_talent && (
              <Panel title="Conseils Young Talent">
                <ol className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                  {[
                    <>Ajoutez vos <span className="font-medium text-slate-800 dark:text-slate-200">projets universitaires</span> pour montrer vos compétences.</>,
                    <>Précisez vos <span className="font-medium text-slate-800 dark:text-slate-200">disponibilités</span> (stage, alternance, premier emploi).</>,
                    <>Mettez à jour votre <span className="font-medium text-slate-800 dark:text-slate-200">CV</span> et votre LinkedIn.</>,
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-medium text-slate-600 dark:border-white/20 dark:text-slate-400">
                        {i + 1}
                      </span>
                      <span className="leading-5">{tip}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </aside>
        </div>
      </div>

      {modal && (
        <ModalRouter
          modal={modal}
          profile={profile}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
          onRefresh={load}
          flash={flash}
        />
      )}

      {previewOpen && (
        <PublicPortfolio
          asModal
          onClose={() => setPreviewOpen(false)}
          data={{
            ...portfolio,
            profile_data: profile,
            projects: portfolio.projects || [],
            public_slug: portfolio.public_slug,
            accent_color: portfolio.accent_color || "#16B8B1",
          }}
        />
      )}

   
      
        </div>
    </AppShell>
  );
}

/* ============================================================
   COMPOSANTS D'INTERFACE
============================================================ */

function Panel({ title, count, action, children, className = "" }) {
  return (
    <section className={`${CARD} ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-white/10">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {typeof count === "number" && <span className="text-xs text-slate-400 dark:text-slate-500">{count}</span>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#13B89A]/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
    >
      + {children}
    </button>
  );
}

function Chip({ tone = "emerald", children }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} />
      {children}
    </span>
  );
}

function LevelDots({ level }) {
  const rank = LEVEL_RANK[level] || 2;
  return (
    <span className="flex items-center gap-0.5" aria-label={LEVEL_LABEL[level] || "Intermédiaire"}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-1.5 w-3 rounded-sm ${n <= rank ? "bg-teal-600 dark:bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
      ))}
    </span>
  );
}

function EmptyBlock({ text, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 text-center dark:border-white/10 dark:bg-white/5 ${compact ? "py-5" : "py-8"}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/20 dark:bg-transparent dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
        >
          + {actionLabel}
        </button>
      )}
    </div>
  );
}

function TextAction({ onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs text-slate-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-400 ${
        danger ? "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400" : "hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-white/10 dark:hover:text-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function TimelineCard({ title, items = [], emptyText, onAdd, onEdit, onDelete, render }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 3);

  return (
    <Panel title={title} count={items.length} action={<AddButton onClick={onAdd}>Ajouter</AddButton>}>
      {items.length === 0 ? (
        <EmptyBlock text={emptyText} actionLabel="Ajouter" onAction={onAdd} compact />
      ) : (
        <>
          <ol className="ml-1 space-y-5 border-l border-slate-200 pl-6 dark:border-white/10">
            {visible.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-4 ring-white dark:bg-emerald-500 dark:ring-[#112A3A]" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">{render(item)}</div>
                  <div className="flex shrink-0 flex-col items-end sm:flex-row">
                    <TextAction onClick={() => onEdit(item)}>Modifier</TextAction>
                    <TextAction danger onClick={() => onDelete(item.id)}>Supprimer</TextAction>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 text-xs font-medium text-teal-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-emerald-400"
            >
              {showAll ? "Voir moins" : `Voir tout (${items.length})`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

function ProjectsPanel({ projects, onAdd, onEdit, onDelete }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? projects : projects.slice(0, 4);

  return (
    <Panel title="Projets & réalisations" count={projects.length} action={<AddButton onClick={onAdd}>Ajouter</AddButton>}>
      {projects.length === 0 ? (
        <EmptyBlock text="Aucun projet pour l'instant." actionLabel="Ajouter un projet" onAction={onAdd} />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
          {projects.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-5 text-xs font-medium text-teal-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-emerald-400"
            >
              {showAll ? "Voir moins" : `Voir tout (${projects.length})`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

/* ---------- Carte projet ---------- */
function ProjectCard({ project: p, onEdit, onDelete }) {
  const type = PROJECT_TYPES[p.project_type || "professional"] || PROJECT_TYPES.professional;
  const techs = Array.isArray(p.technologies) ? p.technologies : [];

  const image =
    p.image_url ||
    p.thumbnail_url ||
    p.cover_image ||
    (p.image_path ? `${STORAGE_URL}/${p.image_path}` : null);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:border-teal-300 hover:shadow-[0_8px_24px_rgba(15,60,60,0.08)] dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-[#13B89A]/40 dark:hover:shadow-none">
      <div className="relative h-36 w-full overflow-hidden border-b border-slate-100 dark:border-white/5">
        {image ? (
          <img
            src={image}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${type.grad}`}>
            <span className={`select-none text-6xl font-semibold ${type.ink}`}>
              {(p.title || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <span className={`absolute left-3 top-3 rounded-md border px-2 py-0.5 text-[10px] font-medium ${type.cls}`}>
          {type.label}
        </span>

        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(p)}
            className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur transition hover:text-teal-700 dark:bg-black/80 dark:text-slate-200 dark:hover:text-emerald-400"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => onDelete(p.id)}
            className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur transition hover:text-rose-600 dark:bg-black/80 dark:text-slate-200 dark:hover:text-rose-400"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{p.title}</h3>

        {p.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{p.description}</p>}

        {techs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techs.slice(0, 4).map((t, i) => (
              <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                {t}
              </span>
            ))}
            {techs.length > 4 && (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-400 dark:bg-white/5 dark:text-slate-500">+{techs.length - 4}</span>
            )}
          </div>
        )}

        {p.project_url ? (
          <a
            href={p.project_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Voir le projet <span>→</span>
          </a>
        ) : (
          <span className="mt-4 text-[11px] italic text-slate-400 dark:text-slate-500">Aucun lien renseigné</span>
        )}
      </div>
    </li>
  );
}

function ProfileSkeleton() {
  const pulse = "animate-pulse motion-reduce:animate-none rounded-xl bg-white/80 dark:bg-white/5";
  return (
    <AppShell>
      <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" role="status" aria-label="Chargement du profil">
        <div className="space-y-5">
          <div className={`h-80 ${pulse}`} />
          <div className={`h-32 ${pulse}`} />
          <div className="grid gap-5 md:grid-cols-2">
            <div className={`h-52 ${pulse}`} />
            <div className={`h-52 ${pulse}`} />
          </div>
        </div>
        <div className="space-y-5">
          <div className={`h-44 ${pulse}`} />
          <div className={`h-60 ${pulse}`} />
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   CRÉATION DU PROFIL
============================================================ */

function EmptyProfileCreate({ onCreated, showToast }) {
  const [form, setForm] = useState({ profile_type: "employee", headline: "", visibility: "public" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/profile", form);
      onCreated();
    } catch (err) {
      showToast(err.response?.data?.message || "Impossible de créer le profil", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`mx-auto max-w-md p-7 ${CARD}`}>
      <p className="text-xs font-medium text-teal-700 dark:text-emerald-400">Bienvenue</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Créons votre profil</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Un titre professionnel suffit pour commencer.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <select
          className={FIELD_CLS}
          value={form.profile_type}
          onChange={(e) => setForm({ ...form, profile_type: e.target.value })}
        >
          <option value="employee">Salarié</option>
          <option value="student">Étudiant</option>
        </select>
        <input
          required
          placeholder="Titre professionnel"
          className={FIELD_CLS}
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <button disabled={saving} className={`${BTN_PRIMARY} w-full`}>
          {saving ? "Création..." : "Créer mon profil"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   MODAL ROUTER
============================================================ */

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#06141F]/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_rgba(6,25,35,0.3)] dark:bg-[#112A3A] dark:shadow-none dark:ring-1 dark:ring-white/10"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function MapButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-teal-700 transition hover:bg-teal-50 dark:border-white/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
    >
      Choisir sur la carte
    </button>
  );
}

function ModalRouter({ modal, profile, onClose, onSaved, flash }) {
  const { type, item } = modal;

  return (
    <ModalShell
      title={
        {
          info: "Modifier mes informations",
          skill: "Ajouter une compétence",
          experience: item ? "Modifier une expérience" : "Ajouter une expérience",
          education: item ? "Modifier une formation" : "Ajouter une formation",
          project: item ? "Modifier un projet" : "Ajouter un projet",
          certification: item ? "Modifier une certification" : "Ajouter une certification",
          language: item ? "Modifier une langue" : "Ajouter une langue",
          availability: item ? "Modifier une disponibilité" : "Ajouter une disponibilité",
        }[type] || "Modifier"
      }
      onClose={onClose}
    >
      {type === "info" && <ModalInfo profile={profile} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "skill" && <ModalSkill onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "experience" && <ModalExperience item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "education" && <ModalEducation item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "project" && <ModalProject item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "certification" && <ModalCertification item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "language" && <ModalLanguage item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
      {type === "availability" && <ModalAvailability item={item} onSaved={onSaved} onClose={onClose} flash={flash} />}
    </ModalShell>
  );
}

/* ---------- Modal : infos de profil (avec MapPicker) ---------- */
function ModalInfo({ profile, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    profile_type: profile?.profile_type || "employee",
    visibility: profile?.visibility || "public",
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    country: profile?.country || "",
    phone: profile?.user?.phone || "",
    linkedin_url: profile?.linkedin_url || "",
    portfolio_url: profile?.portfolio_url || "",
    github_url: profile?.github_url || "",
    behance_url: profile?.behance_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/profile", {
        profile_type: form.profile_type,
        visibility: form.visibility,
        headline: form.headline,
        bio: form.bio,
        city: form.city,
        country: form.country,
        linkedin_url: form.linkedin_url,
        portfolio_url: form.portfolio_url,
        github_url: form.github_url,
        behance_url: form.behance_url,
      });

      if (form.phone !== (profile?.user?.phone || "")) {
        await api.patch("/account", { phone: form.phone });
      }

      flash("Profil mis à jour", "success");
      onSaved();
    } catch (err) {
      if (err.response?.status === 409) {
        try {
          await api.put("/profile", {
            profile_type: form.profile_type,
            visibility: form.visibility,
            headline: form.headline,
            bio: form.bio,
            city: form.city,
            country: form.country,
            linkedin_url: form.linkedin_url,
            portfolio_url: form.portfolio_url,
            github_url: form.github_url,
            behance_url: form.behance_url,
          });

          if (form.phone !== (profile?.user?.phone || "")) {
            await api.patch("/account", { phone: form.phone });
          }

          flash("Profil mis à jour", "success");
          onSaved();
          return;
        } catch (err2) {
          flash(err2.response?.data?.message || "Erreur", "error");
          return;
        }
      }
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Titre professionnel">
          <input className={FIELD_CLS} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </Field>

        <Field label="Bio">
          <textarea rows={3} className={FIELD_CLS} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Localisation</label>
            <MapButton onClick={() => setMapOpen(true)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input className={FIELD_CLS} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville" />
            <input className={FIELD_CLS} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Pays" />
          </div>
        </div>

        <Field label="Téléphone">
          <input
            type="tel"
            className={FIELD_CLS}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+261 34 12 345 67"
            autoComplete="tel"
          />
          <p className="mt-1.5 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
            Format international recommandé. Utilisé uniquement pour les SMS liés aux entretiens et ne sera pas affiché publiquement.
          </p>
        </Field>

        <Field label="LinkedIn">
          <input className={FIELD_CLS} value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
        </Field>
        <Field label="Portfolio">
          <input className={FIELD_CLS} value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
        </Field>
        <Field label="GitHub">
          <input className={FIELD_CLS} value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
        </Field>
        <Field label="Behance">
          <input className={FIELD_CLS} value={form.behance_url} onChange={(e) => setForm({ ...form, behance_url: e.target.value })} />
        </Field>

        <ModalFooter saving={saving} onClose={onClose} />
      </form>

      <MapPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialCity={form.city}
        initialCountry={form.country}
        onSelect={({ city, country }) => {
          setForm({ ...form, city: city || form.city, country: country || form.country });
        }}
      />
    </>
  );
}

/* ---------- Modal : compétence ---------- */
function ModalSkill({ onSaved, onClose, flash }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [skillResults, setSkillResults] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [level, setLevel] = useState("intermediate");
  const [yearsExperience, setYearsExperience] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [searchingSkills, setSearchingSkills] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [adding, setAdding] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(categoryId)),
    [categories, categoryId]
  );
  const effectiveCategoryId = subcategoryId || categoryId;

  useEffect(() => {
    let alive = true;
    setLoadingCategories(true);
    setError("");

    api.get("/skill-categories", { params: { parent_id: null } })
      .then((res) => {
        if (!alive) return;
        const data = asArray(res.data);
        if (data.length > 0) {
          setCategories(data);
        } else {
          throw new Error("Vide");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("Fallback des catégories activé", err);
        setCategories([
          { id: 1, name: "Informatique & Tech" },
          { id: 2, name: "Finance & Gestion" },
          { id: 3, name: "Santé" },
          { id: 4, name: "Marketing & Communication" },
          { id: 5, name: "Génie Civil & BTP" },
          { id: 6, name: "Agriculture" },
        ]);
      })
      .finally(() => alive && setLoadingCategories(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId("");
      return undefined;
    }
    let alive = true;
    setLoadingSubcategories(true);
    setSubcategories([]);
    setSubcategoryId("");

    api.get("/skill-categories", { params: { parent_id: categoryId } })
      .then((res) => {
        if (!alive) return;
        const data = asArray(res.data);
        if (data.length > 0) {
          setSubcategories(data);
        } else {
          throw new Error("Vide");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("Fallback des sous-catégories activé", err);
        const fallbacks = {
          "1": [{ id: 101, name: "Développement Web" }, { id: 102, name: "Data & IA" }],
          "2": [{ id: 201, name: "Comptabilité" }],
          "3": [{ id: 301, name: "Soins infirmiers" }],
          "4": [{ id: 401, name: "Réseaux sociaux" }],
          "5": [{ id: 501, name: "Architecture" }],
        };
        setSubcategories(fallbacks[String(categoryId)] || []);
      })
      .finally(() => alive && setLoadingSubcategories(false));
    return () => { alive = false; };
  }, [categoryId]);

  useEffect(() => {
    let alive = true;
    if (!effectiveCategoryId || skillSearch.trim().length < 2 || selectedSkill) {
      setSkillResults([]);
      setSearchingSkills(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      setSearchingSkills(true);
      api.get("/skills", {
        params: { search: skillSearch.trim(), category_id: effectiveCategoryId, limit: 10 },
      })
        .then((res) => alive && setSkillResults(asArray(res.data)))
        .catch(() => alive && setSkillResults([]))
        .finally(() => alive && setSearchingSkills(false));
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [skillSearch, effectiveCategoryId, selectedSkill]);

  const addTaxonomyNode = async (kind) => {
    const isCategory = kind === "category";
    const name = (isCategory ? newCategoryName : newSubcategoryName).trim();
    if (!name) return;
    setAdding(kind);
    setError("");
    try {
      const parent_id = isCategory ? null : Number(categoryId);
      const res = await api.post("/skill-categories", { name, parent_id });
      const created = res.data?.data || res.data;
      if (!created?.id) throw new Error("L’API n’a pas renvoyé l’identifiant de la catégorie créée.");
      if (isCategory) {
        setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "fr")));
        setCategoryId(String(created.id));
        setNewCategoryName("");
        setShowAddCategory(false);
      } else {
        setSubcategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "fr")));
        setSubcategoryId(String(created.id));
        setNewSubcategoryName("");
        setShowAddSubcategory(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Création impossible.");
    } finally {
      setAdding("");
    }
  };

  const chooseCategory = (value) => {
    setCategoryId(value);
    setSelectedSkill(null);
    setSkillSearch("");
    setSkillResults([]);
    setError("");
  };

  const chooseSubcategory = (value) => {
    setSubcategoryId(value);
    setSelectedSkill(null);
    setSkillSearch("");
    setSkillResults([]);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!effectiveCategoryId) {
      setError("Choisissez au minimum un domaine ou une catégorie avant d’ajouter une compétence.");
      return;
    }
    const skillName = (selectedSkill?.name || skillSearch).trim();
    if (!skillName) {
      setError("Saisissez ou sélectionnez une compétence.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let skillId = selectedSkill?.id;
      if (!skillId) {
      const createdRes = await api.post("/skills", {
  name: skillName,
  skill_category_id: Number(effectiveCategoryId),
});
        const created = createdRes.data?.data || createdRes.data;
        skillId = created?.id;
        if (!skillId) throw new Error("La compétence a été créée, mais l’API n’a pas renvoyé son identifiant.");
      }
      await api.post("/skills/attach", {
        skill_id: skillId,
        level,
        years_experience: yearsExperience === "" ? null : Number(yearsExperience),
      });
      flash("Compétence ajoutée à votre profil.", "success");
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.skill_id?.[0] || err.message || "Erreur lors de l’ajout de la compétence.";
      setError(message);
      flash(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const squareBtn =
    "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700 dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400";
  const inlineAdd =
    "flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5";
  const inlineAddBtn =
    "rounded-lg bg-[#0B2A35] px-3.5 text-xs font-medium text-white transition hover:bg-[#0E3B3A] disabled:opacity-50 dark:bg-[#13B89A] dark:hover:bg-[#18C6A6]";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-medium text-slate-800 dark:text-white">Référentiel ouvert à tous les métiers</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Choisissez une catégorie, puis une sous-catégorie. Si elle n’existe pas, ajoutez-la : cette structure fonctionne pour tout domaine professionnel.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="skill-category" className={LABEL_CLS}>
          Domaine / catégorie <span className="text-rose-600 dark:text-rose-400">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FolderTree size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <select
              id="skill-category"
              required
              value={categoryId}
              onChange={(e) => chooseCategory(e.target.value)}
              className={`${SKILL_FIELD} appearance-none pl-9 pr-9`}
            >
              <option value="">{loadingCategories ? "Chargement des domaines…" : "Sélectionner un domaine"}</option>
              {categories.map((category, index) => (
                <option key={`${category.id}-${index}`} value={category.id}>{category.name}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
          <button type="button" onClick={() => setShowAddCategory((v) => !v)} title="Ajouter une catégorie" className={squareBtn}>
            <Plus size={17} />
          </button>
        </div>
        {showAddCategory && (
          <div className={inlineAdd}>
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTaxonomyNode("category"))}
              placeholder="Ex. Agriculture, Finance, BTP…"
              className={SKILL_FIELD}
            />
            <button type="button" disabled={!newCategoryName.trim() || adding === "category"} onClick={() => addTaxonomyNode("category")} className={inlineAddBtn}>
              {adding === "category" ? "…" : "Ajouter"}
            </button>
          </div>
        )}
      </div>

      {categoryId && (
        <div className="space-y-2">
          <label htmlFor="skill-subcategory" className={LABEL_CLS}>
            Sous-catégorie <span className="text-slate-400 dark:text-slate-500">(facultatif)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                id="skill-subcategory"
                value={subcategoryId}
                onChange={(e) => chooseSubcategory(e.target.value)}
                className={`${SKILL_FIELD} appearance-none pr-9`}
              >
                <option value="">
                  {loadingSubcategories
                    ? "Chargement…"
                    : subcategories.length
                      ? "Tout le domaine / choisir une sous-catégorie"
                      : "Aucune sous-catégorie — vous pouvez en créer une"}
                </option>
                {subcategories.map((subcategory, index) => (
                  <option key={`${subcategory.id}-${index}`} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>
            <button type="button" onClick={() => setShowAddSubcategory((v) => !v)} title="Ajouter une sous-catégorie" className={squareBtn}>
              <Plus size={17} />
            </button>
          </div>
          {showAddSubcategory && (
            <div className={inlineAdd}>
              <input
                autoFocus
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTaxonomyNode("subcategory"))}
                placeholder={`Nouvelle sous-catégorie de ${selectedCategory?.name || "ce domaine"}`}
                className={SKILL_FIELD}
              />
              <button type="button" disabled={!newSubcategoryName.trim() || adding === "subcategory"} onClick={() => addTaxonomyNode("subcategory")} className={inlineAddBtn}>
                {adding === "subcategory" ? "…" : "Ajouter"}
              </button>
            </div>
          )}
        </div>
      )}

      {effectiveCategoryId && (
        <div className="space-y-2">
          <label htmlFor="skill-search" className={LABEL_CLS}>
            Compétence <span className="text-rose-600 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              id="skill-search"
              required
              autoComplete="off"
              value={selectedSkill?.name || skillSearch}
              onChange={(e) => { setSelectedSkill(null); setSkillSearch(e.target.value); }}
              placeholder="Rechercher ou saisir une compétence"
              className={`${SKILL_FIELD} pl-9 ${selectedSkill ? "border-teal-500 bg-teal-50/40 dark:border-emerald-500/50 dark:bg-emerald-500/10" : ""}`}
            />
            {selectedSkill && (
              <button
                type="button"
                onClick={() => { setSelectedSkill(null); setSkillSearch(""); }}
                aria-label="Désélectionner la compétence"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {skillSearch.trim().length >= 2 && !selectedSkill && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#112A3A]">
              {searchingSkills ? (
                <p className="px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">Recherche en cours…</p>
              ) : skillResults.length > 0 ? (
                <ul className="max-h-44 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
                  {skillResults.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedSkill(s); setSkillSearch(s.name); }}
                        className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Aucun résultat : « {skillSearch.trim()} » sera créée comme nouvelle compétence.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {effectiveCategoryId && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="skill-level" className={LABEL_CLS}>Niveau</label>
            <select id="skill-level" value={level} onChange={(e) => setLevel(e.target.value)} className={SKILL_FIELD}>
              {LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="skill-years" className={LABEL_CLS}>Années d’expérience</label>
            <input
              id="skill-years"
              type="number"
              min="0"
              max="60"
              step="1"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="Ex. 3"
              className={SKILL_FIELD}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-white/10">
        <button type="button" onClick={onClose} className={BTN_SECONDARY}>Annuler</button>
        <button
          type="submit"
          disabled={saving || !effectiveCategoryId || !(selectedSkill?.name || skillSearch.trim())}
          className={BTN_PRIMARY}
        >
          {saving ? "Enregistrement…" : <><Check size={15} />Ajouter à mon profil</>}
        </button>
      </div>
    </form>
  );
}

/* ---------- Modal : expérience ---------- */
function ModalExperience({ item, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    company: item?.company || "",
    location: item?.location || "",
    start_date: item?.start_date?.slice(0, 10) || "",
    end_date: item?.end_date?.slice(0, 10) || "",
    is_current: item?.is_current || false,
    description: item?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) await api.put(`/experiences/${item.id}`, form);
      else await api.post("/experiences", form);
      flash("Expérience enregistrée", "success");
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      flash(firstError || data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCitySelect = ({ city }) => {
    if (!city) return;
    setForm((prev) => ({ ...prev, location: city }));
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Poste">
          <input required className={FIELD_CLS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>

        <Field label="Entreprise">
          <input required className={FIELD_CLS} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Lieu</label>
            <MapButton onClick={() => setMapOpen(true)} />
          </div>
          <input
            className={FIELD_CLS}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ville ou pays (ex: Antananarivo)"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Début">
            <input type="date" className={FIELD_CLS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="Fin">
            <input type="date" disabled={form.is_current} className={`${FIELD_CLS} disabled:bg-slate-50 disabled:opacity-60 dark:disabled:bg-white/5`} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-white/20 dark:accent-emerald-500"
            checked={form.is_current}
            onChange={(e) => setForm({ ...form, is_current: e.target.checked, end_date: e.target.checked ? "" : form.end_date })}
          />
          Poste actuel
        </label>

        <Field label="Description">
          <textarea rows={3} className={FIELD_CLS} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>

        <ModalFooter saving={saving} onClose={onClose} />
      </form>

      <MapPicker open={mapOpen} onClose={() => setMapOpen(false)} initialCity={form.location} onSelect={handleCitySelect} />
    </>
  );
}

/* ---------- Modal : formation ---------- */
function ModalEducation({ item, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    degree: item?.degree || "",
    institution: item?.institution || "",
    field_of_study: item?.field_of_study || "",
    study_level: item?.study_level || "",
    custom_study_level: "",
    start_date: item?.start_date?.slice(0, 10) || "",
    end_date: item?.end_date?.slice(0, 10) || "",
    is_current: item?.is_current || false,
    description: item?.description || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      study_level:
        form.study_level === "Autre"
          ? (form.custom_study_level || "").trim() || "Autre"
          : form.study_level,
    };
    delete payload.custom_study_level;

    try {
      if (item) await api.put(`/educations/${item.id}`, payload);
      else await api.post("/educations", payload);
      flash("Formation enregistrée", "success");
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      flash(firstError || data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Diplôme">
        <input required className={FIELD_CLS} value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
      </Field>
      <Field label="Établissement">
        <input required className={FIELD_CLS} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
      </Field>
      <Field label="Domaine">
        <input className={FIELD_CLS} value={form.field_of_study} onChange={(e) => setForm({ ...form, field_of_study: e.target.value })} />
      </Field>
      <Field label="Niveau d'études">
        <div className="flex flex-wrap gap-1.5">
          {["L1", "L2", "L3", "M1", "M2", "Licence", "Master", "BTS", "DUT", "Doctorat", "Autre"].map((v) => {
            const active = form.study_level === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, study_level: active ? "" : v, custom_study_level: "" })}
                aria-pressed={active}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${active ? PILL_ON : PILL_OFF}`}
              >
                {v}
              </button>
            );
          })}
        </div>

        {form.study_level === "Autre" && (
          <div className="mt-2.5">
            <input
              type="text"
              autoFocus
              placeholder="Précisez votre niveau (ex: C2, Bac+4, Certificat pro...)"
              className={FIELD_CLS}
              value={form.custom_study_level || ""}
              onChange={(e) => setForm({ ...form, custom_study_level: e.target.value })}
            />
            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">Ce niveau personnalisé sera utilisé dans votre profil.</p>
          </div>
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Début">
          <input type="date" className={FIELD_CLS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Fin">
          <input type="date" disabled={form.is_current} className={`${FIELD_CLS} disabled:bg-slate-50 disabled:opacity-60 dark:disabled:bg-white/5`} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-white/20 dark:accent-emerald-500"
          checked={form.is_current}
          onChange={(e) => setForm({ ...form, is_current: e.target.checked, end_date: e.target.checked ? "" : form.end_date })}
        />
        En cours
      </label>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : projet ---------- */
function ModalProject({ item, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    project_type: item?.project_type || "professional",
    project_url: item?.project_url || "",
    technologies: Array.isArray(item?.technologies) ? item.technologies.join(", ") : "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (item) await api.put(`/portfolio/projects/${item.id}`, payload);
      else await api.post("/portfolio/projects", payload);
      flash("Projet enregistré", "success");
      onSaved();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titre">
        <input required className={FIELD_CLS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea rows={3} className={FIELD_CLS} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Type de projet">
        <select className={FIELD_CLS} value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
          <option value="academic">Universitaire</option>
          <option value="personal">Personnel</option>
          <option value="professional">Professionnel</option>
        </select>
      </Field>
      <Field label="Technologies (séparées par des virgules)">
        <input className={FIELD_CLS} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
      </Field>
      <Field label="Lien du projet">
        <input className={FIELD_CLS} value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} />
      </Field>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : certification ---------- */
function ModalCertification({ item, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    issuing_organization: item?.issuing_organization || "",
    issue_date: item?.issue_date?.slice(0, 10) || "",
    expiration_date: item?.expiration_date?.slice(0, 10) || "",
    credential_url: item?.credential_url || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) await api.put(`/certifications/${item.id}`, form);
      else await api.post("/certifications", form);
      flash("Certification enregistrée", "success");
      onSaved();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom">
        <input required className={FIELD_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Organisme">
        <input required className={FIELD_CLS} value={form.issuing_organization} onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date d'obtention">
          <input type="date" className={FIELD_CLS} value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
        </Field>
        <Field label="Expiration">
          <input type="date" className={FIELD_CLS} value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
        </Field>
      </div>
      <Field label="Lien">
        <input className={FIELD_CLS} value={form.credential_url} onChange={(e) => setForm({ ...form, credential_url: e.target.value })} />
      </Field>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : langue ---------- */
function ModalLanguage({ item, onSaved, onClose, flash }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    level: item?.level || "conversational",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) await api.put(`/languages/${item.id}`, form);
      else await api.post("/languages", form);
      flash("Langue enregistrée", "success");
      onSaved();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Langue">
        <input required className={FIELD_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Niveau">
        <select className={FIELD_CLS} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          <option value="basic">Notions</option>
          <option value="conversational">Intermédiaire</option>
          <option value="fluent">Courant</option>
          <option value="native">Langue maternelle</option>
        </select>
      </Field>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : disponibilité ---------- */
function ModalAvailability({ item, onSaved, onClose, flash }) {
  const toDateInput = (v) => {
    if (!v) return "";
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const [form, setForm] = useState({
    start_at: toDateInput(item?.start_at),
    end_at: toDateInput(item?.end_at),
    status: item?.status || "available",
    type: item?.type || "full_time",
    workload_value: item?.workload_value ?? "",
    workload_unit: item?.workload_unit || "percentage",
    location_type: item?.location_type || "onsite",
    location_city: item?.location_city || "",
    notes: item?.notes || "",
    is_recurring: item?.is_recurring || false,
    recurrence_pattern: item?.recurrence_pattern || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        workload_value: form.workload_value === "" ? null : Number(form.workload_value),
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      };

      if (item) await api.patch(`/availability/${item.id}`, payload);
      else await api.post("/availability", payload);

      flash(item ? "Disponibilité modifiée" : "Disponibilité ajoutée", "success");
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      flash(firstError || data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  const days =
    form.start_at && form.end_at
      ? Math.max(0, Math.round((new Date(form.end_at) - new Date(form.start_at)) / (1000 * 60 * 60 * 24))) + 1
      : null;

  return (
    <form onSubmit={submit} className="space-y-6">
      <section>
        <Label>Statut de disponibilité</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {[
            { v: "available", label: "Disponible", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-400 dark:border-emerald-500/30" },
            { v: "partially_available", label: "Partiel", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-400 dark:border-amber-500/30" },
            { v: "unavailable", label: "Indisponible", dot: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-400 dark:border-rose-500/30" },
            { v: "on_mission", label: "En mission", dot: "bg-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-700 dark:text-sky-400", border: "border-sky-400 dark:border-sky-500/30" },
          ].map((s) => {
            const active = form.status === s.v;
            return (
              <button
                key={s.v}
                type="button"
                onClick={() => setForm({ ...form, status: s.v })}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  active ? `${s.border} ${s.bg} ${s.text}` : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-400 dark:hover:bg-white/5"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
        <Label>Période</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[11px] text-slate-500 dark:text-slate-400">Début</span>
            <input type="date" required className={FIELD_CLS} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
          </div>
          <div>
            <span className="mb-1 block text-[11px] text-slate-500 dark:text-slate-400">Fin</span>
            <input type="date" required className={FIELD_CLS} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
        </div>
        {days !== null && days > 0 && (
          <p className="mt-3 inline-block rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-teal-700 dark:border-white/10 dark:bg-[#0B1F33] dark:text-emerald-400">
            {days} jour{days > 1 ? "s" : ""} de disponibilité
          </p>
        )}
      </section>

      <section>
        <Label>Type de contrat</Label>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[
            { v: "full_time", label: "Temps plein" },
            { v: "part_time", label: "Temps partiel" },
            { v: "freelance", label: "Freelance" },
            { v: "internship", label: "Stage" },
            { v: "mission", label: "Mission" },
          ].map(({ v, label }) => {
            const active = form.type === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, type: v })}
                aria-pressed={active}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${active ? PILL_ON : PILL_OFF}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <Label>Charge de travail</Label>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input type="number" min="0" className={FIELD_CLS} value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: e.target.value })} placeholder="Ex: 50" />
          <select className={`${FIELD_CLS} sm:w-40`} value={form.workload_unit} onChange={(e) => setForm({ ...form, workload_unit: e.target.value })}>
            <option value="percentage">%</option>
            <option value="hours_per_week">h / semaine</option>
            <option value="days_per_week">jours / semaine</option>
          </select>
        </div>
      </section>

      <section>
        <Label>Localisation</Label>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[
            { v: "onsite", label: "Sur site" },
            { v: "remote", label: "Télétravail" },
            { v: "hybrid", label: "Hybride" },
          ].map(({ v, label }) => {
            const active = form.location_type === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, location_type: v })}
                aria-pressed={active}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${active ? PILL_ON : PILL_OFF}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {form.location_type !== "remote" && (
          <input className={`${FIELD_CLS} mt-3`} value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} placeholder="Ville (ex: Antananarivo)" />
        )}
      </section>

      <section>
        <Label>Notes (optionnel)</Label>
        <textarea rows={3} className={`${FIELD_CLS} mt-2.5`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Disponible pour un stage de 6 mois à partir de mars" />
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-white/20">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-white/20 dark:accent-emerald-500" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Disponibilité récurrente</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ex: tous les lundis, une semaine sur deux...</p>
          </div>
        </label>

        {form.is_recurring && (
          <input className={`${FIELD_CLS} mt-3`} value={form.recurrence_pattern} onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })} placeholder="Motif (ex: Tous les lundis et mardis)" />
        )}
      </section>

      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Footer des modals ---------- */
function ModalFooter({ saving, onClose }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
      <button type="button" onClick={onClose} className={BTN_SECONDARY}>
        Annuler
      </button>
      <button type="submit" disabled={saving} className={BTN_PRIMARY}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}

/* ---------- Libellé de section (sans icône) ---------- */
function Label({ children }) {
  return <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</span>;
}

/* ---------- Logos des liens ---------- */
function PlatformIcon({ platform }) {
  const cls =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5";

  if (platform === "linkedin_url") {
    return (
      <span className={cls}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
          <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
        </svg>
      </span>
    );
  }

  if (platform === "github_url") {
    return (
      <span className={cls}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-800 dark:fill-white">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </span>
    );
  }

  if (platform === "behance_url") {
    return (
      <span className={cls}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#1769FF]">
          <path d="M22 7h-7v2h7V7zm-1.2 10.2c-.4.8-1.1 1.2-2 1.2-1.5 0-2.4-1.1-2.4-2.6h6.6c0-.1.1-.3.1-.4 0-2.7-1.7-4.6-4.3-4.6-2.7 0-4.4 1.9-4.4 4.6 0 2.7 1.7 4.6 4.4 4.6 2 0 3.5-1 4.2-2.6h-2.2zm-2-4.9c.9 0 1.5.5 1.6 1.4h-3.3c.1-.9.8-1.4 1.7-1.4zM6.2 12.1c1.1 0 1.8.7 1.8 1.8 0 1.2-.8 1.9-2 1.9H2V9h3.9c1.9 0 2.8.8 2.8 2 0 .8-.3 1.4-1 1.8.4.2 1.1.8 1.1 1.8 0 1.5-1.1 2.4-2.9 2.4H3.8v-2.1h2.4c.7 0 1-.3 1-1s-.4-1-1-1H3.8V12h2.4zM3.8 10.9V10h2.1c.5 0 .8.3.8.7s-.3.7-.8.7H3.8z" />
        </svg>
      </span>
    );
  }

  return (
    <span className={cls}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-600 dark:fill-slate-400">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    </span>
  );
}