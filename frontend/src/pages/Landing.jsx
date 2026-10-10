// frontend/src/pages/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Building2, Users, GraduationCap, ShieldCheck, Sparkles, Handshake,
  ArrowRight, Check, ChevronRight, Globe2,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import trust1 from "../assets/images/trust1.jpg";
import trust2 from "../assets/images/trust2.avif";

const forWho = [
  {
    icon: Building2, tag: "Entreprises",
    title: "Activez la bonne compétence au bon moment.",
    body: "Publiez un besoin, trouvez une ressource vérifiée et pilotez la mission avec clarté.",
    cta: "Trouver une compétence", href: "/explore",
  },
  {
    icon: Users, tag: "Talents",
    title: "Votre savoir-faire mérite de circuler.",
    body: "Construisez un profil vivant, protégez vos données et choisissez les projets qui vous ressemblent.",
    cta: "Créer mon portfolio", href: "/register?role=employee", dark: true,
  },
  {
    icon: GraduationCap, tag: "Étudiants & jeunes diplômés",
    title: "Transformez vos projets en premières opportunités.",
    body: "Valorisez vos expériences universitaires et personnelles pour franchir le premier pas professionnel.",
    cta: "Trouver une opportunité", href: "/register?role=student",
  },
];

const howItWorks = [
  { title: "Racontez votre potentiel", body: "Un profil métier, des compétences, une disponibilité et un portfolio qui vous ressemblent." },
  { title: "Explorez les connexions utiles", body: "Un moteur filtrable pour identifier les bons talents, organisations, offres et partenariats." },
  { title: "Un match explicable", body: "Compétences, niveau et disponibilité sont croisés pour un score de correspondance clair et justifié." },
  { title: "La mission démarre", body: "Proposition acceptée, disponibilités vérifiées, la collaboration peut commencer en confiance." },
];

const trustPoints = [
  "Profils et organisations vérifiables",
  "Localisation par zone, jamais par adresse privée",
  "Matching fondé sur des critères lisibles",
  "Statuts de parcours toujours visibles",
];

const relations = [
  { title: "Entreprise ↔ Entreprise", body: "Mise à disposition de compétences" },
  { title: "Entreprise ↔ Université", body: "Stages, projets et partenariats" },
  { title: "Entreprise ↔ Talent", body: "Missions, premiers emplois et évolution" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-900 pb-0 pt-6 text-white">
        <div className="mx-auto max-w-6xl px-6 pt-28">
          <PublicNavbar variant="dark" />

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-4 py-1.5 text-sm text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                La nouvelle économie des compétences
              </span>

              <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Les talents font <span className="text-mint">avancer</span> le monde.
              </h1>

              <p className="mt-6 max-w-md text-lg text-slate-300">
                TalentShare crée des connexions professionnelles utiles entre entreprises, talents,
                étudiants et universités — avec confiance, clarté et impact.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl2 bg-mint px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
                >
                  Rejoindre TalentShare <ArrowRight size={16} strokeWidth={1.75} />
                </Link>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-xl2 border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explorer
                </Link>
              </div>
            </div>

            <div className="relative hidden h-96 lg:block">
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/20 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15" />

              <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-xl2 bg-mint text-center text-xs font-bold uppercase tracking-wide text-navy-900 shadow-xl animate-pulse-glow">
                <Sparkles size={20} strokeWidth={1.5} className="mb-1" />
                Share<br />Connect<br />Grow
              </div>

              <div className="absolute left-4 top-6 flex items-center gap-3 rounded-xl2 bg-navy-800/90 px-4 py-3 shadow-card animate-float">
                <Users size={18} strokeWidth={1.5} className="text-mint" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Talents actifs</p>
                  <p className="text-xs text-slate-400">Disponibles maintenant</p>
                </div>
              </div>

              <div className="absolute right-0 top-1/3 flex items-center gap-3 rounded-xl2 bg-navy-800/90 px-4 py-3 shadow-card animate-float-slow">
                <Sparkles size={18} strokeWidth={1.5} className="text-mint" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Match explicable</p>
                  <p className="text-xs text-slate-400">Compétences + disponibilité</p>
                </div>
              </div>

              <div className="absolute bottom-10 right-0 flex items-center gap-3 rounded-xl2 bg-navy-800/90 px-4 py-3 shadow-card animate-float-delayed">
                <ShieldCheck size={18} strokeWidth={1.5} className="text-mint" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Confiance intégrée</p>
                  <p className="text-xs text-slate-400">Profils vérifiés</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-white/10 py-8">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-300">
              {trustPoints.map((p) => (
                <span key={p} className="flex items-center gap-2">
                  <Check size={14} strokeWidth={2} className="text-mint" /> {p}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[["01", "Profil métier"], ["02", "Types de connexion"], ["03", "Étapes lisibles"], ["04", "Publics réunis"]].map(([n, l]) => (
                <div key={n}>
                  <p className="text-2xl font-extrabold text-mint">{n}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UN RESEAU A PLUSIEURS DIMENSIONS */}
      <section id="pour-qui" className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-mint">Un réseau à plusieurs dimensions</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-[var(--text-app)]">
            Une plateforme pensée pour les relations qui comptent.
          </h2>
          <p className="self-end text-[var(--text-muted)]">
            TalentShare ne se contente pas de mettre en ligne des profils. Elle rend visibles les
            collaborations entre ceux qui ont une compétence, ceux qui cherchent à la mobiliser et
            ceux qui construisent leur avenir.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {forWho.map(({ icon: Icon, tag, title, body, cta, href, dark }) => (
            <div
              key={tag}
              className={`flex flex-col rounded-xl2 p-8 transition-all hover:shadow-cardHover ${
                dark
                  ? "bg-navy-900 text-white"
                  : "border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-card text-[var(--text-app)]"
              }`}
            >
              <span className={`mb-6 flex h-11 w-11 items-center justify-center rounded-xl2 ${dark ? "bg-white/10 text-mint" : "bg-[var(--bg-surface-hover)] text-navy-800"}`}>
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-mint" : "text-mint"}`}>{tag}</p>
              <h3 className="mt-2 text-xl font-bold leading-snug">{title}</h3>
              <p className={`mt-3 flex-1 text-sm ${dark ? "text-slate-300" : "text-[var(--text-muted)]"}`}>{body}</p>
              <Link to={href} className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${dark ? "text-mint" : "text-navy-800 hover:text-mint"}`}>
                {cta} <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTOS DE CONFIANCE */}
      <section id="confiance" className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="relative flex h-64 flex-col justify-end overflow-hidden rounded-xl2 p-6 text-white"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(10,21,38,0.85), rgba(10,21,38,0.3)), url(${trust1})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Des accords qui comptent</p>
            <p className="mt-2 text-xl font-bold">La confiance commence par une vraie rencontre.</p>
          </div>

          <div
            className="relative flex h-64 flex-col justify-end overflow-hidden rounded-xl2 p-6 text-white"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(10,21,38,0.85), rgba(10,21,38,0.3)), url(${trust2})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Des partenariats solides</p>
            <p className="mt-2 text-xl font-bold">La confiance se construit sur le long terme.</p>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="comment-ca-marche" className="bg-[var(--bg-surface-2)] py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">Comment ça marche</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-[var(--text-app)]">Du potentiel à la bonne collaboration.</h2>
            <p className="mt-4 text-[var(--text-muted)]">
              Chaque parcours est guidé par des informations claires, des statuts compréhensibles
              et des décisions qui restent explicables.
            </p>
            <Link to="/opportunites" className="mt-6 inline-flex items-center gap-1.5 rounded-xl2 border border-[var(--border-app)] px-5 py-2.5 text-sm font-semibold text-[var(--text-app)] transition hover:border-mint hover:text-mint">
              Voir l'espace d'exploration <ChevronRight size={16} strokeWidth={1.75} />
            </Link>
          </div>

          <div className="space-y-4">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-sm font-bold text-mint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--text-app)]">{step.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIANCE PAR DESIGN */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-mint">
          <ShieldCheck size={14} strokeWidth={2} /> Confiance par design
        </p>

        <div className="mt-4 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-[var(--text-app)]">
              Vos données restent à leur place. Votre potentiel, lui, circule.
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              La visibilité d'un portfolio, d'une disponibilité ou d'une localisation se choisit.
              Les coordonnées personnelles restent protégées, tandis que les organisations peuvent
              travailler à partir de signaux professionnels pertinents.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Profils et organisations vérifiables", "Localisation par zone, jamais par adresse privée", "Matching fondé sur des critères lisibles", "Statuts de parcours toujours visibles"].map((t) => (
                <div key={t} className="flex items-start gap-2 rounded-xl2 bg-[var(--bg-surface-2)] p-4 text-sm font-medium text-[var(--text-app)]">
                  <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-mint" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl2 bg-navy-900 p-8 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-mint">Share · Connect · Grow</p>
              <Globe2 size={22} strokeWidth={1.5} className="text-mint" />
            </div>
            <div className="mt-6 divide-y divide-white/10">
              {relations.map((r) => (
                <div key={r.title} className="flex items-start gap-3 py-4">
                  <Handshake size={18} strokeWidth={1.5} className="mt-0.5 text-mint" />
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm text-slate-300">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-mint/5 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Prêt à connecter le potentiel ?</p>
            <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl text-[var(--text-app)]">
              Votre prochaine collaboration commence par une conversation.
            </h2>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = "/register"; }}
            className="flex w-full max-w-md overflow-hidden rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-1.5 shadow-card"
          >
            <input type="email" required placeholder="votre@email.com" className="flex-1 bg-transparent px-4 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none" />
            <button className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700">
              Demander un accès <ArrowRight size={15} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-app)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-[var(--text-faint)] sm:flex-row">
          <p>© {new Date().getFullYear()} TalentShare — Madagascar.</p>
          <p>Share · Connect · Grow</p>
        </div>
      </footer>
    </div>
  );
}
