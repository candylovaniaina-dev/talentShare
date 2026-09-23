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
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400"
        >
          <ArrowLeft size={13} /> Retour au tableau de bord
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Support
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">Aide et assistance</h1>
        <p className="mt-1 text-sm text-slate-400">
          Trouvez rapidement des réponses à vos questions.
        </p>
      </div>

      {/* Recherche */}
      <div className="relative max-w-2xl">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une question..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Cartes d'accès rapide */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickCard icon={BookOpen} title="Guide du démarrage" desc="Premiers pas sur TalentShare" to="/guide" color="mint" />
        <QuickCard icon={MessageCircle} title="Contacter le support" desc="Réponse sous 24h" to="/contact" color="blue" />
        <QuickCard icon={FileText} title="CGU & Confidentialité" desc="Conditions d'utilisation" to="/cgu" color="violet" />
      </div>

      {/* FAQ */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-white">Questions fréquentes</h2>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-500">
              Aucun résultat pour "{search}"
            </p>
          ) : (
            filtered.map((item, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-white/[0.02]"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="shrink-0 text-emerald-400" />
                    <span className="font-semibold text-white">{item.q}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="border-t border-white/10 px-4 pb-4 pl-14 pt-3">
                    <p className="text-sm leading-relaxed text-slate-300">{item.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Mail size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Vous ne trouvez pas votre réponse ?</p>
              <p className="text-sm text-slate-400">Notre équipe vous répond sous 24h ouvrées.</p>
            </div>
          </div>
          <a
            href="mailto:support@talentshare.mg"
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <Mail size={15} /> Contacter le support
          </a>
        </div>
      </div>
    </AppShell>
  );
}

function QuickCard({ icon: Icon, title, desc, to, color = "mint" }) {
  const colorMap = {
    mint: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-blue-500/15 text-blue-400",
    violet: "bg-violet-500/15 text-violet-400",
  };
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon size={18} />
        </span>
        <ExternalLink size={14} className="text-slate-600 group-hover:text-emerald-400" />
      </div>
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
    </Link>
  );
}