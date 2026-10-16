import React from 'react';
import AppShell from '../components/layout/AppShell';
import { FileText, ArrowLeft, ShieldCheck, UserCheck, Eye, Scale, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    number: '01',
    title: 'Présentation de la plateforme',
    icon: FileText,
    content:
      'TalentShare est une plateforme de mise en relation entre entreprises, talents, étudiants et universités. Elle facilite les échanges, le partage d’opportunités et la collaboration entre les membres.',
  },
  {
    number: '02',
    title: 'Inscription et compte utilisateur',
    icon: UserCheck,
    content:
      'L’inscription est gratuite. Chaque utilisateur s’engage à fournir des informations exactes, à maintenir son profil à jour et à utiliser la plateforme de manière responsable.',
  },
  {
    number: '03',
    title: 'Données personnelles',
    icon: ShieldCheck,
    content:
      'Les données personnelles des utilisateurs sont traitées conformément à la législation applicable. Les utilisateurs sont invités à ne communiquer que les informations nécessaires à leur utilisation de la plateforme.',
  },
  {
    number: '04',
    title: 'Confidentialité et visibilité',
    icon: Eye,
    content:
      'Selon les fonctionnalités disponibles et les paramètres choisis, les profils peuvent être publics, privés ou visibles uniquement par le réseau de l’utilisateur. Il appartient à chacun de vérifier ses paramètres de confidentialité.',
  },
  {
    number: '05',
    title: 'Responsabilités',
    icon: Scale,
    content:
      'TalentShare facilite la mise en relation entre utilisateurs, mais n’est pas responsable des transactions, accords ou engagements conclus directement entre eux. Chaque utilisateur reste responsable de ses échanges et de ses décisions.',
  },
  {
    number: '06',
    title: 'Modification des conditions',
    icon: RefreshCw,
    content:
      'Les présentes conditions peuvent être modifiées afin de refléter les évolutions de la plateforme ou les obligations applicables. Les utilisateurs sont invités à consulter régulièrement cette page.',
  },
];

export default function Cgu() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl pb-12">
        <Link
          to="/help"
          className="group mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-1"
          />
          Retour à l’aide
        </Link>

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#0B1F33] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
              <FileText size={28} />
            </div>

            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-200">
              <CheckCircle2 size={14} />
              INFORMATIONS LÉGALES
            </span>

            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Conditions générales d’utilisation
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Les règles essentielles pour utiliser TalentShare et profiter de
              la plateforme dans un cadre respectueux et responsable.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                TalentShare
              </span>
              <span>Veuillez lire attentivement les conditions ci-dessous.</span>
            </div>
          </div>
        </section>

        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Un cadre d’utilisation commun
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                En utilisant TalentShare, vous êtes invité à respecter les
                présentes conditions, les autres membres et les règles de
                confidentialité de la plateforme.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.number}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tracking-widest text-emerald-600">
                        {section.number}
                      </span>
                      <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                        {section.title}
                      </h2>
                    </div>

                    <p className="text-sm leading-7 text-slate-600">
                      {section.content}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F33] text-emerald-300">
              <Mail size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900">
                Une question concernant ces conditions ?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pour toute question relative à l’utilisation de TalentShare,
                vous pouvez contacter notre équipe d’assistance.
              </p>
              <a
                href="mailto:support@talentshare.mg"
                className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
              >
                <Mail size={16} />
                support@talentshare.mg
              </a>
            </div>
          </div>
        </section>

        <p className="mt-6 px-2 text-center text-xs leading-6 text-slate-400">
          Ce document présente les conditions d’utilisation de la plateforme.
          Il ne remplace pas une vérification juridique adaptée à la législation
          applicable.
        </p>
      </div>
    </AppShell>
  );
}