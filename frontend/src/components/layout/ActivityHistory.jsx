import React from "react";
import { History } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ActivityHistory() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/history")}
      aria-label="Historique d'activité"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4EBF1] bg-white text-[#526B83] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
    >
      <History size={19} strokeWidth={1.9} />
    </button>
  );
}