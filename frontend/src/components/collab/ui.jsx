import React, { useEffect, useState } from "react";
import api from "../../services/api";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

export const fileUrl = (p) => {
  if (!p) return null;
  // Si c'est déjà une URL complète
  if (/^https?:/.test(p)) return p;
  
  // Nettoyage pour éviter les doubles slashes
  const cleanPath = p.startsWith("/") ? p.slice(1) : p;
  
  // Si le chemin commence déjà par "storage/", on ne le rajoute pas
  if (cleanPath.startsWith("storage/")) {
    return `${BASE_URL}/${cleanPath}`;
  }
  
  return `${BASE_URL}/storage/${cleanPath}`;
};

export const TONES = {
  amber: { pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25", dot: "bg-amber-500" },
  blue: { pill: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25", dot: "bg-blue-500" },
  violet: { pill: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25", dot: "bg-violet-500" },
  teal: { pill: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/25", dot: "bg-[#16B8B1]" },
  emerald: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25", dot: "bg-emerald-500" },
  slate: { pill: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/25", dot: "bg-slate-400" },
  rose: { pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25", dot: "bg-rose-500" },
  
  // ✅ AJOUT DU TONE NAVY (Bleu Marine)
  navy: { 
    pill: "bg-[#0B1F33] text-white ring-[#0B1F33] dark:bg-[#0B1F33] dark:text-white dark:ring-white/20", 
    dot: "bg-[#16B8B1]" 
  },
};

export const MISSION_STATUS = {
  pending_employee: { label: "En attente", tone: "amber", description: "En attente de la réponse du talent" },
  planned: { label: "Acceptée", tone: "navy", description: "La mission est prête à démarrer" }, // ✅ Passé en navy
  trial: { label: "Période d'essai", tone: "violet", description: "Période d'essai en cours avant confirmation en CDI" },
  active: { label: "En cours", tone: "teal", description: "La mission est actuellement en cours" },
  completed: { label: "Terminée", tone: "slate", description: "Cette mission est terminée" },
  cancelled: { label: "Annulée", tone: "rose", description: "Cette mission a été annulée" },
};

export const PROPOSAL_STATUS = {
  draft: { label: "Brouillon", tone: "slate" },
  sent: { label: "Envoyée", tone: "blue" },
  viewed: { label: "Consultée", tone: "violet" },
  accepted: { label: "Acceptée", tone: "emerald" },
  declined: { label: "Refusée", tone: "rose" },
  expired: { label: "Expirée", tone: "amber" },
  cancelled: { label: "Annulée", tone: "slate" },
};

export function StatusPill({ tone = "slate", children, className = "" }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${t.pill} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}

export function Avatar({ name, path, size = 40, className = "" }) {
  const [err, setErr] = useState(false);
  
  // Si le chemin existe, on l'utilise. Sinon, on génère une image avec les initiales
  const src = path 
    ? (/^https?:/.test(path) ? path : `http://localhost:8001/storage/${path}`) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "?")}&background=0B1F33&color=fff&bold=true&size=${size * 2}`;

  useEffect(() => setErr(false), [src]);

  if (err) {
    // Si même l'image générée échoue, on affiche les initiales en texte
    const initials = (name || "?").split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
    return (
      <span
        style={{ width: size, height: size }}
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0B1F33] text-xs font-extrabold text-white ${className}`}
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ${className}`}
    >
      <img 
        src={src} 
        alt={name || "Avatar"} 
        onError={() => setErr(true)} 
        className="h-full w-full object-cover" 
      />
    </span>
  );
}

export function fmt(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "À définir";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "À définir" : d.toLocaleDateString("fr-FR", options);
}

export function durationText(start, end) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return "";
  const days = Math.round((e - s) / 86400000) + 1;
  if (days < 31) return `${days} jour${days > 1 ? "s" : ""}`;
  return `${Math.round(days / 30.44)} mois`;
}

/* Classes partagées */
export const card = "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-xs font-bold text-[#0B1F33] transition hover:bg-[#0F9691] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";
export const btnNavy =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#16324F] disabled:opacity-60 dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691] dark:hover:text-white";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-[#16B8B1] hover:text-[#0B1F33] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#16B8B1]/50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10";

/* Boutons pour fond bleu marine (en-têtes) */
export const heroPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-xs font-bold text-[#0B1F33] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";
export const heroGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-60";