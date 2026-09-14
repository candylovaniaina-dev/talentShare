import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin, ShieldCheck, MessageSquare, Lock, Briefcase, GraduationCap,
  Award, Languages, ExternalLink, Calendar, Phone, Mail, FileText,
  Eye, UserPlus, ArrowLeft, Loader2, Globe, Clock, Wrench, Sparkles,
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

export default function TalentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Layout adaptatif
  const Layout = user ? AppShell : PublicOnlyLayout;
  const isOwner = user && profile && profile.user_id === user.id;

  useEffect(() => {
    setLoading(true);
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

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={40} />
        </div>
      </Layout>
    );
  }

  // ============================================
  // ERREUR (profil privé / introuvable)
  // ============================================
  if (error === "private" || error === "not_found") {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Lock size={28} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold">
            {error === "private" ? "Profil privé" : "Profil introuvable"}
          </h1>
          <p className="mt-2 text-slate-500">
            {error === "private"
              ? "Cet utilisateur a choisi de garder son profil privé. Vous pourrez le voir une fois une relation établie (mission, conversation)."
              : "Ce profil n'existe pas ou a été supprimé."}
          </p>
          <button
  onClick={() => navigate(-1)}
  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy mb-6"
>
  <ArrowLeft size={15} /> Retour
</button>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <p className="py-20 text-center text-slate-400">Erreur de chargement</p>
      </Layout>
    );
  }

  // ============================================
  // GROUPES DE COMPÉTENCES
  // ============================================
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <Layout>
      {!user && (
        <div className="mx-auto max-w-4xl px-6 pt-6">
          <PublicNavbar variant="light" />
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-10">
       <Link to="/explore" className="mt-6 inline-block rounded-full">
  ← Retour à l'exploration
</Link>

        {/* ============ HEADER ============ */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-start gap-5 flex-wrap">
            {profile.avatar_path ? (
              <img
                src={`http://localhost:8000/storage/${profile.avatar_path}`}
                alt={profile.user.name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-white/20"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-mint/20 text-3xl font-bold text-mint">
                {profile.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.user.name}</h1>
                {profile.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint">
                    <ShieldCheck size={12} /> Vérifié
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {profile.profile_type === "student" ? "🎓 Jeune talent" : "💼 Talent"}
                </span>
              </div>

              <p className="mt-1 text-mint font-medium">{profile.headline}</p>

              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {profile.city}{profile.country ? `, ${profile.country}` : ""}
                  </span>
                )}
                {nextAvail && (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Calendar size={13} />
                    Disponible dès{" "}
                    {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-navy hover:bg-mint/80"
              >
                ✏️ Modifier mon profil
              </Link>
            ) : (
              <>
                <button
                  onClick={startConversation}
                  className="flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-navy hover:bg-mint/80"
                >
                  <MessageSquare size={16} /> Proposer une connexion
                </button>
                {!user && (
                  <p className="text-xs text-slate-400 self-center">
                    Connectez-vous pour contacter ce profil.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ============ BANDEAU "PROFIL LIMITÉ" SI NETWORK ============ */}
        {!canSeeFull && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-800">
            <Lock size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Profil en accès réseau limité</p>
              <p className="text-xs mt-0.5">
                Connectez-vous ou établissez une relation (mission, conversation) pour voir toutes les informations.
              </p>
            </div>
          </div>
        )}

        {/* ============ BIO ============ */}
        {profile.bio && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-navy" /> À propos
            </h2>
            <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* ============ COMPÉTENCES ============ */}
        {groupedSkills.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Wrench size={18} className="text-navy" /> Compétences
            </h2>
            <div className="mt-4 space-y-5">
              {groupedSkills.map((group) => (
                <div key={group.name}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                    {group.icon} {group.name}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((s) => (
                      <div key={s.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{s.name}</p>
                          {s.pivot?.is_featured && <span className="text-amber-500">★</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {LEVEL_LABEL[s.pivot?.level] || "Intermédiaire"}
                          {s.pivot?.years_experience
                            ? ` · ${s.pivot.years_experience} an${s.pivot.years_experience > 1 ? "s" : ""}`
                            : ""}
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-navy"
                            style={{ width: `${LEVEL_PCT[s.pivot?.level] || 50}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ EXPÉRIENCES ============ */}
        {canSeeFull && profile.experiences?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Briefcase size={18} className="text-navy" /> Expériences
            </h2>
            <div className="mt-4 space-y-4">
              {profile.experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-mint pl-4">
                  <p className="font-semibold">{exp.title}</p>
                  <p className="text-sm text-slate-500">{exp.company}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {exp.start_date?.slice(0, 7)} → {exp.is_current ? "Aujourd'hui" : exp.end_date?.slice(0, 7)}
                  </p>
                  {exp.description && <p className="mt-2 text-sm text-slate-600">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ FORMATIONS ============ */}
        {canSeeFull && profile.educations?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <GraduationCap size={18} className="text-navy" /> Formations
            </h2>
            <div className="mt-4 space-y-4">
              {profile.educations.map((edu) => (
                <div key={edu.id} className="border-l-2 border-blue-300 pl-4">
                  <p className="font-semibold">{edu.degree}</p>
                  <p className="text-sm text-slate-500">{edu.institution}</p>
                  {edu.field_of_study && <p className="text-xs text-slate-400">{edu.field_of_study}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {edu.start_date?.slice(0, 7)} → {edu.is_current ? "Aujourd'hui" : edu.end_date?.slice(0, 7)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ CERTIFICATIONS ============ */}
        {canSeeFull && profile.certifications?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Award size={18} className="text-navy" /> Certifications
            </h2>
            <div className="mt-4 space-y-3">
              {profile.certifications.map((c) => (
                <div key={c.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.issuing_organization}</p>
                  {c.credential_url && (
                    <a href={c.credential_url} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-navy hover:underline inline-flex items-center gap-1 mt-1">
                      Vérifier <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ LANGUES ============ */}
        {canSeeFull && profile.languages?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Languages size={18} className="text-navy" /> Langues
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.languages.map((l) => (
                <span key={l.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm">
                  {l.name} <span className="text-slate-400">· {LANG_LEVEL[l.level] || l.level}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ============ PORTFOLIO ============ */}
        {canSeeFull && profile.portfolio?.projects?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Briefcase size={18} className="text-navy" /> Projets & réalisations
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {profile.portfolio.projects.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold">{p.title}</p>
                  {p.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.technologies.map((t, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                  {p.project_url && (
                    <a href={p.project_url} target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
                      Voir <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ DISPONIBILITÉS ============ */}
        {canSeeFull && profile.availability_windows?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Clock size={18} className="text-navy" /> Disponibilités
            </h2>
            <div className="mt-4 space-y-3">
              {profile.availability_windows.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <span>
                    {new Date(a.start_at).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(a.end_at).toLocaleDateString("fr-FR")}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {a.status === "available" ? "🟢 Disponible" : a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ CONTACT ============ */}
        {profile.can_view_contact && (profile.user?.phone || profile.user?.email) && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Phone size={18} className="text-navy" /> Contact
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {profile.user.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {profile.user.phone}
                </p>
              )}
              {profile.user.email && (
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> {profile.user.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============ LIENS EXTERNES ============ */}
        {canSeeFull && (profile.portfolio_url || profile.linkedin_url || profile.github_url || profile.behance_url) && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Globe size={18} className="text-navy" /> Liens externes
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
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
    </Layout>
  );
}

function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-navy">{children}</div>;
}