import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, ArrowUpRight, MapPin, Home } from "lucide-react";
import api from "../../services/api";
import { MatchRing, Logo, TYPE_LABELS, fileUrl, timeAgo } from "./radarUi";

const card = "rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none";

export default function RadarHighlights() {
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    let off = false;
    api.get("/radar", { params: { limit: 6, min_score: 40 } })
      .then((res) => { if (!off) setState({ loading: false, data: res.data }); })
      .catch(() => { if (!off) setState({ loading: false, data: null }); });
    return () => { off = true; };
  }, []);

  const { loading, data } = state;
  const items = data?.data || [];
  const completeness = data?.profile?.completeness;
  const tip = data?.profile?.tips?.[0];

  return (
    <section className={`${card} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
            <Target size={16} className="text-teal-500" /> Mon radar
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Les opportunités les plus compatibles avec votre profil
          </p>
        </div>
        <Link to="/opportunites" className="inline-flex items-center gap-1 rounded-lg bg-[#0B1F33] px-3.5 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
          Ouvrir le radar <ArrowUpRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="ts-skel h-36 w-60 shrink-0 rounded-xl" />)}
        </div>
      ) : data && data.profile_found === false ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          Créez votre profil pour activer le radar.{" "}
          <Link to="/profile" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">Compléter mon profil</Link>
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {tip || "Aucune opportunité compatible pour le moment."}{" "}
          <Link to="/opportunites" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">Élargir ma recherche</Link>
        </p>
      ) : (
        <div className="ts-noscroll flex gap-3 overflow-x-auto pb-1">
          {items.map((it) => (
            <Link
              key={it.key}
              to="/opportunites"
              className="group flex w-64 shrink-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md dark:border-white/10 dark:bg-[#142B49]"
            >
              <div className="flex items-start gap-3">
                <Logo src={fileUrl(it.company?.logo_path)} name={it.company?.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{it.company?.name || "Entreprise"}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 group-hover:text-teal-600 dark:text-white">{it.title}</h3>
                </div>
                <MatchRing score={it.score} size={44} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                  {TYPE_LABELS[it.type_key] || "Offre"}
                </span>
                {it.city && <span className="inline-flex items-center gap-1"><MapPin size={10} />{it.city}</span>}
                {it.remote && <span className="inline-flex items-center gap-1"><Home size={10} />Télétravail</span>}
                <span className="ml-auto">{timeAgo(it.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {typeof completeness === "number" && completeness < 70 && items.length > 0 && (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Profil complété à {completeness} %.{" "}
          <Link to="/profile" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">Le compléter</Link>{" "}
          pour améliorer vos correspondances.
        </p>
      )}
    </section>
  );
}