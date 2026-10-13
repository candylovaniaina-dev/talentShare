
import React from "react";

export const scoreColor = (score) => {
  if (score === null || score === undefined) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (score >= 60) {
    return "border-teal-200 bg-[#E8FBF5] text-[#087F70]";
  }

  if (score >= 40) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
};

export const scoreLabel = (score) => {
  if (score === null || score === undefined) return "";
  if (score >= 80) return "Excellent match";
  if (score >= 60) return "Bon match";
  if (score >= 40) return "Match moyen";
  return "Match faible";
};

export default function MatchScoreBadge({
  score,
  size = "md",
  showLabel = false,
}) {
  if (score === null || score === undefined) return null;

  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) return null;

  const safeScore = Math.max(0, Math.min(100, numericScore));

  const sizeClasses = {
    sm: "px-2 py-1 text-[10px] gap-1",
    md: "px-2.5 py-1.5 text-xs gap-1.5",
    lg: "px-3.5 py-2 text-sm gap-2",
  }[size] || "px-2.5 py-1.5 text-xs gap-1.5";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span
        className={`inline-flex items-center rounded-full border font-bold tabular-nums ${scoreColor(
          safeScore
        )} ${sizeClasses}`}
        aria-label={`Score de correspondance : ${safeScore}%`}
      >
        <span
          className={`shrink-0 rounded-full ${
            safeScore >= 80
              ? "bg-emerald-500"
              : safeScore >= 60
              ? "bg-teal-600"
              : safeScore >= 40
              ? "bg-amber-500"
              : "bg-slate-400"
          } ${size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"}`}
        />
        {safeScore}% match
      </span>

      {showLabel && (
        <span className="text-[10px] font-medium text-slate-500">
          {scoreLabel(safeScore)}
        </span>
      )}
    </div>
  );
}
