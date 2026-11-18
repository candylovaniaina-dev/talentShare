import React, { useEffect, useRef, useState, useMemo } from "react";
import { Check, ChevronDown, FolderTree, Plus, Search, X, MapPin, Phone, Building2, MessageCircle, ChevronRight, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import AvailabilitySection from "../components/AvailabilitySection";
import MapPicker from "../components/MapPicker";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import PublicPortfolio from "./PublicPortfolio";
import StudentUniversityLink from "../components/university/StudentUniversityLink";
import VerifiedBadge from "../components/university/VerifiedBadge";

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
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    grad: "from-emerald-100 to-teal-100",
    ink: "text-emerald-700/25",
  },
  personal: {
    label: "Personnel",
    cls: "bg-sky-50 text-sky-700 border-sky-200",
    grad: "from-sky-100 to-indigo-100",
    ink: "text-sky-700/25",
  },
  professional: {
    label: "Professionnel",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    grad: "from-slate-100 to-slate-200",
    ink: "text-slate-600/25",
  },
};

const THEMES = [
  { id: "minimal", label: "Minimal", desc: "Épuré & navy", preview: "bg-slate-200" },
  { id: "bold", label: "Bold", desc: "Sombre & impactant", preview: "bg-[#0B1633]" },
  { id: "corporate", label: "Corporate", desc: "Sidebar professionnel", preview: "bg-white border border-slate-200" },
  { id: "vibrant", label: "Vibrant", desc: "Coloré & moderne", preview: "bg-gradient-to-br from-pink-400 to-purple-500" },
];

const CARD = "rounded-xl border border-slate-200/80 bg-white shadow-sm";

const FIELD_CLS =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 transition " +
  "hover:border-slate-300 focus:border-[#16B8B1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16B8B1]/20";

const SKILL_FIELD = FIELD_CLS;
const LABEL_CLS = "mb-1.5 block text-xs font-medium text-slate-600";
const PILL_ON = "border-[#16B8B1] bg-[#16B8B1] text-white";
const PILL_OFF = "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#16B8B1] px-4 py-2.5 text-sm font-semibold text-white transition " +
  "hover:bg-[#0F9691] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition " +
  "hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] focus-visible:ring-offset-2 disabled:opacity-60";

const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

function getDisplayName(user) {
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

/* ✅ FORMATAGE / VALIDATION DES CHAMPS */

const formatPhone = (value) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)}`;
};

const isValidPhone = (value) => {
  if (!value) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 && /^0\d{9}$/.test(digits);
};

const isValidEmail = (value) => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value.startsWith("http") ? value : `https://${value}`);
    return true;
  } catch {
    return false;
  }
};

/* ✅ COMPOSANT D'ERREUR DE CHAMP */
function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
      <AlertCircle size={12} /> {children}
    </p>
  );
}

function FieldHint({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[11px] leading-4 text-slate-400">{children}</p>;
}

/* ✅ COMPOSANT DE SUCCÈS PLEIN ÉCRAN */
function SuccessOverlay({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0B2236]/80 p-6 backdrop-blur-sm">
      <div className="relative flex flex-col items-center text-center animate-in zoom-in duration-300">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#16B8B1]/20 shadow-[0_0_50px_rgba(22,184,177,0.4)]">
          <CheckCircle2 size={64} className="text-[#16B8B1] animate-bounce" />
        </div>
        <h2 className="mt-8 text-2xl font-bold text-white">Succès !</h2>
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-300">{message}</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-[#16B8B1]">
          
          <span>Mise à jour effectuée</span>
        </div>
      </div>
    </div>
  );
}

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

  /* ✅ State pour le message de succès plein écran */
  const [successMessage, setSuccessMessage] = useState(null);

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

  /* ✅ Handler centralisé : ferme la modale, affiche le succès, recharge */
  const handleModalSuccess = (message) => {
    closeModal();
    if (message) setSuccessMessage(message);
    load();
  };

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
      <div className="min-h-screen bg-[#F4F7FA] px-3 py-5 text-[#0B2236] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-6">

          {/* En-tête */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                profile.visibility === "public"
                  ? "border-[#16B8B1]/30 bg-[#E6F7F6] text-[#0B2236]"
                  : "border-slate-200 bg-white text-slate-600"
              }`}>
                <span className={`h-2 w-2 rounded-full ${profile.visibility === "public" ? "bg-[#16B8B1]" : "bg-slate-400"}`} />
                {profile.visibility === "public" ? "Profil public" : "Profil privé"}
              </span>
              <button type="button" onClick={() => openModal("info")} className={BTN_PRIMARY}>
                <span className="text-base leading-none">＋</span> Modifier le profil
              </button>
            </div>
          </div>

          {/* Carte identité */}
          <section className="group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_50px_-32px_rgba(15,41,67,0.15)]">
            <div className="relative h-40 overflow-hidden bg-gradient-to-r from-[#0B263D] via-[#0D4552] to-[#16B8B1] sm:h-52">
              {profile.cover_path ? (
                <img src={`${STORAGE_URL}/${profile.cover_path}`} alt="Couverture du profil" className="h-full w-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 18% 25%, #8DE7D2 0, transparent 24%), radial-gradient(circle at 82% 5%, #65B9D7 0, transparent 28%), linear-gradient(120deg, transparent 45%, rgba(255,255,255,.12) 45.2%, transparent 45.6%)" }} />
                  <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10" />
                  <div className="absolute -right-2 -top-16 h-64 w-64 rounded-full border border-white/10" />
                  <div className="absolute bottom-5 left-7 hidden text-xs font-semibold uppercase tracking-[0.3em] text-white/35 sm:block">TalentShare · Professional identity</div>
                </>
              )}
              <div className="absolute right-4 top-4">
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                  className="rounded-xl border border-white/25 bg-slate-950/25 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-slate-950/45 disabled:opacity-60">
                  {uploadingCover ? "Téléversement…" : "Modifier la couverture"}
                </button>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>
            </div>

            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-4">
                  <div className="relative shrink-0">
                    {profile.avatar_path ? (
                      <img src={`${STORAGE_URL}/${profile.avatar_path}`} alt="Photo de profil" className="h-24 w-24 rounded-[24px] border-[5px] border-white object-cover shadow-xl sm:h-28 sm:w-28" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-[24px] border-[5px] border-white bg-gradient-to-br from-[#16B8B1] to-[#0B2236] text-3xl font-bold text-white shadow-xl sm:h-28 sm:w-28">
                        {getInitials(profile.user)}
                      </div>
                    )}
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                      className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-[#0B2236] text-sm text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#16B8B1]"
                      title="Changer la photo">
                      {uploadingAvatar ? "…" : "✎"}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold tracking-tight text-[#0B2236] sm:text-2xl">{getDisplayName(profile.user)}</h2>
                      {profile.is_verified && <Chip tone="emerald">Vérifié</Chip>}
                      {profile.is_young_talent && <Chip tone="emerald">Young Talent</Chip>}
                      <VerifiedBadge userId={profile.user_id || profile.user?.id} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-[#16B8B1]">
                      {profile.headline || "Ajoutez un titre professionnel pour vous présenter"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:pb-1">
                  {portfolio?.public_slug ? (
                    <button type="button" onClick={() => setPreviewOpen(true)} className={BTN_SECONDARY}>Voir mon portfolio <span>↗</span></button>
                  ) : (
                    <button type="button" onClick={() => navigate("/portfolio/create")} className={BTN_SECONDARY}>Créer mon portfolio <span>↗</span></button>
                  )}
                  {profile.cv_path && (
                    <a href={`${STORAGE_URL}/${profile.cv_path}`} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>Télécharger mon CV ↓</a>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                    {(profile.city || profile.country) && <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-[#16B8B1]" />{[profile.city, profile.country].filter(Boolean).join(", ")}</span>}
                    {profile.user?.phone && <span className="inline-flex items-center gap-2"><Phone size={14} className="text-[#16B8B1]" />{profile.user.phone}</span>}
                    {nextAvail && <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F6] px-3 py-1 text-xs font-semibold text-[#0B2236]"><span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />Disponible dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>}
                  </div>
                  {profile.bio && <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{profile.bio}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for_opportunity && <Chip tone="amber">En recherche d’opportunités</Chip>}
                </div>
              </div>
            </div>
          </section>

          {/* Navigation rapide */}
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur" aria-label="Navigation du profil">
            {[
              ["#competences", "Compétences"],
              ["#parcours", "Parcours"],
              ["#projets", "Projets"],
              ["#disponibilites", "Disponibilités"],
              ["#complement", "Informations"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-[#E6F7F6] hover:text-[#0B2236]">{label}</a>
            ))}
          </nav>

          {/* Indicateurs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Compétences", value: skills.length, note: "Savoir-faire", icon: "✦" },
              { label: "Expériences", value: experiences.length, note: "Expérience terrain", icon: "↗" },
              { label: "Formations", value: educations.length, note: "Parcours académique", icon: "⌂" },
              { label: "Réalisations", value: projects.length, note: "Projets présentés", icon: "▧" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F7F6] text-lg font-bold text-[#16B8B1]">{stat.icon}</span>
                </div>
                <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-bold tracking-tight text-[#0B2236]">{stat.value}</span><span className="pb-1 text-[11px] text-slate-400">{stat.note}</span></div>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="min-w-0 space-y-6">
              <div id="competences" className="scroll-mt-24">
                <Panel title="Compétences & expertises" count={skills.length} action={<AddButton onClick={() => openModal("skill")}>Ajouter</AddButton>}>
                  {skills.length === 0 ? (
                    <EmptyBlock text="Ajoutez vos compétences pour aider les organisations à identifier votre expertise." actionLabel="Ajouter une compétence" onAction={() => openModal("skill")} />
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {skills.map((s) => {
                        const catObj = s.category || s.skill_category || s.skillCategory || s.skill_category_data;
                        const catName = catObj?.name;
                        const subCatName = catObj?.parent?.name || catObj?.parent_category?.name;
                        const displayPath = [subCatName, catName].filter(Boolean).join(" · ");
                        return (
                          <li key={s.id} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#F7FBFC] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#16B8B1] hover:shadow-lg">
                            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[42px] bg-[#E6F7F6] transition group-hover:scale-125" />
                            <div className="relative flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#0B2236]">{s.name}</p>
                                {displayPath && <p className="mt-1 truncate text-[11px] text-slate-400">{displayPath}</p>}
                              </div>
                              {s.pivot?.is_featured && <span className="text-amber-500">★</span>}
                            </div>
                            <div className="relative mt-4 flex items-center justify-between gap-2">
                              <div><LevelDots level={s.pivot?.level} /><span className="mt-1 block text-[11px] text-slate-500">{LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}</span></div>
                              {s.pivot?.years_experience > 0 && <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm">{s.pivot.years_experience} an{s.pivot.years_experience > 1 ? "s" : ""}</span>}
                            </div>
                            <button type="button" onClick={() => detachSkill(s.id)} aria-label={`Retirer ${s.name}`} className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-400 opacity-0 shadow-sm transition hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"><X size={14} /></button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              </div>

              <div id="parcours" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
                <TimelineCard title="Expériences professionnelles" items={experiences} emptyText="Votre parcours professionnel apparaîtra ici." onAdd={() => openModal("experience")} onEdit={(i) => openModal("experience", i)} onDelete={(id) => handleDelete("experience", id)}
                  render={(i) => <><p className="text-sm font-bold text-[#0B2236]">{i.title}</p><p className="mt-1 text-xs text-slate-500">{[i.company, i.location].filter(Boolean).join(" · ")}</p>{fmtRange(i) && <p className="mt-2 text-[11px] font-medium text-[#16B8B1]">{fmtRange(i)}</p>}</>} />
                <TimelineCard title="Formations & études" items={educations} emptyText="Ajoutez vos études et diplômes pour valoriser votre parcours." onAdd={() => openModal("education")} onEdit={(i) => openModal("education", i)} onDelete={(id) => handleDelete("education", id)}
                  render={(i) => <><p className="text-sm font-bold text-[#0B2236]">{i.degree}{i.study_level && <span className="font-medium text-[#16B8B1]"> · {i.study_level}</span>}</p><p className="mt-1 text-xs text-slate-500">{[i.institution, i.field_of_study].filter(Boolean).join(" · ")}</p>{fmtRange(i) && <p className="mt-2 text-[11px] font-medium text-[#16B8B1]">{fmtRange(i)}</p>}</>} />
              </div>

              <div id="projets" className="scroll-mt-24">
                <ProjectsPanel projects={projects} onAdd={() => openModal("project")} onEdit={(p) => openModal("project", p)} onDelete={deleteProject} />
              </div>

              <div id="disponibilites" className="scroll-mt-24">
                <AvailabilitySection profile={profile} onOpenModal={openModal} onDelete={deleteAvailability} />
              </div>

              <div id="complement" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
                <TimelineCard title="Certifications" items={profile.certifications || []} emptyText="Ajoutez vos certifications et attestations." onAdd={() => openModal("certification")} onEdit={(i) => openModal("certification", i)} onDelete={(id) => handleDelete("certification", id)}
                  render={(i) => <><p className="text-sm font-bold text-[#0B2236]">{i.name}</p><p className="mt-1 text-xs text-slate-500">{i.issuing_organization}</p>{i.issue_date && <p className="mt-2 text-[11px] text-[#16B8B1]">{fmtMonth(i.issue_date)}</p>}</>} />
                <TimelineCard title="Langues" items={profile.languages || []} emptyText="Ajoutez les langues que vous maîtrisez." onAdd={() => openModal("language")} onEdit={(i) => openModal("language", i)} onDelete={(id) => handleDelete("language", id)}
                  render={(i) => <><p className="text-sm font-bold text-[#0B2236]">{i.name}</p><p className="mt-1 text-xs text-slate-500">{LANGUAGE_LEVEL_LABEL[i.level] || LEVEL_LABEL[i.level] || i.level}</p></>} />
              </div>
            </main>

            <aside className="space-y-5 xl:sticky xl:top-24">
              <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0B2236] via-[#10465A] to-[#16B8B1] p-5 text-white shadow-xl">
                <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-white/10" />
                <div className="absolute -right-4 -top-6 h-28 w-28 rounded-full border border-white/10" />
                <div className="relative">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-white/65">Force du profil</p><span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold">En progression</span></div>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Complétion du profil">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r={ringR} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="8" /><circle cx="50" cy="50" r={ringR} fill="none" stroke="#16D0C3" strokeWidth="8" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - completion / 100)} className="transition-all duration-700" /></svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{completion}%</span>
                    </div>
                    <div><p className="text-sm font-semibold">{missing.length === 0 ? "Excellent travail !" : "Continuez à enrichir votre profil"}</p><p className="mt-1 text-xs leading-5 text-white/70">{missing.length === 0 ? "Votre profil contient les informations essentielles." : `${doneCount} étapes sur ${checklist.length} complétées.`}</p></div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#16D0C3] transition-all duration-700" style={{ width: `${completion}%` }} /></div>
                  {missing.length > 0 && <button type="button" onClick={missing[0].action} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#0B3546] transition hover:-translate-y-0.5 hover:bg-[#E6F7F6]">{missing[0].label} <span className="ml-1">→</span></button>}
                </div>
              </section>

              <Panel title="Visibilité du profil">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-bold text-[#0B2236]">{profile.visibility === "public" ? "Visible par les organisations" : "Profil privé"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{profile.visibility === "public" ? "Votre profil peut être découvert par les recruteurs." : "Votre profil n'est pas visible publiquement."}</p></div>
                  
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.visibility === "public"}
                    aria-label="Rendre le profil public"
                    onClick={toggleVisibility}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                      profile.visibility === "public" ? "bg-[#16B8B1]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        profile.visibility === "public" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                </div>
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">Vos coordonnées personnelles restent protégées.</p>
              </Panel>
{profile.profile_type === "student" && <StudentUniversityLink />}
              <Panel title="Liens professionnels">
                {links.length === 0 ? <EmptyBlock text="Ajoutez vos liens LinkedIn, GitHub ou portfolio." compact /> : <ul className="space-y-2">{links.map(({ key, label }) => <li key={key}><a href={profile[key]} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#16B8B1] hover:bg-[#E6F7F6]"><PlatformIcon platform={key} /><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-700">{label}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400">{prettyUrl(profile[key])}</span></span><span className="text-slate-300 transition group-hover:text-[#16B8B1]">↗</span></a></li>)}</ul>}
                <button type="button" onClick={() => openModal("info")} className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-[#16B8B1] hover:bg-[#E6F7F6] hover:text-[#0B2236]">＋ Ajouter ou modifier un lien</button>
              </Panel>

              <Panel title="À compléter">
                <ul className="space-y-1">{checklist.map((item) => <li key={item.label}><button type="button" onClick={item.action} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-[#16B8B1] text-white" : "border border-slate-300 text-transparent"}`}>{item.done ? <Check size={12} strokeWidth={3} /> : "·"}</span><span className={`text-xs ${item.done ? "text-slate-400 line-through" : "font-medium text-slate-600"}`}>{item.label}</span></button></li>)}</ul>
                <Link to="/job-offers" className="mt-3 flex items-center justify-between rounded-xl bg-[#E6F7F6] px-4 py-3 text-xs font-bold text-[#0B2236] transition hover:bg-[#DDF3ED]">Explorer les opportunités <span>→</span></Link>
              </Panel>

              {portfolio && <Panel title="Style du portfolio"><p className="mb-3 text-xs text-slate-500">Choisissez l’ambiance de votre portfolio public.</p><div className="grid grid-cols-2 gap-2">{THEMES.map((theme) => { const active = portfolio.theme === theme.id; return <button key={theme.id} type="button" onClick={() => changeTheme(theme.id)} aria-pressed={active} title={theme.desc} className={`rounded-xl border p-2 text-left transition ${active ? "border-[#16B8B1] bg-[#E6F7F6] ring-1 ring-[#16B8B1]" : "border-slate-200 hover:border-slate-300"}`}><span className={`block h-9 rounded-lg ${theme.preview}`} /><span className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-700">{theme.label}{active && <Check size={12} className="text-[#16B8B1]" />}</span><span className="mt-0.5 block truncate text-[9px] text-slate-400">{theme.desc}</span></button>; })}</div></Panel>}

              {profile.is_young_talent && <Panel title="Conseils Young Talent"><ol className="space-y-3 text-xs leading-5 text-slate-500">{[<>Ajoutez vos <strong className="text-slate-700">projets universitaires</strong> pour illustrer vos compétences.</>, <>Précisez vos <strong className="text-slate-700">disponibilités</strong> pour les stages et alternances.</>, <>Mettez à jour votre <strong className="text-slate-700">CV</strong> et votre profil LinkedIn.</>].map((tip, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F6] text-[10px] font-bold text-[#16B8B1]">{i + 1}</span><span>{tip}</span></li>)}</ol></Panel>}
            </aside>
          </div>
        </div>

        {/* ✅ MODAL ROUTER avec onSuccess centralisé */}
        {modal && (
          <ModalRouter
            modal={modal}
            profile={profile}
            onClose={closeModal}
            onSuccess={handleModalSuccess}
            onRefresh={load}
            flash={flash}
          />
        )}

        {previewOpen && <PublicPortfolio asModal onClose={() => setPreviewOpen(false)} data={{ ...portfolio, profile_data: profile, projects: portfolio.projects || [], public_slug: portfolio.public_slug, accent_color: portfolio.accent_color || "#16B8B1" }} />}

        {/* ✅ OVERLAY DE SUCCÈS */}
        {successMessage && (
          <SuccessOverlay message={successMessage} onClose={() => setSuccessMessage(null)} />
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
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-800">{title}</h2>
          {typeof count === "number" && <span className="text-xs text-slate-400">{count}</span>}
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
      className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      + {children}
    </button>
  );
}

function Chip({ tone = "emerald", children }) {
  const tones = {
    emerald: "border-teal-200 bg-teal-50 text-teal-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "amber" ? "bg-amber-500" : "bg-teal-500"}`} />
      {children}
    </span>
  );
}

function LevelDots({ level }) {
  const rank = LEVEL_RANK[level] || 2;
  return (
    <span className="flex items-center gap-0.5" aria-label={LEVEL_LABEL[level] || "Intermédiaire"}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-1.5 w-3 rounded-sm ${n <= rank ? "bg-teal-500" : "bg-slate-200"}`} />
      ))}
    </span>
  );
}

function EmptyBlock({ text, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center ${compact ? "py-5" : "py-8"}`}>
      <p className="text-sm text-slate-500">{text}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
      className={`rounded-md px-2 py-1 text-xs text-slate-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        danger ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-slate-100 hover:text-teal-600"
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
          <ol className="ml-1 space-y-5 border-l border-slate-200 pl-6">
            {visible.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-teal-500 ring-4 ring-white" />
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
              className="mt-4 text-xs font-medium text-teal-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
              className="mt-5 text-xs font-medium text-teal-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {showAll ? "Voir moins" : `Voir tout (${projects.length})`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

function ProjectCard({ project: p, onEdit, onDelete }) {
  const type = PROJECT_TYPES[p.project_type || "professional"] || PROJECT_TYPES.professional;
  const techs = Array.isArray(p.technologies) ? p.technologies : [];

  const image =
    p.image_url ||
    p.thumbnail_url ||
    p.cover_image ||
    (p.image_path ? `${STORAGE_URL}/${p.image_path}` : null);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white transition duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="relative h-36 w-full overflow-hidden border-b border-slate-100">
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
            className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur transition hover:text-teal-600"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => onDelete(p.id)}
            className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur transition hover:text-rose-600"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-800">{p.title}</h3>

        {p.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{p.description}</p>}

        {techs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techs.slice(0, 4).map((t, i) => (
              <span key={i} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
                {t}
              </span>
            ))}
            {techs.length > 4 && (
              <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-400">+{techs.length - 4}</span>
            )}
          </div>
        )}

        {p.project_url ? (
          <a
            href={p.project_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-medium text-teal-600 underline-offset-2 hover:underline"
          >
            Voir le projet <span>→</span>
          </a>
        ) : (
          <span className="mt-4 text-[11px] italic text-slate-400">Aucun lien renseigné</span>
        )}
      </div>
    </li>
  );
}

function ProfileSkeleton() {
  const pulse = "animate-pulse motion-reduce:animate-none rounded-xl bg-white/80";
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
      <p className="text-xs font-medium text-teal-600">Bienvenue</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-800">Créons votre profil</h1>
      <p className="mt-1 text-sm text-slate-500">Un titre professionnel suffit pour commencer.</p>
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
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold tracking-tight text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
      className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-teal-600 transition hover:bg-teal-50"
    >
      Choisir sur la carte
    </button>
  );
}

/* ✅ MODAL ROUTER : reçoit onSuccess au lieu de onSaved */
function ModalRouter({ modal, profile, onClose, onSuccess, flash }) {
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
      {type === "info" && (
        <ModalInfo
          profile={profile}
          onSuccess={() => onSuccess("Vos informations personnelles ont bien été enregistrées.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "skill" && (
        <ModalSkill
          onSuccess={() => onSuccess("Nouvelle compétence ajoutée à votre profil.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "experience" && (
        <ModalExperience
          item={item}
          onSuccess={() => onSuccess(item ? "Expérience mise à jour." : "Nouvelle expérience ajoutée.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "education" && (
        <ModalEducation
          item={item}
          onSuccess={() => onSuccess(item ? "Formation mise à jour." : "Nouvelle formation ajoutée.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "project" && (
        <ModalProject
          item={item}
          onSuccess={() => onSuccess(item ? "Projet mis à jour." : "Nouveau projet ajouté à votre portfolio.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "certification" && (
        <ModalCertification
          item={item}
          onSuccess={() => onSuccess(item ? "Certification mise à jour." : "Nouvelle certification enregistrée.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "language" && (
        <ModalLanguage
          item={item}
          onSuccess={() => onSuccess(item ? "Langue mise à jour." : "Nouvelle langue ajoutée à votre profil.")}
          onClose={onClose}
          flash={flash}
        />
      )}
      {type === "availability" && (
        <ModalAvailability
          item={item}
          onSuccess={() => onSuccess(item ? "Disponibilité mise à jour." : "Nouvelle disponibilité ajoutée.")}
          onClose={onClose}
          flash={flash}
        />
      )}
    </ModalShell>
  );
}

/* ---------- Modal : infos ---------- */
function ModalInfo({ profile, onSuccess, onClose, flash }) {
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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.phone && !isValidPhone(form.phone)) e.phone = "Format attendu : 034 56 789 00";
    if (form.linkedin_url && !isValidUrl(form.linkedin_url)) e.linkedin_url = "URL invalide";
    if (form.portfolio_url && !isValidUrl(form.portfolio_url)) e.portfolio_url = "URL invalide";
    if (form.github_url && !isValidUrl(form.github_url)) e.github_url = "URL invalide";
    if (form.behance_url && !isValidUrl(form.behance_url)) e.behance_url = "URL invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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

      onSuccess();
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

          onSuccess();
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
            <label className="block text-xs font-medium text-slate-600">Localisation</label>
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
            className={`${FIELD_CLS} ${errors.phone ? "border-rose-300" : ""}`}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="034 56 789 00"
            autoComplete="tel"
          />
          <FieldError>{errors.phone}</FieldError>
          <FieldHint>Format : 034 56 789 00 (10 chiffres, commence par 0). Jamais affiché publiquement.</FieldHint>
        </Field>

        <Field label="LinkedIn">
          <input className={`${FIELD_CLS} ${errors.linkedin_url ? "border-rose-300" : ""}`} value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
          <FieldError>{errors.linkedin_url}</FieldError>
        </Field>
        <Field label="Portfolio">
          <input className={`${FIELD_CLS} ${errors.portfolio_url ? "border-rose-300" : ""}`} value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://..." />
          <FieldError>{errors.portfolio_url}</FieldError>
        </Field>
        <Field label="GitHub">
          <input className={`${FIELD_CLS} ${errors.github_url ? "border-rose-300" : ""}`} value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." />
          <FieldError>{errors.github_url}</FieldError>
        </Field>
        <Field label="Behance">
          <input className={`${FIELD_CLS} ${errors.behance_url ? "border-rose-300" : ""}`} value={form.behance_url} onChange={(e) => setForm({ ...form, behance_url: e.target.value })} placeholder="https://behance.net/..." />
          <FieldError>{errors.behance_url}</FieldError>
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
function ModalSkill({ onSuccess, onClose, flash }) {
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
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.skill_id?.[0] || err.message || "Erreur lors de l’ajout de la compétence.";
      setError(message);
      flash(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const squareBtn =
    "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-600";
  const inlineAdd =
    "flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2";
  const inlineAddBtn =
    "rounded-lg bg-[#16B8B1] px-3.5 text-xs font-medium text-white transition hover:bg-[#0F9691] disabled:opacity-50";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-medium text-slate-800">Référentiel ouvert à tous les métiers</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Choisissez une catégorie, puis une sous-catégorie. Si elle n’existe pas, ajoutez-la : cette structure fonctionne pour tout domaine professionnel.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="skill-category" className={LABEL_CLS}>
          Domaine / catégorie <span className="text-rose-600">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FolderTree size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            Sous-catégorie <span className="text-slate-400">(facultatif)</span>
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
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            Compétence <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="skill-search"
              required
              autoComplete="off"
              value={selectedSkill?.name || skillSearch}
              onChange={(e) => { setSelectedSkill(null); setSkillSearch(e.target.value); }}
              placeholder="Rechercher ou saisir une compétence"
              className={`${SKILL_FIELD} pl-9 ${selectedSkill ? "border-teal-500 bg-teal-50/40" : ""}`}
            />
            {selectedSkill && (
              <button
                type="button"
                onClick={() => { setSelectedSkill(null); setSkillSearch(""); }}
                aria-label="Désélectionner la compétence"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {skillSearch.trim().length >= 2 && !selectedSkill && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {searchingSkills ? (
                <p className="px-3.5 py-2.5 text-xs text-slate-500">Recherche en cours…</p>
              ) : skillResults.length > 0 ? (
                <ul className="max-h-44 divide-y divide-slate-100 overflow-y-auto">
                  {skillResults.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedSkill(s); setSkillSearch(s.name); }}
                        className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-2.5 text-xs text-slate-500">
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
              onChange={(e) => setYearsExperience(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex. 3"
              className={SKILL_FIELD}
            />
            <FieldHint>Nombre entier entre 0 et 60.</FieldHint>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
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
function ModalExperience({ item, onSuccess, onClose, flash }) {
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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Poste requis";
    if (!form.company.trim()) e.company = "Entreprise requise";
    if (form.start_date && form.end_date && !form.is_current && form.end_date < form.start_date) {
      e.end_date = "La date de fin doit être postérieure au début";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (item) await api.put(`/experiences/${item.id}`, form);
      else await api.post("/experiences", form);
      onSuccess();
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
        <Field label="Poste *">
          <input className={`${FIELD_CLS} ${errors.title ? "border-rose-300" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <FieldError>{errors.title}</FieldError>
        </Field>

        <Field label="Entreprise *">
          <input className={`${FIELD_CLS} ${errors.company ? "border-rose-300" : ""}`} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <FieldError>{errors.company}</FieldError>
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-slate-600">Lieu</label>
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
            <input type="date" disabled={form.is_current} className={`${FIELD_CLS} ${errors.end_date ? "border-rose-300" : ""} disabled:bg-slate-50 disabled:opacity-60`} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <FieldError>{errors.end_date}</FieldError>
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-teal-600"
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
function ModalEducation({ item, onSuccess, onClose, flash }) {
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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.degree.trim()) e.degree = "Diplôme requis";
    if (!form.institution.trim()) e.institution = "Établissement requis";
    if (form.start_date && form.end_date && !form.is_current && form.end_date < form.start_date) {
      e.end_date = "La date de fin doit être postérieure au début";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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
      onSuccess();
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
      <Field label="Diplôme *">
        <input className={`${FIELD_CLS} ${errors.degree ? "border-rose-300" : ""}`} value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        <FieldError>{errors.degree}</FieldError>
      </Field>
      <Field label="Établissement *">
        <input className={`${FIELD_CLS} ${errors.institution ? "border-rose-300" : ""}`} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
        <FieldError>{errors.institution}</FieldError>
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
            <FieldHint>Ce niveau personnalisé sera utilisé dans votre profil.</FieldHint>
          </div>
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Début">
          <input type="date" className={FIELD_CLS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Fin">
          <input type="date" disabled={form.is_current} className={`${FIELD_CLS} ${errors.end_date ? "border-rose-300" : ""} disabled:bg-slate-50 disabled:opacity-60`} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          <FieldError>{errors.end_date}</FieldError>
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 accent-teal-600"
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
function ModalProject({ item, onSuccess, onClose, flash }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    project_type: item?.project_type || "professional",
    project_url: item?.project_url || "",
    technologies: Array.isArray(item?.technologies) ? item.technologies.join(", ") : "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Titre requis";
    if (form.project_url && !isValidUrl(form.project_url)) e.project_url = "URL invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (item) await api.put(`/portfolio/projects/${item.id}`, payload);
      else await api.post("/portfolio/projects", payload);
      onSuccess();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titre *">
        <input className={`${FIELD_CLS} ${errors.title ? "border-rose-300" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <FieldError>{errors.title}</FieldError>
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
      <Field label="Technologies">
        <input className={FIELD_CLS} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, Figma" />
        <FieldHint>Séparez les technologies par des virgules.</FieldHint>
      </Field>
      <Field label="Lien du projet">
        <input className={`${FIELD_CLS} ${errors.project_url ? "border-rose-300" : ""}`} value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://..." />
        <FieldError>{errors.project_url}</FieldError>
      </Field>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : certification ---------- */
function ModalCertification({ item, onSuccess, onClose, flash }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    issuing_organization: item?.issuing_organization || "",
    issue_date: item?.issue_date?.slice(0, 10) || "",
    expiration_date: item?.expiration_date?.slice(0, 10) || "",
    credential_url: item?.credential_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nom requis";
    if (!form.issuing_organization.trim()) e.issuing_organization = "Organisme requis";
    if (form.issue_date && form.expiration_date && form.expiration_date < form.issue_date) {
      e.expiration_date = "L'expiration doit être postérieure à l'obtention";
    }
    if (form.credential_url && !isValidUrl(form.credential_url)) e.credential_url = "URL invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (item) await api.put(`/certifications/${item.id}`, form);
      else await api.post("/certifications", form);
      onSuccess();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom *">
        <input className={`${FIELD_CLS} ${errors.name ? "border-rose-300" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FieldError>{errors.name}</FieldError>
      </Field>
      <Field label="Organisme *">
        <input className={`${FIELD_CLS} ${errors.issuing_organization ? "border-rose-300" : ""}`} value={form.issuing_organization} onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })} />
        <FieldError>{errors.issuing_organization}</FieldError>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date d'obtention">
          <input type="date" className={FIELD_CLS} value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
        </Field>
        <Field label="Expiration">
          <input type="date" className={`${FIELD_CLS} ${errors.expiration_date ? "border-rose-300" : ""}`} value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
          <FieldError>{errors.expiration_date}</FieldError>
        </Field>
      </div>
      <Field label="Lien">
        <input className={`${FIELD_CLS} ${errors.credential_url ? "border-rose-300" : ""}`} value={form.credential_url} onChange={(e) => setForm({ ...form, credential_url: e.target.value })} placeholder="https://..." />
        <FieldError>{errors.credential_url}</FieldError>
      </Field>
      <ModalFooter saving={saving} onClose={onClose} />
    </form>
  );
}

/* ---------- Modal : langue ---------- */
function ModalLanguage({ item, onSuccess, onClose, flash }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    level: item?.level || "conversational",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Langue requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (item) await api.put(`/languages/${item.id}`, form);
      else await api.post("/languages", form);
      onSuccess();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Langue *">
        <input className={`${FIELD_CLS} ${errors.name ? "border-rose-300" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FieldError>{errors.name}</FieldError>
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
function ModalAvailability({ item, onSuccess, onClose, flash }) {
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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.start_at) e.start_at = "Date de début requise";
    if (!form.end_at) e.end_at = "Date de fin requise";
    if (form.start_at && form.end_at && form.end_at < form.start_at) {
      e.end_at = "La date de fin doit être postérieure au début";
    }
    if (form.workload_value !== "" && (form.workload_value < 0 || form.workload_value > 100)) {
      e.workload_value = "Doit être entre 0 et 100";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        workload_value: form.workload_value === "" ? null : Number(form.workload_value),
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      };

      if (item) await api.patch(`/availability/${item.id}`, payload);
      else await api.post("/availability", payload);

      onSuccess();
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
            { v: "available", label: "Disponible", dot: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-400" },
            { v: "partially_available", label: "Partiel", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-400" },
            { v: "unavailable", label: "Indisponible", dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-400" },
            { v: "on_mission", label: "En mission", dot: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-400" },
          ].map((s) => {
            const active = form.status === s.v;
            return (
              <button
                key={s.v}
                type="button"
                onClick={() => setForm({ ...form, status: s.v })}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  active ? `${s.border} ${s.bg} ${s.text}` : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <Label>Période</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[11px] text-slate-500">Début *</span>
            <input type="date" className={`${FIELD_CLS} ${errors.start_at ? "border-rose-300" : ""}`} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            <FieldError>{errors.start_at}</FieldError>
          </div>
          <div>
            <span className="mb-1 block text-[11px] text-slate-500">Fin *</span>
            <input type="date" className={`${FIELD_CLS} ${errors.end_at ? "border-rose-300" : ""}`} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
            <FieldError>{errors.end_at}</FieldError>
          </div>
        </div>
        {days !== null && days > 0 && (
          <p className="mt-3 inline-block rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-teal-600">
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
          <div>
            <input type="number" min="0" max="100" className={`${FIELD_CLS} ${errors.workload_value ? "border-rose-300" : ""}`} value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: e.target.value })} placeholder="Ex: 50" />
            <FieldError>{errors.workload_value}</FieldError>
          </div>
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

      <section className="rounded-lg border border-dashed border-slate-200 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-teal-600" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
          <div>
            <p className="text-sm font-medium text-slate-800">Disponibilité récurrente</p>
            <p className="text-xs text-slate-500">Ex: tous les lundis, une semaine sur deux...</p>
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
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
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
  return <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{children}</span>;
}

/* ---------- Logos des liens ---------- */
function PlatformIcon({ platform }) {
  const cls =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white";

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
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-800">
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
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-600">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    </span>
  );
}