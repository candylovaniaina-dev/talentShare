import React from "react";
import { Link } from "react-router-dom";
import { Target, ArrowUpRight, MapPin, Home } from "lucide-react";
import { MatchRing, Logo, TYPE_LABELS } from "../radar/radarUi";
import { card, fileUrl, timeAgo, btnPrimary } from "./shared";

export default function RadarStrip({ items = [], loading, profileFound = true, completeness, tip, onOpen }) {
  return (
    <section className={`${card} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Target size={16} className="text-teal-500" /> Mon radar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Les opportunités les plus compatibles avec votre profil</p>
        </div>
        <Link to="/opportunites" className={btnPrimary}>
          Ouvrir le radar <ArrowUpRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3">{[0, 1, 2].map((i) => <div key={i} className="ts-skel h-36 w-64 shrink-0 rounded-2xl" />)}</div>
      ) : !profileFound ? (
        <p className="rounded-2xl bg-slate-50/80 p-4 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          Créez votre profil pour activer le radar.{" "}
          <Link to="/profile" className="font-medium text-teal-600 hover:underline dark:text-teal-400">Compléter mon profil</Link>
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-slate-50/80 p-4 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {tip || "Aucune opportunité compatible pour le moment."}{" "}
          <Link to="/opportunites" className="font-medium text-teal-600 hover:underline dark:text-teal-400">Élargir ma recherche</Link>
        </p>
      ) : (
        <div className="ts-noscroll flex gap-3 overflow-x-auto pb-1">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onOpen?.(it)}
              className="group flex w-64 shrink-0 flex-col justify-between rounded-2xl bg-slate-50/70 p-4 text-left transition hover:bg-white hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                <Logo src={fileUrl(it.company?.logo_path)} name={it.company?.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{it.company?.name || "Entreprise"}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 dark:text-white">{it.title}</h3>
                </div>
                <MatchRing score={it.score} size={44} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                  {TYPE_LABELS[it.type_key] || "Offre"}
                </span>
                {it.city && <span className="inline-flex items-center gap-1"><MapPin size={10} />{it.city}</span>}
                {it.remote && <span className="inline-flex items-center gap-1"><Home size={10} />Télétravail</span>}
                <span className="ml-auto">{timeAgo(it.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {typeof completeness === "number" && completeness < 70 && items.length > 0 && (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Profil complété à {completeness} %.{" "}
          <Link to="/profile" className="font-medium text-teal-600 hover:underline dark:text-teal-400">Le compléter</Link> pour améliorer vos correspondances.
        </p>
      )}
    </section>
  );
}