import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  GraduationCap,
  Handshake,
  Check,
  Globe2,
  Network,
  Target,
  TrendingUp,
  BriefcaseBusiness,
  ArrowRight,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import PublicNavbar from "../components/layout/PublicNavbar";
import trust1 from "../assets/images/trust1.jpg";
import trust2 from "../assets/images/trust2.avif";

/* ------------------------------------------------------------------ */
/*  Jetons de style                                                   */
/* ------------------------------------------------------------------ */
const CONTAINER = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

const SECTION_LIGHT = "bg-[color:var(--ts-bg)]";
const SECTION_TINT = "bg-[color:var(--ts-tint)]";

const SURFACE = "border border-[color:var(--ts-border)] bg-[color:var(--ts-surface)]";

const INK = "text-[color:var(--ts-ink)]";
const MUTED = "text-[color:var(--ts-muted)]";
const ACCENT = "text-[color:var(--ts-accent)]";

const MINT_GRADIENT = "bg-gradient-to-br from-[#8DF0DC] to-[#5EDCC4]";

const BTN_PRIMARY =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full ${MINT_GRADIENT} px-6 text-sm font-bold text-[#0A1230] ` +
  "shadow-[0_12px_32px_-10px_rgba(94,220,196,0.65)] transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7BE9D3]/40";

const BTN_GHOST =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[color:var(--ts-border-strong)] bg-[color:var(--ts-glass)] px-6 text-sm font-semibold text-[color:var(--ts-ink)] backdrop-blur transition " +
  "hover:border-[color:var(--ts-accent)] hover:bg-[color:var(--ts-glass-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7BE9D3]/30";

/* ------------------------------------------------------------------ */
/*  Contenu                                                           */
/* ------------------------------------------------------------------ */
const forWho = [
  {
    icon: Building2,
    tag: "Pour les entreprises",
    title: "Mobilisez les bonnes compétences.",
    body: "Identifiez des talents disponibles, publiez vos besoins et construisez des collaborations adaptées à votre activité.",
    cta: "Explorer les talents",
    href: "/explore",
    tone: "deep",
  },
  {
    icon: Users,
    tag: "Pour les professionnels",
    title: "Faites circuler votre expertise.",
    body: "Valorisez votre savoir-faire, maîtrisez vos disponibilités et accédez à des missions qui correspondent à votre profil.",
    cta: "Créer mon profil",
    href: "/register?role=employee",
    tone: "mint",
  },
  {
    icon: GraduationCap,
    tag: "Pour les jeunes talents",
    title: "Donnez une dimension concrète à votre potentiel.",
    body: "Présentez vos projets, vos compétences et votre parcours pour accéder à des stages, missions et premières opportunités.",
    cta: "Démarrer mon parcours",
    href: "/register?role=student",
    tone: "plain",
  },
];

const howItWorks = [
  {
    title: "Un profil qui vous ressemble",
    body: "Compétences, expériences, projets et disponibilités réunis dans un espace professionnel structuré.",
  },
  {
    title: "Une recherche plus pertinente",
    body: "Explorez les profils, les opportunités et les organisations selon les besoins réels de votre activité.",
  },
  {
    title: "Des connexions compréhensibles",
    body: "Identifiez les points de correspondance entre compétences, disponibilité et besoin exprimé.",
  },
  {
    title: "Une collaboration suivie",
    body: "Suivez les propositions, les échanges et les missions à travers des étapes clairement identifiées.",
  },
];

const trustPoints = [
  "Profils professionnels structurés",
  "Disponibilités mieux valorisées",
  "Correspondances compréhensibles",
  "Parcours de collaboration suivis",
];

const relations = [
  {
    title: "Entreprise ↔ Entreprise",
    body: "Partager des compétences et renforcer les équipes.",
  },
  {
    title: "Entreprise ↔ Talent",
    body: "Mobiliser une expertise pour une mission concrète.",
  },
  {
    title: "Entreprise ↔ Université",
    body: "Créer des passerelles vers les stages et les projets.",
  },
];

const features = [
  {
    icon: Network,
    title: "Un réseau interconnecté",
    body: "Des relations entre entreprises, talents, établissements et jeunes professionnels.",
  },
  {
    icon: Target,
    title: "Une recherche pertinente",
    body: "Des compétences et des disponibilités qui aident à identifier les bons profils.",
  },
  {
    icon: TrendingUp,
    title: "Des opportunités concrètes",
    body: "Des besoins professionnels qui peuvent évoluer vers des missions et des expériences.",
  },
];

/* ------------------------------------------------------------------ */
/*  Petits composants                                                 */
/* ------------------------------------------------------------------ */
function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ts-accent-border)] bg-[color:var(--ts-accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--ts-accent)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ts-accent)]" />
        {eyebrow}
      </p>
      <h2 className={`mt-5 text-3xl font-extrabold leading-[1.12] tracking-[-0.035em] sm:text-4xl lg:text-[42px] ${INK}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-5 max-w-xl text-[15px] leading-7 sm:text-base ${MUTED}`}>
          {description}
        </p>
      )}
    </div>
  );
}

function NetworkPreview() {
  // ✅ CARTES STYLE "GLASSMORPHISM" (Fond transparent + bordure)
  const badge =
    "absolute z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1A2B4C]/80 p-3.5 shadow-2xl backdrop-blur-md";
  const badgeIcon =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7BE9D3]/10 text-[#7BE9D3]";

  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-[550px] items-center justify-center sm:h-[500px]">
      {/* Halo lumineux central avec pulsation */}
      <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-[#5EDCC4]/25 blur-[80px]" />

      {/* Cercles concentriques */}
      <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-[#7BE9D3]/30 sm:h-[400px] sm:w-[400px]" />
      <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#7BE9D3]/30 sm:h-[280px] sm:w-[280px]" />

      {/* Lignes reliant le centre aux badges */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 550 500" aria-hidden="true">
        <path
          d="M275 250 L120 130 M275 250 L430 180 M275 250 L400 380"
          stroke="currentColor"
          className="text-[#5EDCC4]/40"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle cx="120" cy="130" r="5" className="fill-[#7BE9D3]" />
        <circle cx="430" cy="180" r="5" className="fill-[#F5A25D]" />
        <circle cx="400" cy="380" r="5" className="fill-[#7BE9D3]" />
      </svg>

      {/* Carte centrale */}
      <div
        className={`relative z-10 flex h-[130px] w-[130px] flex-col items-center justify-center gap-2 rounded-[36px] border border-white/30 ${MINT_GRADIENT} text-[#0A1230] shadow-[0_20px_50px_-10px_rgba(94,220,196,0.55)] sm:h-[150px] sm:w-[150px]`}
      >
        <Sparkles size={26} strokeWidth={1.8} />
        <span className="text-center text-[11px] font-extrabold uppercase leading-[1.3] tracking-[0.15em]">
          Share
          <br />
          Connect
          <br />
          Grow
        </span>
      </div>

      {/* Badge 1 */}
      <div className={`${badge} left-0 top-12 animate-float sm:left-4 sm:top-16`}>
        <span className={badgeIcon}>
          <Users size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">Talents actifs</p>
          <p className="text-[11px] text-slate-300">Disponibles maintenant</p>
        </div>
      </div>

      {/* Badge 2 */}
      <div className={`${badge} right-0 top-[35%] animate-float-slow sm:right-4`}>
        <span className={badgeIcon}>
          <Target size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">Match explicable</p>
          <p className="text-[11px] text-slate-300">Compétences + disponibilité</p>
        </div>
      </div>

      {/* Badge 3 */}
      <div className={`${badge} bottom-8 left-8 animate-float-delayed sm:bottom-12 sm:left-16`}>
        <span className={badgeIcon}>
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">Confiance intégrée</p>
          <p className="text-[11px] text-slate-300">Profils vérifiés</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing() {
  return (
    <div
      className={`ts-landing relative min-h-screen overflow-x-clip ${SECTION_LIGHT} ${INK}`}
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ---------- Palette claire ---------- */
        .ts-landing {
          --ts-bg: #FFFFFF;
          --ts-tint: #F3F6FC;
          --ts-surface: #FFFFFF;
          --ts-surface-alt: #F8FAFE;
          --ts-border: #DDE3F1;
          --ts-border-strong: #C9D2E6;
          --ts-ink: #0B1437;
          --ts-muted: #5B6785;
          --ts-accent: #0E9F8E;
          --ts-accent-soft: rgba(20,184,166,.12);
          --ts-accent-border: rgba(14,159,142,.28);
          --ts-badge: rgba(255,255,255,.92);
          --ts-glass: rgba(255,255,255,.65);
          --ts-glass-hover: #FFFFFF;
        }
        /* ---------- Palette sombre ---------- */
        .dark .ts-landing {
          --ts-bg: #0A1230;
          --ts-tint: #0C1538;
          --ts-surface: #131E47;
          --ts-surface-alt: #101A40;
          --ts-border: rgba(255,255,255,.10);
          --ts-border-strong: rgba(255,255,255,.16);
          --ts-ink: #FFFFFF;
          --ts-muted: #A6B2D1;
          --ts-accent: #7BE9D3;
          --ts-accent-soft: rgba(123,233,211,.12);
          --ts-accent-border: rgba(123,233,211,.28);
          --ts-badge: rgba(19,30,71,.92);
          --ts-glass: rgba(255,255,255,.05);
          --ts-glass-hover: rgba(255,255,255,.10);
        }

        .ts-landing ::selection { background: #7BE9D3; color: #0A1230; }

        .ts-landing .ts-grid {
          background-image:
            linear-gradient(rgba(11,20,55,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,20,55,.05) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: linear-gradient(to bottom, #000, transparent 85%);
          mask-image: linear-gradient(to bottom, #000, transparent 85%);
        }
        .dark .ts-landing .ts-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
        }

        .ts-landing .ts-reveal { animation: ts-reveal .75s cubic-bezier(.2,.7,.2,1) both; }
        .ts-landing .ts-delay { animation-delay: 150ms; }

        .ts-landing .animate-float { animation: ts-float 4s ease-in-out infinite; }
        .ts-landing .animate-float-slow { animation: ts-float 5s ease-in-out infinite 1s; }
        .ts-landing .animate-float-delayed { animation: ts-float 4.5s ease-in-out infinite 0.5s; }
        .ts-landing .animate-spin-slow { animation: ts-spin 20s linear infinite; }
        .ts-landing .animate-pulse-glow { animation: ts-pulse 4s ease-in-out infinite; }

        @keyframes ts-reveal { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ts-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ts-spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes ts-pulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ts-landing *, .ts-landing *::before, .ts-landing *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <PublicNavbar />

      {/* ============================ HERO (FIXÉ EN BLEU MARINE) ============================ */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#0A1230] via-[#0C1538] to-[#0E1740]">
        <div className="ts-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />
        <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-[420px] w-[420px] rounded-full bg-[#5EDCC4]/10 blur-[110px]" />

        <div className={`${CONTAINER} grid items-center gap-14 pb-20 pt-32 sm:pt-36 lg:min-h-[720px] lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pb-24`}>
          <div className="ts-reveal max-w-[640px]">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-[#7BE9D3]/30 bg-[#7BE9D3]/10 px-3.5 py-1.5 text-xs font-semibold text-[#7BE9D3] backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5EDCC4] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5EDCC4]" />
              </span>
              Le réseau professionnel nouvelle génération
            </p>

            <h1 className="mt-7 text-[40px] font-extrabold leading-[1.06] tracking-[-0.045em] text-white sm:text-5xl lg:text-[60px]">
              Le talent existe.
              <br />
              <span className="bg-gradient-to-r from-[#7BE9D3] to-[#5EDCC4] bg-clip-text text-transparent">
                Connectons-le aux bonnes opportunités.
              </span>
            </h1>

            <p className="mt-6 max-w-[540px] text-base leading-8 text-[#A6B2D1] sm:text-[17px]">
              La plateforme qui rapproche entreprises, professionnels, étudiants
              et universités pour transformer les compétences en collaborations
              concrètes.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={BTN_PRIMARY}>
                Rejoindre TalentShare
              </Link>
              <Link to="/explore" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-[#7BE9D3]/50 hover:bg-white/10">
                Explorer le réseau
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#A6B2D1]">
              {["Entreprises", "Talents", "Jeunes diplômés", "Universités"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check size={14} className="text-[#7BE9D3]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="ts-reveal ts-delay min-w-0 relative flex items-center justify-center">
            <NetworkPreview />
          </div>
        </div>
      </section>

      {/* ======================== POSITIONNEMENT ======================== */}
      <section className={`${SECTION_LIGHT} py-20 sm:py-24`}>
        <div className={CONTAINER}>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <SectionTitle
              eyebrow="Une nouvelle façon de collaborer"
              title="Les compétences sont plus fortes quand elles se rencontrent."
            />
            <p className={`max-w-xl text-[15px] leading-7 lg:justify-self-end ${MUTED}`}>
              TalentShare facilite la rencontre entre un besoin, une expertise et
              une disponibilité. Un même espace pour rechercher, proposer,
              échanger et suivre les collaborations.
            </p>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-3xl border border-[color:var(--ts-border)] bg-[color:var(--ts-border)] sm:grid-cols-3 sm:gap-px">
            {features.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="bg-[color:var(--ts-surface-alt)] p-7 transition-colors hover:bg-[color:var(--ts-surface)] sm:p-8"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)]">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h3 className={`mt-5 text-base font-bold tracking-tight ${INK}`}>{title}</h3>
                <p className={`mt-2 text-sm leading-6 ${MUTED}`}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PUBLICS ============================ */}
      <section id="pour-qui" className={`${SECTION_TINT} border-y border-[color:var(--ts-border)] py-20 sm:py-24`}>
        <div className={CONTAINER}>
          <SectionTitle
            eyebrow="Un écosystème ouvert"
            title="Une plateforme. Plusieurs façons d'avancer."
            description="Que vous recherchiez une compétence, une mission ou une première expérience, TalentShare vous aide à développer les connexions adaptées à votre parcours."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {forWho.map(({ icon: Icon, tag, title, body, cta, href, tone }) => {
              const deep = tone === "deep";
              const mint = tone === "mint";
              return (
                <article
                  key={tag}
                  className={`relative flex min-h-[340px] flex-col overflow-hidden rounded-[26px] border p-7 transition-transform duration-300 hover:-translate-y-1 ${
                    deep
                      ? "border-white/10 bg-gradient-to-br from-[#0B1437] via-[#101B4B] to-[#16256A] text-white shadow-[0_24px_60px_-24px_rgba(10,18,48,0.8)]"
                      : mint
                        ? "border-[#5EDCC4]/40 bg-[#5EDCC4]/10 text-[color:var(--ts-ink)] dark:border-[#7BE9D3]/20 dark:bg-[#7BE9D3]/[0.07]"
                        : `${SURFACE} ${INK}`
                  }`}
                >
                  {deep && (
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#5EDCC4]/25 blur-3xl" />
                  )}
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                      deep
                        ? `${MINT_GRADIENT} text-[#0A1230]`
                        : "bg-[color:var(--ts-surface)] text-[color:var(--ts-accent)] shadow-sm dark:bg-white/10"
                    }`}
                  >
                    <Icon size={21} strokeWidth={1.9} />
                  </span>

                  <p className={`relative mt-7 text-sm font-semibold ${deep ? "text-[#7BE9D3]" : ACCENT}`}>
                    {tag}
                  </p>
                  <h3 className="relative mt-2 text-[22px] font-extrabold leading-[1.2] tracking-[-0.03em]">
                    {title}
                  </h3>
                  <p className={`relative mt-3 flex-1 text-sm leading-6 ${deep ? "text-[#B7C2E0]" : MUTED}`}>
                    {body}
                  </p>

                  <Link
                    to={href}
                    className={`relative mt-7 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                      deep
                        ? "bg-white/10 text-[#7BE9D3] hover:bg-white/15"
                        : "bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] hover:brightness-110"
                    }`}
                  >
                    {cta}
                    <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================= COMMENT ÇA MARCHE ========================= */}
      <section id="comment-ca-marche" className={`${SECTION_LIGHT} py-20 sm:py-24`}>
        <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20`}>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionTitle
              eyebrow="Un parcours plus clair"
              title="De la première connexion à la collaboration."
              description="Les informations essentielles restent lisibles à chaque étape pour que chacun sache quoi faire et où il en est."
            />

            <Link to="/explore" className={`${BTN_GHOST} mt-7 min-h-11 px-5`}>
              Découvrir l'exploration
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="relative mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1437] to-[#16256A] p-5 text-white sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#5EDCC4]/25 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${MINT_GRADIENT} text-[#0A1230]`}>
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Une approche centrée sur l'humain</p>
                  <p className="mt-2 text-xs leading-5 text-[#B7C2E0]">
                    Les outils facilitent la mise en relation. Les personnes
                    restent au cœur des décisions et des collaborations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ol className="relative space-y-3">
            <span className="pointer-events-none absolute bottom-6 left-[2.15rem] top-6 hidden w-px bg-gradient-to-b from-[#5EDCC4]/60 via-[#5EDCC4]/20 to-transparent sm:block" />
            {howItWorks.map((step, index) => (
              <li
                key={step.title}
                className={`relative flex gap-4 rounded-2xl p-5 sm:gap-5 sm:p-6 ${SURFACE}`}
              >
                <span className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${MINT_GRADIENT} text-sm font-extrabold text-[#0A1230]`}>
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <h3 className={`text-base font-bold tracking-tight ${INK}`}>{step.title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${MUTED}`}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ CONFIANCE ============================ */}
      <section id="confiance" className={`${SECTION_TINT} py-20 sm:py-24`}>
        <div className={CONTAINER}>
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_.85fr]">
            <SectionTitle
              eyebrow="La confiance au quotidien"
              title="Des relations professionnelles fondées sur la clarté."
              description="Un profil structuré, des informations utiles et un parcours compréhensible contribuent à des échanges plus efficaces."
            />

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <li key={point} className={`flex items-start gap-2.5 rounded-xl p-3.5 ${SURFACE}`}>
                  <Check size={16} className={`mt-0.5 shrink-0 ${ACCENT}`} />
                  <span className={`text-xs font-semibold leading-5 ${MUTED}`}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                img: trust1,
                tag: "Des compétences qui se rencontrent",
                title: "La bonne collaboration commence par la bonne connexion.",
              },
              {
                img: trust2,
                tag: "Un avenir à construire ensemble",
                title: "Chaque parcours peut ouvrir de nouvelles perspectives.",
              },
            ].map(({ img, tag, title }) => (
              <div
                key={tag}
                className="group relative flex min-h-[290px] flex-col justify-end overflow-hidden rounded-[26px] bg-[#0B1437] bg-cover bg-center p-6 sm:p-8"
                style={{
                  backgroundImage: `linear-gradient(0deg, rgba(8,14,40,.95) 0%, rgba(8,14,40,.25) 100%), url(${img})`,
                }}
              >
                <div className="absolute inset-0 bg-indigo-900/10 transition duration-500 group-hover:bg-transparent" />
                <div className="relative">
                  <p className="text-xs font-semibold text-[#7BE9D3]">{tag}</p>
                  <h3 className="mt-3 max-w-md text-2xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
                    {title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-5 grid overflow-hidden rounded-2xl md:grid-cols-3 md:divide-x md:divide-[color:var(--ts-border)] ${SURFACE}`}>
            {relations.map((relation) => (
              <div
                key={relation.title}
                className="border-b border-[color:var(--ts-border)] p-5 last:border-b-0 sm:p-6 md:border-b-0"
              >
                <div className={`flex items-center gap-2 ${ACCENT}`}>
                  <Handshake size={17} />
                  <span className="text-xs font-semibold">Connexion</span>
                </div>
                <h3 className={`mt-3 text-sm font-bold ${INK}`}>{relation.title}</h3>
                <p className={`mt-2 text-xs leading-5 ${MUTED}`}>{relation.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className={`${SECTION_LIGHT} px-5 pb-20 pt-4 sm:px-8 sm:pb-24`}>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0B1437] via-[#101B4B] to-[#16256A] px-6 py-14 text-white shadow-[0_30px_80px_-30px_rgba(10,18,48,0.85)] sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-32 h-[380px] w-[380px] rounded-full bg-[#5EDCC4]/20 blur-[90px]" />
          <div className="pointer-events-none absolute -left-20 bottom-[-160px] h-[300px] w-[300px] rounded-full bg-indigo-400/20 blur-[80px]" />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#7BE9D3]">
                Votre prochaine étape commence ici
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-[44px]">
                Les bonnes connexions changent les perspectives.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#B7C2E0] sm:text-base">
                Rejoignez un réseau où les compétences, les besoins et les
                opportunités peuvent enfin se rencontrer.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/register" className={BTN_PRIMARY}>
                Créer mon compte
              </Link>
              <Link
                to="/explore"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-[#7BE9D3]/50 hover:bg-white/10"
              >
                Explorer TalentShare
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================= FOOTER ============================= */}
      <footer className={`border-t border-[color:var(--ts-border)] px-5 py-8 sm:px-8 ${SECTION_LIGHT}`}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${MINT_GRADIENT} text-[#0A1230]`}>
              <Layers size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className={`text-sm font-extrabold tracking-tight ${INK}`}>TalentShare</p>
              <p className={`mt-0.5 text-[11px] ${MUTED}`}>Share. Connect. Grow.</p>
            </div>
          </div>

          <p className={`text-xs leading-5 ${MUTED}`}>
            © {new Date().getFullYear()} TalentShare · Madagascar
          </p>

          <p className={`inline-flex items-center gap-2 text-xs font-medium ${MUTED}`}>
            <Globe2 size={15} className={ACCENT} />
            Les compétences rapprochent les opportunités.
          </p>
        </div>
      </footer>
    </div>
  );
}