import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock,
  Calendar,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  Globe2,
  GraduationCap,
  Languages,
  Lightbulb,
  Link2,
  MapPin,
  MapPinned,
  Palette,
  Phone,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import MapPicker from "../components/MapPicker";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import PublicPortfolio from "./PublicPortfolio";


/* ============================================================
   CONSTANTES & HELPERS
============================================================ */

const STORAGE_URL = "/storage";

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const LANGUAGE_LEVEL_LABEL = {
  basic: "Notions",
  conversational: "Intermédiaire",
  fluent: "Courant",
  native: "Langue maternelle",
};

const PROJECT_TYPES = {
  academic: { label: "Universitaire", icon: GraduationCap, cls: "bg-emerald-50 text-emerald-700" },
  personal: { label: "Personnel", icon: CircleUserRound, cls: "bg-blue-50 text-blue-700" },
  professional: { label: "Professionnel", icon: BriefcaseBusiness, cls: "bg-slate-100 text-slate-600" },
};

const THEMES = [
  { id: "minimal", label: "Minimal", desc: "Épuré & navy", preview: "bg-slate-200" },
  { id: "bold", label: "Bold", desc: "Sombre & impactant", preview: "bg-[#0B1633]" },
  { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-[#E4EBF1]" },
  { id: "vibrant", label: "Vibrant", desc: "Coloré & moderne", preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
];

const inputCls =
  "w-full rounded-lg border border-[#E4EBF1] bg-[#F9FBFC] px-3 py-2 text-sm text-[#0B1F33] placeholder:text-[#8A9BB0] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

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
    { key: "linkedin_url", label: "LinkedIn", icon: Link2 },
    { key: "portfolio_url", label: "Portfolio personnel", icon: Globe2 },
    { key: "github_url", label: "GitHub", icon: Link2 },
    { key: "behance_url", label: "Behance", icon: Palette },
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

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-sm">
              <div className="relative h-28 bg-gradient-to-r from-[#0B1F33] via-[#0F4C5C] to-[#16B8B1] sm:h-32">
                {profile.cover_path && (
                  <img
                    src={`${STORAGE_URL}/${profile.cover_path}`}
                    alt="Couverture du profil"
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#0B1F33] shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
                >
                  <Camera size={13} />
                  {uploadingCover ? "Envoi..." : profile.cover_path ? "Changer la couverture" : "Ajouter une couverture"}
                </button>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>

              <div className="px-5 pb-5">
                <div className="-mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="relative w-fit shrink-0">
                    {profile.avatar_path ? (
                      <img
                        src={`${STORAGE_URL}/${profile.avatar_path}`}
                        alt="Photo de profil"
                        className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#16B8B1] to-[#0F9691] text-3xl font-bold text-white shadow-md">
                        {getInitials(profile.user)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      aria-label="Changer la photo de profil"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0B1F33] text-white transition hover:bg-[#17284B] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
                    >
                      <Camera size={14} />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openModal("info")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#16B8B1] px-4 py-2 text-sm font-semibold text-[#07172A] transition hover:bg-[#0F9691] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <Edit size={14} /> Modifier le profil
                    </button>
                    {portfolio?.public_slug ? (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EBF1] bg-white px-4 py-2 text-sm font-semibold text-[#0B1F33] transition hover:bg-[#F5F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Eye size={14} /> Aperçu public
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate("/portfolio/create")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EBF1] bg-white px-4 py-2 text-sm font-semibold text-[#0B1F33] transition hover:bg-[#F5F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Eye size={14} /> Créer mon portfolio
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold leading-tight text-[#0B1F33] sm:text-2xl">
                      {getDisplayName(profile.user)}
                    </h2>
                    {profile.is_verified && <Chip icon={ShieldCheck} tone="emerald">Vérifié</Chip>}
                    {profile.is_young_talent && <Chip tone="emerald">Young Talent</Chip>}
                    {profile.looking_for_opportunity && <Chip icon={Search} tone="amber">En recherche</Chip>}
                  </div>

                  {profile.headline && (
                    <p className="mt-1 text-sm font-semibold text-[#0F9691]">{profile.headline}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#64788C]">
                    {(profile.city || profile.country) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#8A9BB0]" />
                        {[profile.city, profile.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {profile.university && (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap size={13} className="text-[#8A9BB0]" />
                        {profile.study_level && `${profile.study_level} · `}
                        {profile.field_of_study || profile.university}
                      </span>
                    )}
                    {nextAvail && (
                      <span className="flex items-center gap-1.5 text-[#0F9691]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
                        Dispo {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#64788C]">{profile.bio}</p>
                  )}

                  {(profile.user?.phone || profile.cv_path) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.user?.phone && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EBF1] bg-[#F9FBFC] px-3 py-1.5 text-xs text-[#334B63]">
                          <Phone size={12} className="text-[#16B8B1]" />
                          {profile.user.phone}
                        </span>
                      )}
                      {profile.cv_path && (
                        <a
                          href={`${STORAGE_URL}/${profile.cv_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                        >
                          <FileText size={12} /> Mon CV
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E4EBF1] bg-[#F9FBFC] p-3.5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#0B1F33]">Profil complété à {completion} %</span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-[#E4EBF1]"
                      role="progressbar"
                      aria-valuenow={completion}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Complétion du profil"
                    >
                      <div
                        className="h-full rounded-full bg-[#16B8B1] transition-all duration-500 motion-reduce:transition-none"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-[#64788C]">
                      {missing.length === 0
                        ? "Bravo, ton profil est complet."
                        : `À renseigner : ${missing.map((m) => m.label.replace(/^Ajouter (des |une |un )?/, "")).join(", ")}.`}
                    </p>
                  </div>
                  {missing.length > 0 && (
                    <button
                      type="button"
                      onClick={missing[0].action}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#E4EBF1] bg-white px-4 py-2 text-sm font-semibold text-[#0B1F33] transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      Compléter mon profil <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            <Panel
              icon={Sparkles}
              title="Compétences clés"
              count={skills.length}
              action={<AddButton onClick={() => openModal("skill")}>Ajouter</AddButton>}
            >
              {skills.length === 0 ? (
                <EmptyBlock icon={Sparkles} text="Aucune compétence pour l'instant." actionLabel="Ajouter une compétence" onAction={() => openModal("skill")} />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li
                      key={s.id}
                      title={`${LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}${s.pivot?.years_experience ? ` · ${s.pivot.years_experience} an(s)` : ""}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#BDEFE7] bg-[#F0FDFA] py-1 pl-3 pr-1.5 text-xs font-medium text-[#0F766E]"
                    >
                      {s.name}
                      {s.pivot?.is_featured && <span className="text-amber-500">★</span>}
                      <span className="text-[10px] font-normal text-[#64788C]">
                        · {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                      </span>
                      <button
                        type="button"
                        onClick={() => detachSkill(s.id)}
                        aria-label={`Retirer ${s.name}`}
                        className="rounded-full p-0.5 text-[#70849B] transition hover:bg-rose-50 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div className="grid gap-5 md:grid-cols-2">
              <TimelineCard
                icon={BriefcaseBusiness}
                title="Expériences"
                items={experiences}
                emptyText="Aucune expérience renseignée."
                onAdd={() => openModal("experience")}
                onEdit={(i) => openModal("experience", i)}
                onDelete={(id) => handleDelete("experience", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-semibold text-[#0B1F33]">{i.title}</p>
                    <p className="text-xs text-[#64788C]">{[i.company, i.location].filter(Boolean).join(" · ")}</p>
                    {fmtRange(i) && <p className="mt-0.5 text-xs text-[#8A9BB0]">{fmtRange(i)}</p>}
                  </>
                )}
              />
              <TimelineCard
                icon={GraduationCap}
                title="Formations"
                items={educations}
                emptyText="Aucune formation renseignée."
                onAdd={() => openModal("education")}
                onEdit={(i) => openModal("education", i)}
                onDelete={(id) => handleDelete("education", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-semibold text-[#0B1F33]">
                      {i.degree}
                      {i.study_level && <span className="font-medium text-[#0F9691]"> · {i.study_level}</span>}
                    </p>
                    <p className="text-xs text-[#64788C]">
                      {[i.institution, i.field_of_study].filter(Boolean).join(" · ")}
                    </p>
                    {fmtRange(i) && <p className="mt-0.5 text-xs text-[#8A9BB0]">{fmtRange(i)}</p>}
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
                icon={Award}
                title="Certifications"
                items={profile.certifications || []}
                emptyText="Aucune certification renseignée."
                onAdd={() => openModal("certification")}
                onEdit={(i) => openModal("certification", i)}
                onDelete={(id) => handleDelete("certification", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-semibold text-[#0B1F33]">{i.name}</p>
                    <p className="text-xs text-[#64788C]">{i.issuing_organization}</p>
                    {i.issue_date && <p className="mt-0.5 text-xs text-[#8A9BB0]">{fmtMonth(i.issue_date)}</p>}
                  </>
                )}
              />
              <TimelineCard
                icon={Languages}
                title="Langues"
                items={profile.languages || []}
                emptyText="Aucune langue renseignée."
                onAdd={() => openModal("language")}
                onEdit={(i) => openModal("language", i)}
                onDelete={(id) => handleDelete("language", id)}
                render={(i) => (
                  <>
                    <p className="text-sm font-semibold text-[#0B1F33]">{i.name}</p>
                    <p className="text-xs text-[#64788C]">{LANGUAGE_LEVEL_LABEL[i.level] || LEVEL_LABEL[i.level] || i.level}</p>
                  </>
                )}
              />
            </div>
          </div>

          <aside className="space-y-5">
            <Panel icon={Eye} title="Visibilité du profil">
              <p className="text-xs leading-5 text-[#64788C]">
                Choisis ce que les organisations peuvent découvrir avant toute mise en relation.
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#E4EBF1] bg-[#F9FBFC] px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#0B1F33]">
                    {profile.visibility === "public" ? "Profil visible" : "Profil privé"}
                  </p>
                  <p className="text-xs text-[#64788C]">
                    {profile.visibility === "public"
                      ? "Les recruteurs et entreprises peuvent consulter ton profil."
                      : "Seul toi peux voir ton profil."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.visibility === "public"}
                  aria-label="Rendre le profil public"
                  onClick={toggleVisibility}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    profile.visibility === "public" ? "bg-[#16B8B1]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                      profile.visibility === "public" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-xs text-[#8A9BB0]">Les coordonnées restent masquées.</p>
            </Panel>

            <Panel icon={Link2} title="Liens professionnels">
              {links.length === 0 ? (
                <EmptyBlock icon={Link2} text="Aucun lien renseigné." compact />
              ) : (
                <ul className="space-y-2">
                  {links.map(({ key, label, icon: Icon }) => (
                    <li key={key}>
                      <a
                        href={profile[key]}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-[#E4EBF1] p-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F6FA] text-[#334B63] group-hover:bg-emerald-100 group-hover:text-emerald-700">
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#0B1F33]">{label}</span>
                          <span className="block truncate text-xs text-[#8A9BB0]">{prettyUrl(profile[key])}</span>
                        </span>
                        <ExternalLink size={14} className="shrink-0 text-slate-300 group-hover:text-emerald-600" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => openModal("info")}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#CBD8E3] px-3 py-2 text-sm font-medium text-[#334B63] transition hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Plus size={14} /> {links.length === 0 ? "Ajouter un lien" : "Ajouter ou modifier un lien"}
              </button>
            </Panel>

            <Panel icon={Lightbulb} title="Conseils pour améliorer votre profil">
              <ul className="space-y-1">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={c.action}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-[#F5F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          c.done ? "bg-[#16B8B1] text-white" : "border-2 border-slate-300 text-transparent"
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className={`text-sm ${c.done ? "text-[#8A9BB0] line-through" : "font-medium text-[#0B1F33]"}`}>
                        {c.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/job-offers"
                className="mt-3 flex items-center justify-between rounded-xl bg-[#F0FDFA] px-3.5 py-2.5 text-sm font-semibold text-[#0F766E] transition hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Voir les opportunités <ChevronRight size={15} />
              </Link>
            </Panel>

            {portfolio && (
              <Panel icon={Palette} title="Apparence du portfolio">
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((theme) => {
                    const active = portfolio.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => changeTheme(theme.id)}
                        aria-pressed={active}
                        title={theme.desc}
                        className={`group relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          active
                            ? "border-[#16B8B1] bg-[#F0FDFA] shadow-sm"
                            : "border-[#E4EBF1] bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                        }`}
                      >
                        <span
                          className={`h-6 w-6 shrink-0 rounded-md ${theme.preview} ${
                            active ? "ring-2 ring-[#16B8B1] ring-offset-1" : ""
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold leading-tight text-[#0B1F33]">
                            {theme.label}
                          </span>
                          <span className="block truncate text-[10px] leading-tight text-[#8A9BB0]">
                            {theme.desc}
                          </span>
                        </span>
                        {active && <Check size={13} className="shrink-0 text-[#0F9691]" />}
                      </button>
                    );
                  })}
                </div>
              </Panel>
            )}

            {profile.is_young_talent && (
              <Panel icon={GraduationCap} title="Conseils Young Talent">
                <ol className="space-y-2.5 text-sm text-[#64788C]">
                  <li className="flex gap-2">
                    <span className="font-bold text-[#0F9691]">1.</span>
                    <span>Ajoute tes <strong className="text-[#0B1F33]">projets universitaires</strong> pour montrer tes compétences.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#0F9691]">2.</span>
                    <span>Précise tes <strong className="text-[#0B1F33]">disponibilités</strong> (stage, alternance, premier emploi).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#0F9691]">3.</span>
                    <span>Mets à jour ton <strong className="text-[#0B1F33]">CV</strong> et ton LinkedIn.</span>
                  </li>
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
    </AppShell>
  );
}

/* ============================================================
   COMPOSANTS D'INTERFACE
============================================================ */

function Panel({ icon: Icon, title, count, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[#E4EBF1] bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F9691]">
              <Icon size={16} strokeWidth={1.9} />
            </span>
          )}
          <h2 className="truncate font-bold text-[#0B1F33]">{title}</h2>
          {typeof count === "number" && (
            <span className="rounded-full bg-[#F1F6FA] px-2 py-0.5 text-xs font-semibold text-[#64788C]">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ onClick, children, icon: Icon = Plus }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#E4EBF1] px-2.5 py-1.5 text-xs font-semibold text-[#334B63] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <Icon size={13} /> {children}
    </button>
  );
}

function Chip({ icon: Icon, tone = "emerald", children }) {
  const tones = {
    emerald: "border-[#BDEFE7] bg-[#F0FDFA] text-[#0F766E]",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function EmptyBlock({ icon: Icon, text, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border border-dashed border-[#D5DFE8] bg-[#F9FBFC] px-4 text-center ${compact ? "py-5" : "py-8"}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8A9BB0] shadow-sm">
        <Icon size={19} />
      </span>
      <p className="mt-2.5 text-sm text-[#64788C]">{text}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline"
        >
          <Plus size={14} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function IconAction({ onClick, label, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-md p-1.5 text-[#8A9BB0] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        danger ? "hover:bg-rose-50 hover:text-rose-500" : "hover:bg-emerald-50 hover:text-emerald-600"
      }`}
    >
      {children}
    </button>
  );
}

function TimelineCard({ icon, title, items = [], emptyText, onAdd, onEdit, onDelete, render }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 3);

  return (
    <Panel
      icon={icon}
      title={title}
      count={items.length}
      action={<AddButton onClick={onAdd}>Ajouter</AddButton>}
    >
      {items.length === 0 ? (
        <EmptyBlock icon={icon} text={emptyText} actionLabel="Ajouter" onAction={onAdd} compact />
      ) : (
        <>
          <ol className="ml-1.5 space-y-4 border-l border-[#E4EBF1] pl-5">
            {visible.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#16B8B1] ring-4 ring-white" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">{render(item)}</div>
                  <div className="flex shrink-0 gap-0.5">
                    <IconAction label="Modifier" onClick={() => onEdit(item)}>
                      <Edit size={13} />
                    </IconAction>
                    <IconAction label="Supprimer" danger onClick={() => onDelete(item.id)}>
                      <Trash2 size={13} />
                    </IconAction>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline"
            >
              {showAll ? "Voir moins" : `Voir tout (${items.length})`} <ChevronRight size={12} className={showAll ? "-rotate-90" : "rotate-90"} />
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
    <Panel
      icon={FolderKanban}
      title="Projets & réalisations"
      count={projects.length}
      action={<AddButton onClick={onAdd}>Ajouter</AddButton>}
    >
      {projects.length === 0 ? (
        <EmptyBlock icon={FolderKanban} text="Aucun projet pour l'instant." actionLabel="Ajouter un projet" onAction={onAdd} />
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
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline"
            >
              {showAll ? "Voir moins" : `Voir tout (${projects.length})`}
              <ChevronRight size={12} className={showAll ? "-rotate-90" : "rotate-90"} />
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

/* ---------- Carte projet (design moderne) ---------- */
function ProjectCard({ project: p, onEdit, onDelete }) {
  const type = PROJECT_TYPES[p.project_type || "professional"] || PROJECT_TYPES.professional;
  const TypeIcon = type.icon;
  const techs = Array.isArray(p.technologies) ? p.technologies : [];

  // Récupère l'image (URL complète ou chemin relatif)
  const image =
    p.image_url ||
    p.thumbnail_url ||
    p.cover_image ||
    (p.image_path ? `${STORAGE_URL}/${p.image_path}` : null);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_30px_rgba(15,30,69,0.08)]">
      {/* ===== Visuel / couverture ===== */}
      <div className="relative h-36 w-full overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Fallback : dégradé + icône du type
          <div
            className={`flex h-full w-full items-center justify-center ${
              p.project_type === "academic"
                ? "bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100"
                : p.project_type === "personal"
                ? "bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100"
                : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200"
            }`}
          >
            <TypeIcon
              size={44}
              strokeWidth={1.4}
              className={
                p.project_type === "academic"
                  ? "text-emerald-500/70"
                  : p.project_type === "personal"
                  ? "text-blue-500/70"
                  : "text-slate-400/80"
              }
            />
          </div>
        )}

        {/* Badge type en overlay */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${type.cls}`}
        >
          <TypeIcon size={11} />
          {type.label}
        </span>

        {/* Actions (edit/delete) en overlay, visibles au survol */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(p)}
            aria-label="Modifier le projet"
            className="rounded-lg bg-white/95 p-1.5 text-[#334B63] shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-600"
          >
            <Edit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(p.id)}
            aria-label="Supprimer le projet"
            className="rounded-lg bg-white/95 p-1.5 text-[#334B63] shadow-sm backdrop-blur transition hover:bg-white hover:text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ===== Contenu ===== */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-[#0B1F33]">{p.title}</h3>

        {p.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#64788C]">
            {p.description}
          </p>
        )}

        {techs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {techs.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="rounded-md bg-[#F1F6FA] px-2 py-0.5 text-[10px] font-medium text-[#334B63]"
              >
                {t}
              </span>
            ))}
            {techs.length > 4 && (
              <span className="rounded-md bg-[#F1F6FA] px-2 py-0.5 text-[10px] font-medium text-[#8A9BB0]">
                +{techs.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Lien élégant en pied de carte */}
        {p.project_url ? (
          <a
            href={p.project_url}
            target="_blank"
            rel="noreferrer"
            className="group/link mt-3 inline-flex items-center gap-1.5 self-start rounded-lg border border-[#E4EBF1] bg-[#F9FBFC] px-3 py-1.5 text-[11px] font-semibold text-[#334B63] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Voir le projet
            <ExternalLink
              size={11}
              className="transition-transform group-hover/link:translate-x-0.5"
            />
          </a>
        ) : (
          <span className="mt-3 text-[11px] italic text-[#8A9BB0]">
            Aucun lien renseigné
          </span>
        )}
      </div>
    </li>
  );
}

function ProfileSkeleton() {
  const pulse = "animate-pulse motion-reduce:animate-none rounded-2xl bg-white";
  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3" role="status" aria-label="Chargement du profil">
        <div className="space-y-5 lg:col-span-2">
          <div className={`h-80 ${pulse}`} />
          <div className={`h-32 ${pulse}`} />
          <div className="grid gap-5 md:grid-cols-2">
            <div className={`h-48 ${pulse}`} />
            <div className={`h-48 ${pulse}`} />
          </div>
        </div>
        <div className="space-y-5">
          <div className={`h-40 ${pulse}`} />
          <div className={`h-56 ${pulse}`} />
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
    <div className="mx-auto max-w-md rounded-2xl border border-[#E4EBF1] bg-white p-6 shadow-sm">
      <h1 className="text-lg font-bold text-[#0B1F33]">Créons ton profil</h1>
      <p className="mt-1 text-sm text-[#64788C]">Un titre professionnel suffit pour commencer.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <select
          className={inputCls}
          value={form.profile_type}
          onChange={(e) => setForm({ ...form, profile_type: e.target.value })}
        >
          <option value="employee">Salarié</option>
          <option value="student">Étudiant</option>
        </select>
        <input
          required
          placeholder="Titre professionnel"
          className={inputCls}
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <button
          disabled={saving}
          className="w-full rounded-lg bg-[#16B8B1] py-2.5 text-sm font-semibold text-[#07172A] transition hover:bg-[#0F9691] hover:text-white disabled:opacity-60"
        >
          {saving ? "Création..." : "Créer mon profil"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   MODAL ROUTER
============================================================ */

const FIELD_CLS =
  "w-full rounded-lg border border-[#E4EBF1] bg-[#F9FBFC] px-3 py-2 text-sm text-[#0B1F33] placeholder:text-[#8A9BB0] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

const LABEL_CLS = "mb-1 block text-xs font-semibold text-[#334B63]";

function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/40 backdrop-blur-[2px]"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8EEF3] px-5 py-3.5">
          <h3 className="font-bold text-[#0B1F33]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-[#8A9BB0] transition hover:bg-[#F1F6FA] hover:text-[#0B1F33]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[#E8EEF3] px-5 py-3">{footer}</div>}
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
      // 1. Sauvegarder le profil (sans le téléphone)
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

      // 2. Sauvegarder le téléphone sur /account
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
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre professionnel">
          <input className={FIELD_CLS} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </Field>

        <Field label="Bio">
          <textarea rows={3} className={FIELD_CLS} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>

        {/* Localisation avec bouton carte */}
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={LABEL_CLS}>Localisation</label>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E4EBF1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#334B63] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <MapPinned size={12} />
              Choisir sur la carte
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={FIELD_CLS}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ville"
            />
            <input
              className={FIELD_CLS}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Pays"
            />
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
          <p className="mt-1 text-[11px] text-[#8A9BB0]">
            Format international recommandé. Utilisé pour recevoir les SMS d'entretien.
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

      {/* Modal carte */}
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
  const [form, setForm] = useState({ name: "", level: "intermediate", years_experience: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selectedSkill) return;
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/skills", { params: { search: search.trim(), limit: 8 } });
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedSkill]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let skillId = selectedSkill?.id;
      if (!skillId) {
        const createRes = await api.post("/skills", { name: form.name.trim() });
        skillId = createRes.data?.id;
        if (!skillId) throw new Error("Impossible de créer la compétence.");
      }
      await api.post("/skills/attach", {
        skill_id: skillId,
        level: form.level,
        years_experience: form.years_experience === "" ? null : Number(form.years_experience),
      });
      flash("Compétence ajoutée", "success");
      onSaved();
    } catch (err) {
      console.error("Erreur ajout compétence :", err.response?.data || err);
      flash(
        err.response?.data?.message ||
          err.response?.data?.errors?.skill_id?.[0] ||
          "Erreur lors de l'ajout",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nom de la compétence">
        <input
          required
          autoComplete="off"
          className={FIELD_CLS}
          value={form.name}
          placeholder="Entrez une compétence"
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            setSelectedSkill(null);
            setSearch(e.target.value);
          }}
        />
      </Field>

      {!selectedSkill && search.trim().length >= 2 && (
        <div className="rounded-lg border border-[#E4EBF1] bg-white">
          {searching ? (
            <p className="px-3 py-2 text-xs text-[#8A9BB0]">Recherche...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#8A9BB0]">Aucune correspondance — cette compétence sera créée.</p>
          ) : (
            <ul className="max-h-44 overflow-y-auto">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkill(s);
                      setForm({ ...form, name: s.name });
                      setResults([]);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-emerald-50"
                  >
                    <span className="truncate text-[#0B1F33]">{s.name}</span>
                    {s.category?.name && (
                      <span className="shrink-0 text-[11px] text-[#8A9BB0]">{s.category.name}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedSkill && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700">
          <Check size={13} />
          Compétence existante sélectionnée
        </p>
      )}

      <Field label="Niveau">
        <select className={FIELD_CLS} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
          <option value="expert">Expert</option>
        </select>
      </Field>

      <Field label="Années d'expérience">
        <input type="number" min="0" max="60" className={FIELD_CLS} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
      </Field>

      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : expérience ---------- */
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
  const [mapOpen, setMapOpen] = useState(false);   // ✅ AJOUT

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

  // Récupère juste la ville depuis le MapPicker (le pays n'est pas utilisé ici)
  const handleCitySelect = ({ city }) => {
    if (!city) return;
    setForm((prev) => ({ ...prev, location: city }));
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Poste">
          <input required className={FIELD_CLS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>

        <Field label="Entreprise">
          <input required className={FIELD_CLS} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </Field>

        {/* ✅ Lieu avec bouton "Choisir sur la carte" */}
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={LABEL_CLS}>Lieu</label>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E4EBF1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#334B63] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <MapPinned size={12} />
              Choisir sur la carte
            </button>
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
            <input type="date" disabled={form.is_current} className={FIELD_CLS} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#334B63]">
          <input
            type="checkbox"
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

      {/* ✅ Modal carte */}
      <MapPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialCity={form.location}
        onSelect={handleCitySelect}
      />
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
    <form onSubmit={submit} className="space-y-3">
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
          {[
            { v: "L1", label: "L1" },
            { v: "L2", label: "L2" },
            { v: "L3", label: "L3" },
            { v: "M1", label: "M1" },
            { v: "M2", label: "M2" },
            { v: "Licence", label: "Licence" },
            { v: "Master", label: "Master" },
            { v: "BTS", label: "BTS" },
            { v: "DUT", label: "DUT" },
            { v: "Doctorat", label: "Doctorat" },
            { v: "Autre", label: "Autre" },
          ].map(({ v, label }) => {
            const active = form.study_level === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  if (v === "Autre") {
                    setForm({ ...form, study_level: active ? "" : "Autre", custom_study_level: "" });
                  } else {
                    setForm({ ...form, study_level: active ? "" : v, custom_study_level: "" });
                  }
                }}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  active
                    ? "border-[#16B8B1] bg-[#16B8B1] text-white shadow-sm"
                    : "border-[#E4EBF1] bg-white text-[#334B63] hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {form.study_level === "Autre" && (
          <div className="mt-2">
            <input
              type="text"
              autoFocus
              placeholder="Précise ton niveau (ex: C2, Bac+4, Certificat pro...)"
              className={FIELD_CLS}
              value={form.custom_study_level || ""}
              onChange={(e) => setForm({ ...form, custom_study_level: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-[#8A9BB0]">
              Ce niveau personnalisé sera utilisé dans ton profil.
            </p>
          </div>
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Début">
          <input type="date" className={FIELD_CLS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Fin">
          <input type="date" disabled={form.is_current} className={FIELD_CLS} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#334B63]">
        <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked, end_date: e.target.checked ? "" : form.end_date })} />
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
    <form onSubmit={submit} className="space-y-3">
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
    <form onSubmit={submit} className="space-y-3">
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
    <form onSubmit={submit} className="space-y-3">
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
      ? Math.max(
          0,
          Math.round((new Date(form.end_at) - new Date(form.start_at)) / (1000 * 60 * 60 * 24))
        ) + 1
      : null;

  return (
    <form onSubmit={submit} className="space-y-5">
      <section>
        <Label icon={CheckCircle2}>Statut de disponibilité</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { v: "available", label: "Disponible", dot: "bg-emerald-500", ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
            { v: "partially_available", label: "Partiel", dot: "bg-amber-500", ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
            { v: "unavailable", label: "Indisponible", dot: "bg-rose-500", ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300" },
            { v: "on_mission", label: "En mission", dot: "bg-blue-500", ring: "ring-blue-200", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
          ].map((s) => {
            const active = form.status === s.v;
            return (
              <button
                key={s.v}
                type="button"
                onClick={() => setForm({ ...form, status: s.v })}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  active
                    ? `${s.border} ${s.bg} ${s.text} ring-2 ${s.ring}`
                    : "border-[#E4EBF1] bg-white text-[#334B63] hover:border-[#CBD8E3] hover:bg-[#F9FBFC]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E4EBF1] bg-[#F9FBFC] p-4">
        <Label icon={Calendar}>Période</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8A9BB0]">Début</span>
            <input type="date" required className={FIELD_CLS} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8A9BB0]">Fin</span>
            <input type="date" required className={FIELD_CLS} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
        </div>
        {days !== null && days > 0 && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#0F9691]">
            <Clock size={12} />
            {days} jour{days > 1 ? "s" : ""} de disponibilité
          </p>
        )}
      </section>

      <section>
        <Label icon={BriefcaseBusiness}>Type de contrat</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
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
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#16B8B1] bg-[#16B8B1] text-white shadow-sm"
                    : "border-[#E4EBF1] bg-white text-[#334B63] hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <Label icon={Percent}>Charge de travail</Label>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input type="number" min="0" className={FIELD_CLS} value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: e.target.value })} placeholder="Ex: 50" />
          <select className={`${FIELD_CLS} sm:w-40`} value={form.workload_unit} onChange={(e) => setForm({ ...form, workload_unit: e.target.value })}>
            <option value="percentage">%</option>
            <option value="hours_per_week">h / semaine</option>
            <option value="days_per_week">jours / semaine</option>
          </select>
        </div>
      </section>

      <section>
        <Label icon={MapPin}>Localisation</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { v: "onsite", label: "Sur site", emoji: "🏢" },
            { v: "remote", label: "Télétravail", emoji: "🏠" },
            { v: "hybrid", label: "Hybride", emoji: "🔄" },
          ].map(({ v, label, emoji }) => {
            const active = form.location_type === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, location_type: v })}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#16B8B1] bg-[#16B8B1] text-white shadow-sm"
                    : "border-[#E4EBF1] bg-white text-[#334B63] hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            );
          })}
        </div>

        {form.location_type !== "remote" && (
          <input className={`${FIELD_CLS} mt-2.5`} value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} placeholder="Ville (ex: Antananarivo)" />
        )}
      </section>

      <section>
        <Label icon={FileText}>Notes (optionnel)</Label>
        <textarea rows={3} className={`${FIELD_CLS} mt-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Disponible pour un stage de 6 mois à partir de mars" />
      </section>

      <section className="rounded-2xl border border-dashed border-[#E4EBF1] p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-4 w-4 accent-[#16B8B1]" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
          <div>
            <p className="text-sm font-semibold text-[#0B1F33]">Disponibilité récurrente</p>
            <p className="text-xs text-[#64788C]">Ex: tous les lundis, une semaine sur deux...</p>
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
    <div className="mt-5 flex justify-end gap-2 border-t border-[#E8EEF3] pt-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-[#E4EBF1] px-4 py-2 text-sm font-semibold text-[#334B63] transition hover:bg-[#F5F8FA]"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[#16B8B1] px-4 py-2 text-sm font-semibold text-[#07172A] transition hover:bg-[#0F9691] hover:text-white disabled:opacity-60"
      >
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}

/* ---------- Petit label avec icône ---------- */
function Label({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-[#0F9691]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-[#334B63]">
        {children}
      </span>
    </div>
  );
}