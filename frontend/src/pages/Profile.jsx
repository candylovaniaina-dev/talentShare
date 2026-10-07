import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Edit, X, MapPin, GraduationCap, ShieldCheck,
  Eye, ExternalLink, Check, AlertCircle,
  Palette, Globe2, Phone, FileText, Sparkles, Search,
  Camera,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import api from "../services/api";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import { Card, SectionTitle, EmptyState, GhostButton, Badge } from "../components/ui/Card";
import { useToast } from "../context/ToastContext";

const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
const LEVEL_LABEL = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", expert: "Expert",
};

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

  if (first || last) {
    return `${first[0] || ""}${last[0] || ""}`.toUpperCase() || "?";
  }

  if (user.name && user.name.trim()) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast(); // ✅ AJOUT
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
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
        setAvailability([]);
        setLoading(false);
        return;
      }

      profileData.availability_windows = availRes.data || [];
      setProfile(profileData);
      setAvailability(availRes.data || []);

      try {
        const pf = await api.get("/portfolio/my");
        setPortfolio(pf.data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 422) {
          setPortfolio(null);
        } else {
          console.error("Erreur /portfolio/my :", status, err.response?.data);
          setPortfolio(null);
        }
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

  // ✅ Wrapper pour garder compatibilité
  const flash = (text, type = "success") => showToast(text, type);

  const openModal = (type, item = null) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const handleDelete = async (type, id) => {
    if (!confirm("Supprimer cet élément ?")) return;
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
    if (!confirm("Supprimer ce projet ?")) return;
    try {
      await api.delete(`/portfolio/projects/${id}`);
      flash("Projet supprimé", "success");
      load();
    } catch {
      flash("Erreur", "error");
    }
  };

  const deleteAvailability = async (id) => {
    if (!confirm("Supprimer cette disponibilité ?")) return;
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return flash("Photo trop lourde (max 10 Mo)", "error");
    }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/profile/avatar", fd);
      flash("Photo de profil mise à jour", "success");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return flash("Image trop lourde (max 10 Mo)", "error");
    }
    setUploadingCover(true);
    const fd = new FormData();
    fd.append("cover", file);
    try {
      await api.post("/profile/cover", fd);
      flash("Photo de couverture mise à jour", "success");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
          Chargement...
        </div>
      </AppShell>
    );
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
  const hasAnyLink =
    profile.linkedin_url || profile.github_url || profile.behance_url || profile.portfolio_url;

  const checklist = [
    { done: (profile.skills || []).length > 0, label: "Compétences renseignées", action: () => openModal("skill") },
    { done: (profile.experiences || []).length > 0, label: "Ajouter une expérience", action: () => openModal("experience") },
    { done: hasAnyLink, label: "Ajouter un lien professionnel", action: () => openModal("info") },
    { done: (profile.educations || []).length > 0, label: "Ajouter une formation", action: () => openModal("education") },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const academicProjects = (portfolio?.projects || []).filter((p) => p.project_type === "academic").length;
  const personalProjects = (portfolio?.projects || []).filter((p) => p.project_type === "personal").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        {/* ===== TITRE DE PAGE ===== */}
       

        {/* ===== LAYOUT 3 COLONNES ===== */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* CARTE IDENTITÉ */}
            <Card className="overflow-hidden p-0">
  {/* ===== BANNIÈRE ===== */}
  <div
    className="group relative h-32 cursor-pointer overflow-hidden bg-gradient-to-r from-[#0F1E45] to-emerald-600/30"
    onClick={() => coverInputRef.current?.click()}
  >
    {profile.cover_path && (
      <img
        src={`http://localhost:8000/storage/${profile.cover_path}`}
        alt="cover"
        className="h-full w-full object-cover"
      />
    )}
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
      <span className="inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900">
        <Camera size={13} />
        {uploadingCover ? "Envoi..." : profile.cover_path ? "Changer la couverture" : "Ajouter une couverture"}
      </span>
    </div>
    <input
      ref={coverInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleCoverUpload}
    />
  </div>

  {/* ===== CORPS ===== */}
  <div className="relative px-5 pb-5">
    {/* Ligne haute : Avatar + Boutons (alignés en haut) */}
    <div className="-mt-14 flex items-end justify-between gap-4">
      {/* Avatar */}
      <div
        className="group relative shrink-0 cursor-pointer"
        onClick={() => avatarInputRef.current?.click()}
      >
        {profile.avatar_path ? (
          <img
            src={`http://localhost:8000/storage/${profile.avatar_path}`}
            alt="avatar"
            className="h-28 w-28 rounded-full border-4 border-[var(--bg-surface)] object-cover shadow-xl"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[var(--bg-surface)] bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-bold text-white shadow-xl">
            {getInitials(profile.user)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
          <span className="text-[10px] font-semibold text-white">
            {uploadingAvatar ? "Envoi..." : "Changer"}
          </span>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* Boutons à droite */}
      <div className="flex shrink-0 items-center gap-2 pb-2">
        {portfolio?.public_slug ? (
          <Link
            to={`/portfolio/${portfolio.public_slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-2 text-xs font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
          >
            <Eye size={13} /> Aperçu
          </Link>
        ) : (
          <button
            onClick={() => navigate("/portfolio/create")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-2 text-xs font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
          >
            <Eye size={13} /> Créer
          </button>
        )}
        <button
          onClick={() => openModal("info")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400"
        >
          <Edit size={13} /> Modifier
        </button>
      </div>
    </div>

    {/* ===== Nom + Headline + Badges ===== */}
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-bold leading-tight text-[var(--text-app)]">
          {getDisplayName(profile.user)}
        </h2>
        {profile.is_verified && <Badge icon={ShieldCheck}>Vérifié</Badge>}
        {profile.is_young_talent && <Badge>Young Talent</Badge>}
        {profile.looking_for_opportunity && (
          <Badge icon={Search} tone="amber">En recherche</Badge>
        )}
      </div>

      {profile.headline && (
        <p className="mt-1 text-sm font-semibold text-emerald-400">
          {profile.headline}
        </p>
      )}

      {/* Méta : ville, origine, université, dispo */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--text-muted)]">
        {(profile.city || profile.country) && (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--text-faint)]" />
            {profile.city && profile.country
              ? `${profile.city}, ${profile.country}`
              : profile.city || profile.country}
          </span>
        )}
        {profile.university && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <GraduationCap size={12} />
            {profile.study_level && `${profile.study_level} · `}
            {profile.field_of_study || profile.university}
          </span>
        )}
        {nextAvail && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Dispo {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
          {profile.bio}
        </p>
      )}
    </div>

    {/* ===== Séparateur ===== */}
    <div className="mt-5 border-t border-[var(--border-app)]" />

    {/* ===== Contact + Liens en chips modernes ===== */}
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {profile.user?.phone && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
          <Phone size={12} className="text-emerald-400" />
          {profile.user.phone}
        </span>
      )}

      {profile.cv_path && (
        <a
          href={`http://localhost:8000/storage/${profile.cv_path}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
        >
          <FileText size={12} />
          Mon CV
          <span className="text-[10px] opacity-70">PDF</span>
        </a>
      )}

      {profile.portfolio_url && (
        <a
          href={profile.portfolio_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <Globe2 size={12} />
          Portfolio
          <ExternalLink size={10} className="opacity-60" />
        </a>
      )}

      {profile.linkedin_url && (
        <a
          href={profile.linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
        >
          <ExternalLink size={12} />
          LinkedIn
        </a>
      )}

      {profile.github_url && (
        <a
          href={profile.github_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
        >
          <ExternalLink size={12} />
          GitHub
        </a>
      )}

      {profile.behance_url && (
        <a
          href={profile.behance_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
        >
          <ExternalLink size={12} />
          Behance
        </a>
      )}
    </div>
  </div>
</Card>
            {/* CARTE PARCOURS ACADÉMIQUE */}
            {profile.is_young_talent && (profile.university || profile.study_level) && (
              <Card>
                <SectionTitle title="Parcours académique" />
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-medium text-emerald-400">
                    {profile.study_level && `${profile.study_level}`}
                    {profile.field_of_study && ` · ${profile.field_of_study}`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {profile.university}
                  </p>
                  {profile.looking_for_opportunity && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      <Search size={9} /> Recherche active
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* CARTE DISPONIBILITÉS */}
            <AvailabilitySection
              profile={profile}
              onOpenModal={openModal}
              onDelete={deleteAvailability}
            />

            {/* CARTE APPARENCE DU PORTFOLIO */}
            {portfolio && (
              <Card>
                <SectionTitle title="Apparence du portfolio" />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: "minimal",   label: "Minimal",   desc: "Épuré & navy",          preview: "bg-slate-200" },
                    { id: "bold",      label: "Bold",      desc: "Sombre & impactant",    preview: "bg-[#0B1633]" },
                    { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-[var(--border-app)]" },
                    { id: "vibrant",   label: "Vibrant",   desc: "Coloré & moderne",      preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
                  ].map((theme) => {
                    const active = portfolio.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => changeTheme(theme.id)}
                        className={`rounded-md border p-2 text-left transition ${
                          active
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-[var(--border-app)] bg-[var(--bg-surface-hover)] hover:border-emerald-500/40"
                        }`}
                      >
                        <div className={`mb-1.5 h-12 rounded ${theme.preview}`} />
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium text-[var(--text-app)]">
                            {theme.label}
                          </p>
                          {active && <Check size={12} className="text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-[var(--text-faint)]">{theme.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* COMPÉTENCES + PROJETS */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <SectionTitle
                  title="Compétences clés"
                  action={
                    <GhostButton icon={Plus} onClick={() => openModal("skill")}>
                      Ajouter
                    </GhostButton>
                  }
                />
                {(profile.skills || []).length === 0 ? (
                  <EmptyState emoji="💡" text="Aucune compétence pour l'instant." />
                ) : (
                  <div className="space-y-4">
                    {groupSkillsByCategory(profile.skills).map((group) => (
                      <div key={group.category}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                          {group.icon} {group.category}
                        </p>
                        <div className="space-y-2">
                          {group.skills.map((s) => (
                            <div
                              key={s.id}
                              className="group relative rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-2.5"
                            >
                              <button
                                onClick={() => detachSkill(s.id)}
                                className="absolute right-1.5 top-1.5 hidden text-[var(--text-faint)] hover:text-rose-400 group-hover:block"
                              >
                                <X size={11} />
                              </button>
                              <div className="flex items-center justify-between gap-1">
                                <p className="truncate text-xs font-medium text-[var(--text-app)]">
                                  {s.name}
                                </p>
                                {s.pivot?.is_featured && (
                                  <span className="text-[10px] text-amber-400">★</span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-faint)]">
                                {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                                {s.pivot?.years_experience
                                  ? ` · ${s.pivot.years_experience} an${
                                      s.pivot.years_experience > 1 ? "s" : ""
                                    }`
                                  : ""}
                              </p>
                              <div className="mt-1.5 h-1 rounded-full bg-[var(--bg-surface-hover)]">
                                <div
                                  className="h-1 rounded-full bg-emerald-400"
                                  style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionTitle
                  title="Projets & réalisations"
                  action={
                    <GhostButton icon={Plus} onClick={() => openModal("project")}>
                      Ajouter
                    </GhostButton>
                  }
                />
                {!portfolio || (portfolio.projects || []).length === 0 ? (
                  <EmptyState
                    emoji="📁"
                    text="Aucun projet pour l'instant."
                    action={
                      <button
                        onClick={() => openModal("project")}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Ajoutez-en un
                      </button>
                    }
                  />
                ) : (
                  <>
                    {(academicProjects > 0 || personalProjects > 0) && (
                      <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
                        {academicProjects > 0 && (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-400">
                            🎓 {academicProjects} universitaire{academicProjects > 1 ? "s" : ""}
                          </span>
                        )}
                        {personalProjects > 0 && (
                          <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-400">
                            👤 {personalProjects} personnel{personalProjects > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {portfolio.projects.map((p) => {
                        const typeConfig = {
                          academic:     { icon: "🎓", color: "text-emerald-400", bg: "bg-emerald-500/15" },
                          personal:     { icon: "👤", color: "text-blue-400",   bg: "bg-blue-500/15" },
                          professional: { icon: "💼", color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-surface-hover)]" },
                        }[p.project_type || "professional"];

                        return (
                          <div
                            key={p.id}
                            className="group relative rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3"
                          >
                            <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                              <button
                                onClick={() => openModal("project", p)}
                                className="text-[var(--text-faint)] hover:text-emerald-400"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                onClick={() => deleteProject(p.id)}
                                className="text-[var(--text-faint)] hover:text-rose-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded text-xs ${typeConfig.bg} ${typeConfig.color}`}
                              >
                                {typeConfig.icon}
                              </span>
                              <p className="truncate text-xs font-medium text-[var(--text-app)]">
                                {p.title}
                              </p>
                            </div>
                            {p.description && (
                              <p className="mt-1.5 line-clamp-2 text-[11px] text-[var(--text-muted)]">
                                {p.description}
                              </p>
                            )}
                            {p.technologies?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {p.technologies.slice(0, 3).map((t, i) => (
                                  <span
                                    key={i}
                                    className="rounded border border-[var(--border-app)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
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
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300"
                              >
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
            </div>

            {/* EXPÉRIENCES + FORMATIONS */}
            <div className="grid gap-4 md:grid-cols-2">
              <CompactSection
                title="Expériences"
                items={profile.experiences}
                onAdd={() => openModal("experience")}
                onEdit={(i) => openModal("experience", i)}
                onDelete={(id) => handleDelete("experience", id)}
                render={(i) => (
                  <>
                    <p className="text-xs font-medium text-[var(--text-app)]">{i.title}</p>
                    <p className="text-[11px] text-[var(--text-faint)]">{i.company}</p>
                  </>
                )}
              />

              <CompactSection
                title="Formations"
                items={profile.educations}
                onAdd={() => openModal("education")}
                onEdit={(i) => openModal("education", i)}
                onDelete={(id) => handleDelete("education", id)}
                render={(i) => (
                  <>
                    <p className="text-xs font-medium text-[var(--text-app)]">
                      {i.degree}{" "}
                      {i.study_level && <span className="text-emerald-400">· {i.study_level}</span>}
                    </p>
                    <p className="text-[11px] text-[var(--text-faint)]">
                      {i.institution}
                      {i.field_of_study && ` · ${i.field_of_study}`}
                    </p>
                  </>
                )}
              />
            </div>

            {/* CERTIFICATIONS + LANGUES */}
            <div className="grid gap-4 md:grid-cols-2">
              <CompactSection
                title="Certifications"
                items={profile.certifications}
                onAdd={() => openModal("certification")}
                onEdit={(i) => openModal("certification", i)}
                onDelete={(id) => handleDelete("certification", id)}
                render={(i) => (
                  <>
                    <p className="text-xs font-medium text-[var(--text-app)]">{i.name}</p>
                    <p className="text-[11px] text-[var(--text-faint)]">{i.issuing_organization}</p>
                  </>
                )}
              />

              <CompactSection
                title="Langues"
                items={profile.languages}
                onAdd={() => openModal("language")}
                onEdit={(i) => openModal("language", i)}
                onDelete={(id) => handleDelete("language", id)}
                render={(i) => (
                  <>
                    <p className="text-xs font-medium text-[var(--text-app)]">{i.name}</p>
                    <p className="text-[11px] text-[var(--text-faint)]">
                      {LEVEL_LABEL[i.level] || i.level}
                    </p>
                  </>
                )}
              />
            </div>
          </div>

          {/* ---- SIDEBAR ---- */}
          <div className="space-y-4">
            <Card>
              <SectionTitle title="Visibilité" />
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                Choisissez ce que les organisations peuvent découvrir avant toute mise en relation.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-[var(--text-app)]">
                    {profile.visibility === "public" ? "Profil public" : "Profil privé"}
                  </p>
                  <p className="text-[10px] text-[var(--text-faint)]">Portfolio visible</p>
                </div>
                <button
                  onClick={toggleVisibility}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    profile.visibility === "public" ? "bg-emerald-500" : "bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                      profile.visibility === "public" ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-[var(--text-faint)]">
                Les coordonnées restent masquées.
              </p>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle title="Complétion" />
                <span className="text-xs font-semibold text-emerald-400">{completion}%</span>
              </div>
              <div className="mb-3 h-1 rounded-full bg-[var(--bg-surface-hover)]">
                <div
                  className="h-1 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button onClick={c.action} className="flex w-full items-center gap-2 text-left">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          c.done
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-[var(--bg-surface-hover)] text-[var(--text-faint)]"
                        }`}
                      >
                        {c.done ? <Check size={10} /> : <Plus size={10} />}
                      </span>
                      <span
                        className={`text-[11px] ${
                          c.done
                            ? "text-[var(--text-muted)] line-through"
                            : "text-[var(--text-app)] hover:text-emerald-400"
                        }`}
                      >
                        {c.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/opportunites"
                className="mt-3 block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center text-[11px] font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              >
                Voir les opportunités →
              </Link>
            </Card>

            {profile.is_young_talent && (
              <Card>
                <SectionTitle title="Conseils Young Talent" />
                <ul className="space-y-2 text-[11px] text-[var(--text-muted)]">
                  <li className="flex gap-2">
                    <span className="text-emerald-400">1.</span>
                    Ajoute tes <strong className="text-[var(--text-app)]">projets universitaires</strong> pour montrer tes compétences.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400">2.</span>
                    Précise tes <strong className="text-[var(--text-app)]">disponibilités</strong> (stage, alternance, premier emploi).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400">3.</span>
                    Mets à jour ton <strong className="text-[var(--text-app)]">CV</strong> et ton LinkedIn.
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
          onSaved={() => {
            closeModal();
            load();
          }}
          onRefresh={load}
          flash={flash}
        />
      )}
    </AppShell>
  );
}

// ============================================
// COMPOSANTS DE BLOC
// ============================================

function CompactSection({ title, items = [], onAdd, onEdit, onDelete, render }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-app)]"
        >
          <span className="text-[var(--text-faint)]">{open ? "▾" : "▸"}</span>
          {title}
          <span className="text-[10px] font-normal normal-case tracking-normal text-[var(--text-faint)]">
            ({items.length})
          </span>
        </button>
        <GhostButton icon={Plus} onClick={onAdd}>
          Ajouter
        </GhostButton>
      </div>
      {open &&
        (items.length === 0 ? (
          <p className="mt-3 text-[11px] text-[var(--text-faint)]">Aucun élément pour l'instant.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">{render(item)}</div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-[var(--text-faint)] hover:text-emerald-400"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-[var(--text-faint)] hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </Card>
  );
}

function EmptyProfileCreate({ onCreated }) {
  const [form, setForm] = useState({ profile_type: "employee", headline: "", visibility: "public" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/profile", form);
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-base font-semibold text-[var(--text-app)]">Créons votre profil</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Un titre professionnel suffit pour commencer.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <select
          className={selectCls}
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
          className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Création..." : "Créer mon profil"}
        </button>
      </form>
    </div>
  );
}

// ============================================
// MODAL ROUTER
// ============================================
function ModalRouter({ modal, profile, onClose, onSaved, onRefresh, flash }) {
  const { type, item } = modal;
  if (type === "info")
    return (
      <InfoModal
        profile={profile}
        item={item}
        onClose={onClose}
        onSaved={onSaved}
        onRefresh={onRefresh}
      />
    );
  if (type === "skill") return <SkillModal item={item} onClose={onClose} onSaved={onSaved} />;
  if (type === "project") return <ProjectModal item={item} onClose={onClose} onSaved={onSaved} flash={flash} />;
  if (type === "availability") return <AvailabilityModal item={item} onClose={onClose} onSaved={onSaved} />;
  return <EntityModal type={type} item={item} onClose={onClose} onSaved={onSaved} />;
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-app)]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-faint)] hover:text-[var(--text-app)]"
          >
            <X size={16} />
          </button>
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
  "w-full rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1.5 text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20";
const selectCls = inputCls;
const labelCls = "text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]";

// ============================================
// AVAILABILITY MODAL
// ============================================
function AvailabilityModal({ item, onClose, onSaved }) {
  const { showToast } = useToast();
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
      api
        .post("/availability/check-overlap", {
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
      if (item) await api.patch(`/availability/${item.id}`, payload);
      else await api.post("/availability", payload);
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={item ? "Modifier la disponibilité" : "Ajouter une disponibilité"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="max-h-[70vh] space-y-2.5 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Début</label>
            <input
              type="date"
              required
              value={form.start_at}
              onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <label className={labelCls}>Fin</label>
            <input
              type="date"
              required
              value={form.end_at}
              min={form.start_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className={`mt-1 ${inputCls}`}
            />
          </div>
        </div>

        {checking && <p className="text-[10px] text-[var(--text-faint)]">Vérification...</p>}
        {conflict?.has_overlap && (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-400">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <p>
              Chevauchement : du{" "}
              {new Date(conflict.availability_conflict.start_at).toLocaleDateString("fr-FR")} au{" "}
              {new Date(conflict.availability_conflict.end_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}
        {conflict?.has_mission_conflict && (
          <div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] text-blue-400">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <p>
              Mission existante : du{" "}
              {new Date(conflict.mission_conflict.start_at).toLocaleDateString("fr-FR")} au{" "}
              {new Date(conflict.mission_conflict.end_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}
       

        <div>
          <label className={labelCls}>Statut</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={`mt-1 ${selectCls}`}
          >
            <option value="available">🟢 Disponible</option>
            <option value="partially_available">🟡 Partiel</option>
            <option value="unavailable">🔴 Indisponible</option>
            <option value="on_mission">🔵 En mission</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={`mt-1 ${selectCls}`}
          >
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
            <input
              type="number"
              min="0"
              max="100"
              value={form.workload_value}
              onChange={(e) => setForm({ ...form, workload_value: e.target.value })}
              className={inputCls}
            />
            <select
              value={form.workload_unit}
              onChange={(e) => setForm({ ...form, workload_unit: e.target.value })}
              className={selectCls}
            >
              <option value="percentage">%</option>
              <option value="hours_per_week">h/sem</option>
              <option value="days_per_week">j/sem</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Localisation</label>
          <select
            value={form.location_type}
            onChange={(e) => setForm({ ...form, location_type: e.target.value })}
            className={`mt-1 ${selectCls}`}
          >
            <option value="onsite">🏢 Sur site</option>
            <option value="remote">🏠 Télétravail</option>
            <option value="hybrid">🔄 Hybride</option>
          </select>
          {(form.location_type === "onsite" || form.location_type === "hybrid") && (
            <input
              type="text"
              placeholder="Ville"
              value={form.location_city}
              onChange={(e) => setForm({ ...form, location_city: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          />
          🔁 Récurrente
        </label>
        {form.is_recurring && (
          <select
            value={form.recurrence_pattern}
            onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })}
            className={selectCls}
          >
            <option value="">Motif</option>
            <option value="weekly">Hebdo</option>
            <option value="biweekly">Bi-hebdo</option>
            <option value="monthly">Mensuel</option>
          </select>
        )}

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`mt-1 ${inputCls}`}
          />
        </div>

        <button
          type="submit"
          disabled={saving || conflict?.has_overlap || conflict?.has_mission_conflict}
          className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>
    </ModalShell>
  );
}

// ============================================
// INFO MODAL
// ============================================
function InfoModal({ profile, onClose, onSaved, onRefresh }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    first_name: profile.user?.first_name || "",
    last_name: profile.user?.last_name || "",
    phone: profile.user?.phone || "",
    user_country: profile.user?.country || "",
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
    is_young_talent: profile.is_young_talent || profile.profile_type === "student",
    looking_for_opportunity: profile.looking_for_opportunity || false,
    university: profile.university || "",
    field_of_study: profile.field_of_study || "",
    study_level: profile.study_level || "",
  });
  const [uploadingCv, setUploadingCv] = useState(false);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Photo trop lourde (max 10 Mo)", "error");
      return;
    }
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/profile/avatar", fd);
      if (onRefresh) await onRefresh();
      showToast("Photo de profil mise à jour", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    }
  };

  const uploadCv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("CV trop lourd (max 5 Mo)", "error");
      return;
    }
    setUploadingCv(true);
    const fd = new FormData();
    fd.append("cv", file);
    try {
      await api.post("/profile/cv", fd);
      if (onRefresh) await onRefresh();
      showToast("CV mis à jour", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload CV", "error");
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
      is_young_talent: form.is_young_talent,
      looking_for_opportunity: form.looking_for_opportunity,
      university: form.is_young_talent ? form.university : null,
      field_of_study: form.is_young_talent ? form.field_of_study : null,
      study_level: form.is_young_talent ? form.study_level : null,
    });

    // ✅ Synchronisation Education pour Young Talent
    if (form.is_young_talent && form.university) {
      const educationPayload = {
        institution: form.university,
        degree: form.study_level || "Diplôme",
        field_of_study: form.field_of_study || null,
        study_level: form.study_level || null,
        start_date: new Date().toISOString().slice(0, 10),  // ✅ AJOUT
        is_current: true,
        is_young_talent: true,
      };
      const existingEdu = profile.educations?.[0];
      try {
        if (existingEdu) await api.patch(`/educations/${existingEdu.id}`, educationPayload);
        else await api.post("/educations", educationPayload);
      } catch (eduErr) {
        // ✅ Ne bloque pas la sauvegarde principale si l'éduc échoue
        console.warn("Erreur synchro éducation :", eduErr.response?.data);
        showToast("Profil sauvegardé (formation non synchronisée)", "warning");
      }
    }

    onSaved();
  } catch (err) {
    console.error("Erreur submit :", err.response?.data);
    showToast(err.response?.data?.message || "Erreur serveur", "error");
  }
};

  return (
    <ModalShell title="Modifier mon profil" onClose={onClose}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1 text-[11px] text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]">
          Changer la photo
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </label>

        <label className="cursor-pointer rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1 text-[11px] text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]">
          {uploadingCv ? "Envoi..." : profile.cv_path ? "Changer le CV" : "Téléverser CV"}
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCv} />
        </label>

        {profile.cv_path && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <Check size={10} /> CV téléversé
          </span>
        )}
      </div>

      <form onSubmit={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <section className="space-y-2">
          <p className={labelCls}>Identité</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Prénom</label>
              <input
                className={`mt-1 ${inputCls}`}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Nom</label>
              <input
                className={`mt-1 ${inputCls}`}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Téléphone</label>
            <input
              className={`mt-1 ${inputCls}`}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Pays d'origine</label>
            <select
              className={`mt-1 ${selectCls}`}
              value={form.user_country}
              onChange={(e) => setForm({ ...form, user_country: e.target.value })}
            >
              <option value="">Sélectionner</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-400">
            <input
              type="checkbox"
              checked={form.is_young_talent}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_young_talent: e.target.checked,
                  profile_type: e.target.checked ? "student" : "employee",
                })
              }
            />
            🎓 Je suis un Young Talent (étudiant / jeune diplômé)
          </label>

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
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
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

              <label className="flex items-center gap-2 text-[11px] text-emerald-400">
                <input
                  type="checkbox"
                  checked={form.looking_for_opportunity}
                  onChange={(e) => setForm({ ...form, looking_for_opportunity: e.target.checked })}
                />
                🔍 Je recherche activement une opportunité
              </label>
            </section>
          )}

          <div>
            <label className={labelCls}>Type de profil</label>
            <select
              className={`mt-1 ${selectCls}`}
              value={form.profile_type}
              onChange={(e) => setForm({ ...form, profile_type: e.target.value })}
            >
              <option value="employee">Salarié</option>
              <option value="student">Étudiant</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Titre pro *</label>
            <input
              required
              className={`mt-1 ${inputCls}`}
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea
              rows={3}
              className={`mt-1 ${inputCls}`}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        </section>

        <section className="space-y-2 border-t border-[var(--border-app)] pt-3">
          <p className={labelCls}>Localisation</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Pays</label>
              <select
                className={`mt-1 ${selectCls}`}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                <option value="">Sélectionner</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input
                list="city-list"
                className={`mt-1 ${inputCls}`}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <datalist id="city-list">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-[var(--border-app)] pt-3">
          <p className={labelCls}>Liens externes</p>
          {[
            ["portfolio_url", "Portfolio", "https://monportfolio.com"],
            ["linkedin_url", "LinkedIn", "https://linkedin.com/in/..."],
            ["github_url", "GitHub", "https://github.com/..."],
            ["behance_url", "Behance", "https://behance.net/..."],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="url"
                placeholder={placeholder}
                className={`mt-1 ${inputCls}`}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
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
  const { showToast } = useToast();
  const [allSkills, setAllSkills] = useState([]);
  const [rootCategories, setRootCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  // ✅ MULTI-SÉLECTION : un tableau au lieu d'un seul
  const [selectedSkills, setSelectedSkills] = useState(item ? [item] : []);

  const [level, setLevel] = useState(item?.pivot?.level || "intermediate");
  const [years, setYears] = useState(item?.pivot?.years_experience || "");
  const [notes, setNotes] = useState(item?.pivot?.notes || "");
  const [isFeatured, setIsFeatured] = useState(item?.pivot?.is_featured || false);
  const [saving, setSaving] = useState(false);

  // IDs des compétences DÉJÀ attachées au profil (pour les marquer)
  const [attachedIds, setAttachedIds] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/skill-categories"),
      api.get("/skills", { params: { limit: 500, sort: "popular" } }),
      api.get("/profile/me").catch(() => ({ data: null })),
    ])
      .then(([catRes, skillsRes, profileRes]) => {
        setRootCategories(catRes.data);
        setAllSkills(skillsRes.data);

        // ✅ Récupérer les IDs déjà attachés
        const existing = profileRes.data?.skills?.map((s) => s.id) || [];
        setAttachedIds(existing);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filtered = allSkills
    .filter((s) => {
      if (activeCategory) {
        const rootId = s.category?.parent?.id || s.category?.id;
        if (rootId !== activeCategory.id) return false;
      }
      if (search.trim().length === 0) return true;
      return normalize(s.name).includes(normalize(search));
    })
    .slice(0, 80);

  // ✅ Toggle une compétence dans la sélection
  const toggleSkill = (skill) => {
    // Mode édition : une seule compétence
    if (item) {
      setSelectedSkills([skill]);
      return;
    }

    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      }
      return [...prev, skill];
    });
  };

  const isSkillSelected = (skillId) =>
    selectedSkills.some((s) => s.id === skillId);

  const createNewSkill = async () => {
    if (search.trim().length < 2) return;
    try {
      const subCategories = rootCategories.flatMap((root) =>
        (root.children || []).map((sub) => ({ id: sub.id, label: `${root.name} › ${sub.name}` }))
      );
      const choice = prompt(
        `Sous-catégorie ?\n\n` +
          subCategories.map((s, i) => `${i + 1}. ${s.label}`).join("\n")
      );
      const categoryId = subCategories[Number(choice) - 1]?.id || null;
      const res = await api.post("/skills", {
        name: search.trim(),
        skill_category_id: categoryId,
      });
      setAllSkills([...allSkills, res.data]);
      toggleSkill(res.data);
      setSearch("");
      setActiveCategory(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    }
  };

  // ✅ Submit : boucle sur toutes les compétences sélectionnées
  const submit = async (e) => {
    e.preventDefault();
    if (selectedSkills.length === 0) return;

    setSaving(true);
    try {
      if (item) {
        // Mode édition : un seul PATCH
        const payload = {
          skill_id: selectedSkills[0].id,
          level,
          years_experience: years === "" ? null : Number(years),
          notes: notes || null,
          is_featured: isFeatured,
        };
        await api.patch(`/skills/${item.id}/level`, payload);
      } else {
        // ✅ Mode ajout multiple : un POST par compétence
        const promises = selectedSkills.map((skill) =>
          api.post("/skills/attach", {
            skill_id: skill.id,
            level,                        // niveau appliqué à toutes
            years_experience: years === "" ? null : Number(years),
            notes: notes || null,
            is_featured: isFeatured,
          })
        );

        await Promise.all(promises);
        showToast(
          `${selectedSkills.length} compétence${selectedSkills.length > 1 ? "s" : ""} ajoutée${selectedSkills.length > 1 ? "s" : ""}`,
          "success"
        );
      }
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={item ? "Modifier la compétence" : "Ajouter des compétences"}
      onClose={onClose}
    >
      {loading ? (
        <p className="py-6 text-center text-xs text-[var(--text-faint)]">Chargement...</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {/* Recherche */}
          <div>
            <label className={labelCls}>Rechercher</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: Laravel, SEO..."
                autoFocus
                className={inputCls}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-app)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Catégories */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                !activeCategory
                  ? "bg-emerald-500 text-[#0A1229]"
                  : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              Toutes
            </button>
            {rootCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory?.id === cat.id ? null : cat)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                  activeCategory?.id === cat.id
                    ? "bg-emerald-500 text-[#0A1229]"
                    : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Liste des compétences */}
          <div className="max-h-72 overflow-y-auto rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)]">
            {filtered.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-[11px] text-[var(--text-faint)]">Aucun résultat</p>
                {search.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={createNewSkill}
                    className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-[#0A1229] hover:bg-emerald-400"
                  >
                    <Plus size={10} /> Créer "{search}"
                  </button>
                )}
              </div>
            ) : (
              filtered.map((s) => {
                const isSelected = isSkillSelected(s.id);
                const isAttached = attachedIds.includes(s.id);
                const rootCategory = s.category?.parent;
                const subCategory = s.category;
                const rootName = rootCategory?.name || subCategory?.name || "Non classée";
                const rootIcon = rootCategory?.icon || subCategory?.icon || "🏷️";
                const breadcrumb = rootCategory
                  ? `${rootName} › ${subCategory?.name}`
                  : rootName;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    disabled={isAttached && !item}
                    className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition ${
                      isSelected
                        ? "border-l-2 border-emerald-400 bg-emerald-500/10"
                        : "hover:bg-[var(--bg-surface)]"
                    } ${isAttached ? "opacity-60" : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Checkbox visuelle */}
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-500 text-[#0A1229]"
                            : "border-[var(--border-app)] bg-transparent"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span className="text-sm">{rootIcon}</span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-[var(--text-app)]">
                          {s.name}
                          {isAttached && (
                            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase text-emerald-400">
                              Déjà ajoutée
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[10px] text-[var(--text-faint)]">{breadcrumb}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Compteur de sélection */}
          {selectedSkills.length > 0 && !item && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-[#0A1229]">
                  {selectedSkills.length}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-emerald-400">
                    {selectedSkills.map((s) => s.name).join(", ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkills([])}
                className="shrink-0 text-[10px] font-medium text-[var(--text-muted)] underline hover:text-rose-400"
              >
                Vider
              </button>
            </div>
          )}

          {/* Niveau / Années / Notes — s'appliquent à TOUTES les sélectionnées */}
          {selectedSkills.length > 0 && (
            <>
              

              <div>
                <label className={labelCls}>Niveau</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`mt-1 ${selectCls}`}
                >
                  <option value="beginner">🌱 Débutant</option>
                  <option value="intermediate">📘 Intermédiaire</option>
                  <option value="advanced">🚀 Avancé</option>
                  <option value="expert">🏆 Expert</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Années d'expérience</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </div>

              <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                ⭐ Mettre en avant
              </label>
            </>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={saving || selectedSkills.length === 0}
            className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving
              ? "Enregistrement..."
              : item
              ? "Mettre à jour"
              : selectedSkills.length === 0
              ? "Sélectionnez au moins une compétence"
              : `Ajouter ${selectedSkills.length} compétence${selectedSkills.length > 1 ? "s" : ""}`}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

// ============================================
// PROJECT MODAL
// ============================================
function ProjectModal({ item, onClose, onSaved, flash }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    project_url: item?.project_url || "",
    start_date: item?.start_date || "",
    end_date: item?.end_date || "",
    project_type: item?.project_type || "professional",
  });
  const [techInput, setTechInput] = useState((item?.technologies || []).join(", "));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const technologies = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const data = { ...form, technologies };
    if (!data.project_url) delete data.project_url;
    if (!data.start_date) delete data.start_date;
    if (!data.end_date) delete data.end_date;
    try {
      if (item) await api.patch(`/portfolio/projects/${item.id}`, data);
      else await api.post("/portfolio/projects", data);
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={item ? "Modifier le projet" : "Ajouter un projet"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5">
        <input
          required
          placeholder="Titre"
          className={inputCls}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          rows={3}
          placeholder="Description"
          className={inputCls}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

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

        <input
          type="url"
          placeholder="Lien du projet"
          className={inputCls}
          value={form.project_url}
          onChange={(e) => setForm({ ...form, project_url: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className={inputCls}
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <input
            type="date"
            className={inputCls}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
        <input
          placeholder="Technologies (virgules)"
          className={inputCls}
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : item ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>
    </ModalShell>
  );
}

// ============================================
// ENTITY MODAL
// ============================================
function EntityModal({ type, item, onClose, onSaved }) {
  const { showToast } = useToast();
  const editingId = item?.id || null;
  const [form, setForm] = useState(item || getDefaultForm(type));

  function getDefaultForm(t) {
    switch (t) {
      case "experience":
        return {
          title: "",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          is_current: false,
          description: "",
        };
      case "education":
        return {
          institution: "",
          degree: "",
          field_of_study: "",
          study_level: "",
          start_date: "",
          end_date: "",
          is_current: false,
          is_young_talent: false,
        };
      case "certification":
        return {
          name: "",
          issuing_organization: "",
          issue_date: "",
          credential_url: "",
        };
      case "language":
        return { name: "", level: "conversational" };
      default:
        return {};
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
    const endpoints = {
      experience: "/experiences",
      education: "/educations",
      certification: "/certifications",
      language: "/languages",
    };
    try {
      if (editingId) await api.patch(`${endpoints[type]}/${editingId}`, form);
      else await api.post(endpoints[type], form);
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    }
  };

  return (
    <ModalShell title={titles[type]} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5">
        {type === "experience" && (
          <>
            <input
              required
              name="title"
              placeholder="Poste"
              className={inputCls}
              value={form.title || ""}
              onChange={handleChange}
            />
            <input
              required
              name="company"
              placeholder="Entreprise"
              className={inputCls}
              value={form.company || ""}
              onChange={handleChange}
            />
            <input
              name="location"
              placeholder="Lieu"
              className={inputCls}
              value={form.location || ""}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                name="start_date"
                className={inputCls}
                value={form.start_date || ""}
                onChange={handleChange}
              />
              <input
                type="date"
                name="end_date"
                disabled={form.is_current}
                className={inputCls}
                value={form.end_date || ""}
                onChange={handleChange}
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                name="is_current"
                checked={form.is_current || false}
                onChange={handleChange}
              />
              Poste actuel
            </label>
            <textarea
              name="description"
              placeholder="Description"
              rows={2}
              className={inputCls}
              value={form.description || ""}
              onChange={handleChange}
            />
          </>
        )}

        {type === "education" && (
          <>
            <input
              required
              name="institution"
              placeholder="Établissement"
              className={inputCls}
              value={form.institution || ""}
              onChange={handleChange}
            />
            <input
              required
              name="degree"
              placeholder="Diplôme"
              className={inputCls}
              value={form.degree || ""}
              onChange={handleChange}
            />
            <div>
              <label className={labelCls}>Niveau d'étude</label>
              <select
                name="study_level"
                className={`mt-1 ${selectCls}`}
                value={form.study_level || ""}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                {STUDY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="field_of_study"
              placeholder="Filière"
              className={inputCls}
              value={form.field_of_study || ""}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                name="start_date"
                className={inputCls}
                value={form.start_date || ""}
                onChange={handleChange}
              />
              <input
                type="date"
                name="end_date"
                disabled={form.is_current}
                className={inputCls}
                value={form.end_date || ""}
                onChange={handleChange}
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                name="is_current"
                checked={form.is_current || false}
                onChange={handleChange}
              />
              En cours
            </label>
            <label className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-400">
              <input
                type="checkbox"
                name="is_young_talent"
                checked={form.is_young_talent || false}
                onChange={handleChange}
              />
              🎓 Formation en cours (Young Talent)
            </label>
          </>
        )}

        {type === "certification" && (
          <>
            <input
              required
              name="name"
              placeholder="Nom"
              className={inputCls}
              value={form.name || ""}
              onChange={handleChange}
            />
            <input
              required
              name="issuing_organization"
              placeholder="Organisme"
              className={inputCls}
              value={form.issuing_organization || ""}
              onChange={handleChange}
            />
            <input
              required
              type="date"
              name="issue_date"
              className={inputCls}
              value={form.issue_date || ""}
              onChange={handleChange}
            />
            <input
              name="credential_url"
              placeholder="Lien"
              className={inputCls}
              value={form.credential_url || ""}
              onChange={handleChange}
            />
          </>
        )}

        {type === "language" && (
          <>
            <select
              required
              name="name"
              className={selectCls}
              value={form.name || ""}
              onChange={handleChange}
            >
              <option value="">Choisir une langue</option>
              {[
                "Français",
                "Anglais",
                "Malagasy",
                "Espagnol",
                "Allemand",
                "Italien",
                "Portugais",
                "Russe",
                "Chinois",
                "Japonais",
                "Arabe",
                "Hindi",
              ].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              name="level"
              className={selectCls}
              value={form.level || "conversational"}
              onChange={handleChange}
            >
              <option value="basic">Notions</option>
              <option value="conversational">Intermédiaire</option>
              <option value="fluent">Courant</option>
              <option value="native">Langue maternelle</option>
            </select>
          </>
        )}

        <button className="w-full rounded-md bg-emerald-500 py-2 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400">
          {editingId ? "Mettre à jour" : "Enregistrer"}
        </button>
      </form>
    </ModalShell>
  );
}