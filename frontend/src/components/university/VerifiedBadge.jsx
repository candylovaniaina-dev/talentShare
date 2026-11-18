import React, { useEffect, useState } from "react";
import api from "../../services/api";

/** Badge « Profil vérifié par l'université » — <VerifiedBadge userId={user.id} /> sur profil / portfolio / carte talent. */
export default function VerifiedBadge({ userId, compact = false }) {
  const [badge, setBadge] = useState(null);
  useEffect(() => {
    if (!userId) return;
    let off = false;
    api.get(`/talents/${userId}/academic-badge`).then((r) => { if (!off && r.data?.verified) setBadge(r.data.badge); }).catch(() => {});
    return () => { off = true; };
  }, [userId]);
  if (!badge) return null;
  return (
    <span title={`Statut étudiant certifié par ${badge.university}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#16B8B1]/12 px-2.5 py-1 text-[11px] font-semibold text-[#0F9691] ring-1 ring-[#16B8B1]/25 dark:text-[#16B8B1]">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#16B8B1" /><path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="#0B1F33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {compact ? "Vérifié" : `Vérifié par ${badge.university}`}
    </span>
  );
}
