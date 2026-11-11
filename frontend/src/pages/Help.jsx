import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle, Search, BookOpen, MessageCircle, Mail, FileText,
  ChevronDown, ExternalLink, ArrowLeft,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";

const FAQ = [
  {
    q: "Comment compléter mon profil professionnel ?",
    a: "Allez dans Mon profil → cliquez sur Modifier. Ajoutez vos compétences, expériences, formations et un titre professionnel. Un profil complet augmente vos chances de matching de 3x.",
  },
  {
    q: "Comment fonctionne le matching ?",
    a: "Le matching compare vos compétences, votre disponibilité et votre localisation avec les demandes des entreprises. Un score de 0 à 100% est calculé pour chaque opportunité.",
  },
  {
    q: "Puis-je définir ma visibilité ?",
    a: "Oui. Dans Paramètres → Confidentialité, vous contrôlez qui peut voir votre profil, votre email, votre téléphone et vos disponibilités.",
  },
  {
    q: "Comment gérer mes disponibilités ?",
    a: "Dans Mon profil, section Disponibilités, vous pouvez ajouter des périodes précises (dates, charge, type de mission). Les conflits sont détectés automatiquement.",
  },
  {
    q: "Comment accepter une proposition ?",
    a: "Dans Mes propositions, cliquez sur la proposition → bouton Accepter. Une mission sera créée automatiquement.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Dans Paramètres → Zone dangereuse, cliquez sur Supprimer mon compte. Cette action est irréversible et efface toutes vos données.",
  },
];

export default function Help() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const filtered = FAQ.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl pb-10 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-[#16B8B1] dark:hover:text-[#16B8B1]"
          >
            <ArrowLeft size={13} /> Retour au tableau de bord
          </Link>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16B8B1]">
            Support
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white sm:text-3xl">
            Aide et assistance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Trouvez rapidement des réponses à vos questions.
          </p>
        </div>

        {/* Recherche */}
        <div className="relative max-w-2xl">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une question..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-[#0B1F33] shadow-sm placeholder:text-slate-400 transition focus:border-[#16B8B1] focus:outline-none focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#16B8B1] dark:focus:ring-[#16B8B1]/20"
          />
        </div>

        {/* Cartes d'accès rapide */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <QuickCard
            icon={BookOpen}
            title="Guide du démarrage"
            desc="Premiers pas sur TalentShare"
            to="/guide"
          />
          <QuickCard
            icon={MessageCircle}
            title="Contacter le support"
            desc="Réponse sous 24h"
            to="/contact"
          />
          <QuickCard
            icon={FileText}
            title="CGU & Confidentialité"
            desc="Conditions d'utilisation"
            to="/cgu"
          />
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-extrabold text-[#0B1F33] dark:text-white">
            Questions fréquentes
          </h2>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                Aucun résultat pour "{search}"
              </p>
            ) : (
              filtered.map((item, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur-xl transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50/60 dark:hover:bg-white/[0.02]"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle size={18} className="shrink-0 text-[#16B8B1]" />
                      <span className="font-semibold text-[#0B1F33] dark:text-white">
                        {item.q}
                      </span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${
                        openIndex === i ? "rotate-180 text-[#16B8B1]" : ""
                      }`}
                    />
                  </button>
                  {openIndex === i && (
                    <div className="border-t border-slate-100 px-4 pb-4 pl-14 pt-3 dark:border-white/10">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 rounded-2xl border border-[#16B8B1]/20 bg-[#16B8B1]/5 p-6 dark:border-[#16B8B1]/20 dark:bg-[#16B8B1]/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16B8B1]/15 text-[#0F9691] dark:text-[#16B8B1]">
                <Mail size={20} />
              </span>
              <div>
                <p className="font-semibold text-[#0B1F33] dark:text-white">
                  Vous ne trouvez pas votre réponse ?
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Notre équipe vous répond sous 24h ouvrées.
                </p>
              </div>
            </div>
            <a
              href="mailto:support@talentshare.mg"
              className="flex items-center gap-2 rounded-full bg-[#0B1F33] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#142B49] dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]"
            >
              <Mail size={15} /> Contacter le support
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function QuickCard({ icon: Icon, title, desc, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#16B8B1]/40 hover:bg-[#16B8B1]/5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:hover:border-[#16B8B1]/40 dark:hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16B8B1]/15 text-[#0F9691] dark:text-[#16B8B1]">
          <Icon size={18} />
        </span>
        <ExternalLink
          size={14}
          className="text-slate-300 transition group-hover:text-[#16B8B1] dark:text-slate-600"
        />
      </div>
      <p className="mt-4 font-semibold text-[#0B1F33] dark:text-white">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </Link>
  );
}