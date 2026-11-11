import React, { useEffect, useState } from "react";
import api from "../../services/api";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
export const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

export const TYPE_LABELS = { stage: "Stage", alternance: "Alternance", emploi: "Emploi", mission: "Mission" };

export function matchTone(score) {
  if (score >= 80) return { color: "#16B8B1", label: "Très compatible" };
  if (score >= 60) return { color: "#3478E8", label: "Bonne compatibilité" };
  if (score >= 40) return { color: "#F59E0B", label: "Compatibilité partielle" };
  return { color: "#94A3B8", label: "Compatibilité faible" };
}

export function timeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function MatchRing({ score = 0, size = 52 }) {
  const { color } = matchTone(score);
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#E2E8F0" strokeWidth="3.5" className="dark:stroke-white/10" />
        <circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export function Logo({ src, name, size = 44 }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
    >
      {src && !err ? (
        <img src={src} alt="" onError={() => setErr(true)} className="h-full w-full object-contain p-1" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{(name || "?").charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}