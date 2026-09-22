// frontend/src/pages/TalentProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin, ShieldCheck, MessageSquare, Lock, Briefcase, GraduationCap,
  Award, Languages, ExternalLink, Calendar, Phone, Mail, ArrowLeft,
  Loader2, Globe, Clock, Wrench, Sparkles, Share2, Check, Pencil,
  Star, FolderOpen,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PublicNavbar from "../components/layout/PublicNavbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const LEVEL_LABEL = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", expert: "Expert",
};
const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
const LANG_LEVEL = {
  basic: "Notions", conversational: "Intermédiaire",
  fluent: "Courant", native: "Langue maternelle",
};

const STATUS_CFG = {
  available: { emoji: "🟢", label: "Disponible", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  partially_available: { emoji: "🟡", label: "Partiel", badge: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  on_mission: { emoji: "🔵", label: "En mission", badge: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  unavailable: { emoji: "🔴", label: "Non disponible", badge: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
};
const TYPE_LABEL = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  internship: "Stage", mission: "Mission",
};
const LOC_LABEL = { onsite: "🏢 Sur site", remote: "🏠 Télétravail", hybrid: "🔄 Hybride" };
const UNIT_LABEL = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };

const TABS = [
  { id: "all", label: "Tout", sections: ["about", "skills", "availability", "experiences", "educations", "certifications", "projects"] },
  { id: "about", label: "À propos", sections: ["about"] },
  { id: "skills", label: "Compétences", sections: ["skills"] },
  { id: "journey", label: "Parcours", sections: ["experiences", "educations", "certifications"] },
  { id: "projects", label: "Projets", sections: ["projects"] },
  { id: "availability", label: "Disponibilités", sections: ["availability"] },
];

const Card = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
        <Icon size={18} />
      </span>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const Chip = ({ children, tone = "default" }) => (
  <span
    className={`rounded-full border px-3 py-1 text-xs font-medium ${
      tone === "violet"
        ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
        : "border-white/10 bg-white/5 text-slate-300"
    }`}
  >
    {children}
  </span>
);

const IntroRow = ({ icon: Icon, children, green }) => (
  <li className="flex items-start gap-3 text-sm">
    <Icon size={17} className={`mt-0.5 shrink-0 ${green ? "text-emerald-400" : "text-slate-500"}`} />
    <span className={`min-w-0 break-words ${green ? "text-emerald-300" : "text-slate-300"}`}>{children}</span>
  </li>
);

const SideTitle = ({ icon: Icon, children }) => (
  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
    <Icon size={14} /> {children}
  </p>
);

function Glow({ fixed }) {
  return (
    <div
      className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden ${
        fixed ? "" : "rounded-3xl"
      }`}
    >
      <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute -right-32 top-1/2 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
    </div>
  );
}

function ProfileFrame({ user, children }) {
  if (user) {
    return (
      <AppShell>
        <div className="relative mx-auto max-w-5xl rounded-3xl bg-[#0A1229] font-sans text-white">
          <Glow />
          <div className="relative z-10">{children}</div>
        </div>
      </AppShell>
    );
  }
  return (
    <div className="relative min-h-screen bg-[#0A1229] font-sans text-white">
      <Glow fixed />
      <PublicNavbar variant="dark" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-[88px] pb-10">
        {children}
      </div>
    </div>
  );
}

export default function TalentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [copied, setCopied] = useState(false);

  const isOwner = Boolean(user && profile && profile.user_id === user.id);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTab("all");
    api.get(`/professional-profiles/${id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setError("private");
        else if (err.response?.status === 404) setError("not_found");
        else setError("error");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startConversation = async () => {
    if (!user) { navigate("/login"); return; }
    const body = prompt("Votre message :");
    if (!body) return;
    try {
      await api.post("/conversations", { participant_ids: [profile.user_id], body });
      alert("Message envoyé — retrouvez la conversation dans Messagerie.");
      navigate("/messages");
    } catch {
      alert("Erreur");
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.user?.name || "Profil TalentShare", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (err.name !== "AbortError") alert("Impossible de partager : " + url);
    }
  };

  if (loading) {
    return (
      <ProfileFrame user={user}>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
        </div>
      </ProfileFrame>
    );
  }

  if (error === "private" || error === "not_found") {
    return (
      <ProfileFrame user={user}>
        <div className="mx-auto max-w-2xl py-20 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Lock size={28} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold">
            {error === "private" ? "Profil privé" : "Profil introuvable"}
          </h1>
          <p className="mt-2 text-slate-400">
            {error === "private"
              ? "Cet utilisateur a choisi de garder son profil privé. Vous pourrez le voir une fois une relation établie (mission, conversation)."
              : "Ce profil n'existe pas ou a été supprimé."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </ProfileFrame>
    );
  }

  if (error || !profile) {
    return (
      <ProfileFrame user={user}>
        <p className="py-20 text-center text-slate-400">Erreur de chargement</p>
      </ProfileFrame>
    );
  }

  const groupedSkills = Object.values(
    (profile.skills || []).reduce((acc, s) => {
      const cat = s.category?.parent?.name || s.category?.name || "Autres";
      const icon = s.category?.parent?.icon || s.category?.icon || "🏷️";
      if (!acc[cat]) acc[cat] = { name: cat, icon, items: [] };
      acc[cat].items.push(s);
      return acc;
    }, {})
  );

  const nextAvail = (profile.availability_windows || [])
    .filter((a) => a.status === "available" && new Date(a.end_at) >= new Date())
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0];

  const canSeeFull = isOwner
    || profile.visibility === "public"
    || (profile.visibility === "network" && user);

  const projects = profile.portfolio?.projects || [];
  const location = profile.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : null;
  const nextAvailLabel = nextAvail
    ? new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
    : null;
  const initials = profile.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const isStudent = profile.profile_type === "student";
  const hasLinks =
    profile.portfolio_url || profile.linkedin_url || profile.github_url || profile.behance_url;
  const showContact = profile.can_view_contact && (profile.user?.phone || profile.user?.email);

  const sections = {
    about: profile.bio ? (
      <Card key="about" icon={Sparkles} title="À propos">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{profile.bio}</p>
      </Card>
    ) : null,

    skills: groupedSkills.length > 0 ? (
      <Card key="skills" icon={Wrench} title="Compétences">
        <div className="space-y-5">
          {groupedSkills.map((group) => (
            <div key={group.name}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {group.icon} {group.name}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/5 bg-white/5 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      {s.pivot?.is_featured && <Star size={14} className="fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                      {s.pivot?.years_experience
                        ? ` · ${s.pivot.years_experience} an${s.pivot.years_experience > 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-emerald-400"
                        style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    ) : null,

    availability: profile.availability_windows?.length > 0 ? (
      <Card key="availability" icon={Clock} title="Disponibilités">
        <div className="space-y-3">
          {profile.availability_windows.map((a) => {
            const st = STATUS_CFG[a.status] || {
              emoji: "⚪", label: a.status, badge: "border-white/10 bg-white/5 text-slate-300",
            };
            const typeLabel = TYPE_LABEL[a.type] || a.type;
            const locLabel = LOC_LABEL[a.location_type] || "";
            const unit = UNIT_LABEL[a.workload_unit] || "";

            const today = new Date();
            const isActive = new Date(a.start_at) <= today && new Date(a.end_at) >= today;
            const daysLeft = Math.ceil((new Date(a.end_at) - today) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft > 0 && daysLeft <= 15;

            return (
              <div key={a.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Calendar size={14} className="text-slate-500" />
                    {new Date(a.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    <span className="text-slate-500">→</span>
                    {new Date(a.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                        ⚠️ Expire dans {daysLeft}j
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.badge}`}>
                      {st.emoji} {st.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {typeLabel && <Chip>{typeLabel}</Chip>}
                  {a.workload_value > 0 && <Chip>🕐 {a.workload_value}{unit}</Chip>}
                  {locLabel && (
                    <Chip>
                      {locLabel}
                      {a.location_city && ` · ${a.location_city}`}
                    </Chip>
                  )}
                  {a.is_recurring && <Chip tone="violet">🔁 Récurrent ({a.recurrence_pattern})</Chip>}
                </div>

                {a.notes && <p className="mt-3 text-xs italic text-slate-400">"{a.notes}"</p>}

                {isActive && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Période en cours
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    ) : null,

    experiences: canSeeFull && profile.experiences?.length > 0 ? (
      <Card key="experiences" icon={Briefcase} title="Expériences">
        <div className="space-y-5">
          {profile.experiences.map((exp) => (
            <div key={exp.id} className="border-l-2 border-emerald-400/50 pl-4">
              <p className="font-semibold text-white">{exp.title}</p>
              <p className="text-sm text-slate-300">{exp.company}</p>
              <p className="mt-1 text-xs text-slate-500">
                {exp.start_date?.slice(0, 7)} → {exp.is_current ? "Aujourd'hui" : exp.end_date?.slice(0, 7)}
              </p>
              {exp.description && <p className="mt-2 text-sm text-slate-400">{exp.description}</p>}
            </div>
          ))}
        </div>
      </Card>
    ) : null,

    educations: canSeeFull && profile.educations?.length > 0 ? (
      <Card key="educations" icon={GraduationCap} title="Formations">
        <div className="space-y-5">
          {profile.educations.map((edu) => (
            <div key={edu.id} className="border-l-2 border-blue-400/50 pl-4">
              <p className="font-semibold text-white">{edu.degree}</p>
              <p className="text-sm text-slate-300">{edu.institution}</p>
              {edu.field_of_study && <p className="text-xs text-slate-400">{edu.field_of_study}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {edu.start_date?.slice(0, 7)} → {edu.is_current ? "Aujourd'hui" : edu.end_date?.slice(0, 7)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    ) : null,

    certifications: canSeeFull && profile.certifications?.length > 0 ? (
      <Card key="certifications" icon={Award} title="Certifications">
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.certifications.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/5 bg-white/5 p-3.5">
              <p className="font-semibold text-white">{c.name}</p>
              <p className="text-sm text-slate-400">{c.issuing_organization}</p>
              {c.credential_url && (
                <a
                  href={c.credential_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Vérifier <ExternalLink size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    ) : null,

    projects: canSeeFull && projects.length > 0 ? (
      <Card key="projects" icon={FolderOpen} title="Projets & réalisations">
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
              <p className="font-semibold text-white">{p.title}</p>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description}</p>}
              {p.technologies?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.technologies.map((t, i) => (
                    <Chip key={i}>{t}</Chip>
                  ))}
                </div>
              )}
              {p.project_url && (
                <a
                  href={p.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Voir <ExternalLink size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    ) : null,
  };

  const activeTab = TABS.find((t) => t.id === tab);
  const feed = activeTab.sections.map((k) => sections[k]).filter(Boolean);

  return (
    <ProfileFrame user={user}>
      {/* ===== CARTE PROFIL SANS BANNIÈRE (style Facebook) ===== */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">

        {/* BOUTON RETOUR en haut */}
        <div className="px-5 pt-5 sm:px-8 sm:pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={15} /> Retour
          </button>
        </div>

        {/* Zone infos : avatar + infos côte à côte (PAS de bannière) */}
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar circulaire GRAND */}
            <div className="shrink-0">
              {profile.avatar_path ? (
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white/10 ring-2 ring-emerald-400/40 sm:h-40 sm:w-40">
                  <img
                    src={`http://localhost:8000/storage/${profile.avatar_path}`}
                    alt={profile.user.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/10 bg-gradient-to-br from-emerald-400 to-emerald-600 text-5xl font-bold text-white ring-2 ring-emerald-400/40 sm:h-40 sm:w-40 sm:text-6xl">
                  {initials}
                </div>
              )}
            </div>

            {/* Infos à droite de l'avatar */}
            <div className="min-w-0 flex-1 sm:pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words text-2xl font-bold leading-tight text-white sm:text-4xl">
                  {profile.user.name}
                </h1>
                {profile.is_verified && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <ShieldCheck size={12} /> Vérifié
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200">
                  {isStudent ? <GraduationCap size={12} /> : <Briefcase size={12} />}
                  {isStudent ? "Jeune talent" : "Talent"}
                </span>
              </div>

              {profile.headline && (
                <p className="mt-2 text-base font-semibold text-emerald-400">{profile.headline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {location}
                  </span>
                )}
                {nextAvailLabel && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Calendar size={14} /> Disponible dès {nextAvailLabel}
                  </span>
                )}
                <span>
                  {profile.skills?.length || 0} compétences
                  {canSeeFull && ` · ${profile.experiences?.length || 0} exp · ${projects.length} projets`}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {isOwner ? (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
                  >
                    <Pencil size={15} /> Modifier mon profil
                  </Link>
                ) : (
                  <button
                    onClick={startConversation}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
                  >
                    <MessageSquare size={16} /> Proposer une connexion
                  </button>
                )}
                <button
                  onClick={share}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  {copied ? <Check size={15} /> : <Share2 size={15} />}
                  {copied ? "Lien copié !" : "Partager"}
                </button>
              </div>

              {!user && (
                <p className="mt-3 text-xs text-slate-500">
                  <Link to="/login" className="text-slate-400 hover:text-emerald-300">
                    Connectez-vous
                  </Link>{" "}
                  pour contacter ce profil.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-5 sm:px-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative whitespace-nowrap px-3.5 py-3.5 text-sm font-semibold transition ${
                tab === t.id ? "text-emerald-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {!canSeeFull && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <Lock size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Profil en accès réseau limité</p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Connectez-vous ou établissez une relation (mission, conversation) pour voir toutes les informations.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 self-start lg:sticky lg:top-24">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">Intro</h2>
            <ul className="mt-4 space-y-3">
              {profile.headline && <IntroRow icon={Briefcase}>{profile.headline}</IntroRow>}
              {location && <IntroRow icon={MapPin}>{location}</IntroRow>}
              {nextAvailLabel && (
                <IntroRow icon={Calendar} green>
                  Disponible dès {nextAvailLabel}
                </IntroRow>
              )}
              {showContact && profile.user.phone && <IntroRow icon={Phone}>{profile.user.phone}</IntroRow>}
              {showContact && profile.user.email && <IntroRow icon={Mail}>{profile.user.email}</IntroRow>}
            </ul>

            {canSeeFull && profile.languages?.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <SideTitle icon={Languages}>Langues</SideTitle>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((l) => (
                    <Chip key={l.id}>
                      {l.name} <span className="text-slate-500">· {LANG_LEVEL[l.level] || l.level}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {canSeeFull && hasLinks && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <SideTitle icon={Globe}>Liens externes</SideTitle>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Portfolio", profile.portfolio_url],
                    ["LinkedIn", profile.linkedin_url],
                    ["GitHub", profile.github_url],
                    ["Behance", profile.behance_url],
                  ]
                    .filter(([, url]) => !!url)
                    .map(([name, url]) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300"
                      >
                        {name} <ExternalLink size={11} />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </section>
        </aside>

        <div className="min-w-0 space-y-4">
          {feed.length > 0 ? (
            feed
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-sm text-slate-400">
              Rien à afficher pour le moment.
            </div>
          )}
        </div>
      </div>
    </ProfileFrame>
  );
}