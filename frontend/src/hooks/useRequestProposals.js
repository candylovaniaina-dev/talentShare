import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const profileIdOf = (p) =>
  String(p.professional_profile_id ?? p.profile_id ?? p.profile?.id ?? "");

/**
 * Charge toutes les propositions liées à UNE demande :
 *  - received : candidatures reçues (le talent a postulé)
 *  - sent     : propositions envoyées par l'entreprise à un talent
 * byProfile : { [profileId]: { direction: "applied" | "proposed", proposal } }
 */
export default function useRequestProposals(requestId, enabled = true) {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));

  const reload = useCallback(async () => {
    if (!requestId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const same = (p) => String(p.resource_request_id) === String(requestId);

    const [rec, snt] = await Promise.all([
      api
        .get(`/proposals/received?resource_request_id=${requestId}`)
        .then((r) => asArray(r.data).filter(same))
        .catch(() => []),
      api
        .get(`/proposals/sent?resource_request_id=${requestId}`)
        .then((r) => asArray(r.data).filter(same))
        .catch(() => []),
    ]);

    // Une proposition envoyée par l'entreprise ne doit pas apparaître
    // dans "reçues" si le backend la renvoie aussi dans /received.
    const sentIds = new Set(snt.map((p) => String(p.id)));
    setReceived(rec.filter((p) => !sentIds.has(String(p.id))));
    setSent(snt);
    setLoading(false);
  }, [requestId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const byProfile = useMemo(() => {
    const map = {};
    sent.forEach((p) => {
      const id = profileIdOf(p);
      if (id) map[id] = { direction: "proposed", proposal: p };
    });
    // Si le talent a postulé, ça prime (il a déjà fait le premier pas)
    received.forEach((p) => {
      const id = profileIdOf(p);
      if (id) map[id] = { direction: "applied", proposal: p };
    });
    return map;
  }, [received, sent]);

  return { received, sent, byProfile, loading, reload };
}