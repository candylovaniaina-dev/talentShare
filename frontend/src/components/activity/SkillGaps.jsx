import React, { useState } from "react";
import { Loader2, Plus, GraduationCap } from "lucide-react";
import { card, Empty } from "./shared";

const LEVELS = [
  ["beginner", "Débutant"], ["intermediate", "Intermédiaire"], ["advanced", "Avancé"], ["expert", "Expert"],
];

function GapRow({ gap, onAdd, adding }) {
  const [level, setLevel] = useState(gap.level);
  return (
    <li className="rounded-2xl bg-slate-50/70 p-4 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{gap.name}</h4>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Demandée dans <b className="font-semibold">{gap.offers}</b> offre{gap.offers > 1 ? "s" : ""} compatible{gap.offers > 1 ? "s" : ""}
            {gap.unlocks > 0 && (
              <> · vous rend pleinement compatible (compétences) avec <b className="font-semibold text-teal-600 dark:text-teal-400">{gap.unlocks}</b></>
            )}
          </p>
          {gap.samples.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-slate-400">Ex. : {gap.samples.join(" · ")}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-label={`Niveau pour ${gap.name}`}
            className="rounded-xl border-0 bg-white px-3 py-2 text-xs text-slate-600 outline-none ring-1 ring-slate-900/10 dark:bg-[#142B49] dark:text-slate-200 dark:ring-white/10"
          >
            {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button
            type="button"
            disabled={adding}
            onClick={() => onAdd(gap, level)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F33] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#16324F] disabled:opacity-60 dark:bg-[#16B8B1] dark:text-[#0B1F33]"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Ajouter
          </button>
        </div>
      </div>
    </li>
  );
}

export default function SkillGaps({ gaps = [], onAdd, addingId, limit = 10, title = true }) {
  const shown = gaps.slice(0, limit);
  return (
    <section className={`${card} p-5 sm:p-6`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Compétences à développer</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Les compétences les plus demandées dans les offres compatibles, que vous n'avez pas encore sur votre profil.
          </p>
        </div>
      )}
      {shown.length === 0 ? (
        <Empty compact icon={GraduationCap} text="Aucune compétence manquante repérée : votre profil couvre bien les offres actuelles." />
      ) : (
        <ul className="space-y-3">
          {shown.map((g) => <GapRow key={g.id} gap={g} onAdd={onAdd} adding={addingId === g.id} />)}
        </ul>
      )}
    </section>
  );
}

export function SkillGapMini({ gaps = [], onSeeAll }) {
  const top = gaps.slice(0, 2);
  return (
    <section className={`${card} p-4`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">À développer</h3>
      {top.length === 0 ? (
        <p className="rounded-2xl bg-slate-50/80 py-5 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">Votre profil couvre bien les offres actuelles.</p>
      ) : (
        <ul className="space-y-2">
          {top.map((g) => (
            <li key={g.id} className="rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-white/5">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{g.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">+{g.offers} offre{g.offers > 1 ? "s" : ""} compatible{g.offers > 1 ? "s" : ""}</p>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onSeeAll} className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10">
        Voir et ajouter →
      </button>
    </section>
  );
}