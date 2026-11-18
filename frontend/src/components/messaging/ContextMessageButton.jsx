import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

/**
 * P0-17 — Messagerie contextuelle : ouvre (ou crée) une conversation titrée selon le contexte.
 * <ContextMessageButton userId={company.owner_user_id} context={`Partenariat · ${company.name}`} />
 */
export default function ContextMessageButton({ userId, context, label = "Écrire", className = "" }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  if (!userId) return null;

  const open = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/conversations", {
        participant_ids: [userId],
        title: context,
        body: `Bonjour, je vous contacte au sujet de : ${context}.`,
      });
      nav(`/messages${data?.id ? `?conversation=${data.id}` : ""}`);
    } catch {
      nav(`/messages?to=${userId}`);
    } finally { setBusy(false); }
  };

  return (
    <button type="button" onClick={open} disabled={busy}
      className={`inline-flex h-8 items-center rounded-lg border border-[#E4EBF1] bg-white px-3 text-[12px] font-semibold text-[#0B1F33] transition hover:border-[#16B8B1] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white ${className}`}>
      {busy ? "Ouverture…" : label}
    </button>
  );
}
