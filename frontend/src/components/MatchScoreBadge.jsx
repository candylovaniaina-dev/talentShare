import React from "react";

export const scoreColor = (score) => {
  if (score === null || score === undefined) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

export const scoreLabel = (score) => {
  if (score === null || score === undefined) return "";
  if (score >= 80) return "🏆 Excellent";
  if (score >= 60) return "👍 Bon match";
  if (score >= 40) return "🤔 Moyen";
  return "😐 Faible";
};

export default function MatchScoreBadge({ score, size = "md", showLabel = false }) {
  if (score === null || score === undefined) return null;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }[size];

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`rounded-full font-bold ${scoreColor(score)} ${sizeClasses}`}>
        {score}% match
      </span>
      {showLabel && (
        <span className="text-[10px] text-slate-400">{scoreLabel(score)}</span>
      )}
    </div>
  );
}