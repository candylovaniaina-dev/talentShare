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
    <div className="min-h-screen bg-white font-sans text-navy dark:bg-[#0A1229] dark:text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy pb-0 pt-6 text-white">
        <div className="mx-auto max-w-6xl px-6 pt-28">
          <PublicNavbar variant="dark" />

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-4 py-1.5 text-sm text-mint">
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
            </div>

            <div className="relative hidden h-96 lg:block">
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/20 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15" />

              <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-3xl bg-mint text-center text-xs font-bold uppercase tracking-wide text-navy shadow-xl animate-pulse-glow">
                <Sparkles size={20} className="mb-1" />
                Share<br />Connect<br />Grow
              </div>

              <div className="absolute left-4 top-6 flex items-center gap-3 rounded-2xl bg-navy-light/90 px-4 py-3 shadow-lg animate-float">
                <Users size={18} className="text-mint" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Talents actifs</p>
                  <p className="text-xs text-slate-400">Disponibles maintenant</p>
                </div>
              </div>

              <div className="absolute right-0 top-1/3 flex items-center gap-3 rounded-2xl bg-navy-light/90 px-4 py-3 shadow-lg animate-float-slow">
                <Sparkles size={18} className="text-mint" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Match explicable</p>
                  <p className="text-xs text-slate-400">Compétences + disponibilité</p>
                </div>
              </div>

              <div className="absolute bottom-10 right-0 flex items-center gap-3 rounded-2xl bg-navy-light/90 px-4 py-3 shadow-lg animate-float-delayed">
                <ShieldCheck size={18} className="text-mint" />
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
                  <Check size={14} className="text-mint" /> {p}
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl dark:text-white">
            Une plateforme pensée pour les relations qui comptent.
          </h2>
          <p className="self-end text-slate-500 dark:text-slate-400">
            TalentShare ne se contente pas de mettre en ligne des profils. Elle rend visibles les
            collaborations entre ceux qui ont une compétence, ceux qui cherchent à la mobiliser et
            ceux qui construisent leur avenir.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {forWho.map(({ icon: Icon, tag, title, body, cta, href, dark }) => (
            <div
              key={tag}
              className={`flex flex-col rounded-3xl p-8 ${
                dark
                  ? "bg-navy text-white"
                  : "border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <span className={`mb-6 flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? "bg-white/10 text-mint" : "bg-slate-100 text-navy dark:bg-white/10 dark:text-mint"}`}>
                <Icon size={20} />
              </span>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-mint" : "text-navy/60 dark:text-mint"}`}>{tag}</p>
              <h3 className="mt-2 text-xl font-bold leading-snug dark:text-white">{title}</h3>
              <p className={`mt-3 flex-1 text-sm ${dark ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{body}</p>
              <Link to={href} className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${dark ? "text-mint" : "text-navy dark:text-mint"}`}>
                {cta} <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTOS DE CONFIANCE */}
      <section id="confiance" className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="relative flex h-64 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(11,22,51,0.85), rgba(11,22,51,0.3)), url(${trust1})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Des accords qui comptent</p>
            <p className="mt-2 text-xl font-bold">La confiance commence par une vraie rencontre.</p>
          </div>

          <div
            className="relative flex h-64 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(11,22,51,0.85), rgba(11,22,51,0.3)), url(${trust2})`,
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
      <section id="comment-ca-marche" className="bg-slate-50 py-24 dark:bg-white/5">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50 dark:text-slate-400">Comment ça marche</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl dark:text-white">Du potentiel à la bonne collaboration.</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Chaque parcours est guidé par des informations claires, des statuts compréhensibles
              et des décisions qui restent explicables.
            </p>
            <Link to="/opportunites" className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:border-navy dark:border-white/20 dark:text-white dark:hover:border-mint">
              Voir l'espace d'exploration <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint/20 text-sm font-bold text-navy dark:text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold dark:text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.body}</p>
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
          <ShieldCheck size={14} /> Confiance par design
        </p>

        <div className="mt-4 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl dark:text-white">
              Vos données restent à leur place. Votre potentiel, lui, circule.
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              La visibilité d'un portfolio, d'une disponibilité ou d'une localisation se choisit.
              Les coordonnées personnelles restent protégées, tandis que les organisations peuvent
              travailler à partir de signaux professionnels pertinents.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Profils et organisations vérifiables", "Localisation par zone, jamais par adresse privée", "Matching fondé sur des critères lisibles", "Statuts de parcours toujours visibles"].map((t) => (
                <div key={t} className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-medium dark:bg-white/5 dark:text-white">
                  <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-mint">Share · Connect · Grow</p>
              <Globe2 size={22} className="text-mint" />
            </div>
            <div className="mt-6 divide-y divide-white/10">
              {relations.map((r) => (
                <div key={r.title} className="flex items-start gap-3 py-4">
                  <Handshake size={18} className="mt-0.5 text-amber-300" />
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
      <section className="bg-mint/10 py-20 dark:bg-mint/5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-mint">Prêt à connecter le potentiel ?</p>
            <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl dark:text-white">
              Votre prochaine collaboration commence par une conversation.
            </h2>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = "/register"; }}
            className="flex w-full max-w-md overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <input type="email" required placeholder="votre@email.com" className="flex-1 bg-transparent px-4 text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-500" />
            <button className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light dark:bg-mint dark:text-navy">
              Demander un accès <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} TalentShare — Madagascar.</p>
          <p>Share · Connect · Grow</p>
        </div>
      </footer>
    </div>
  );
}