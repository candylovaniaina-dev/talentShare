import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

/**
 * Pour le rôle « university » : renvoie { name, logo_path } de l'établissement,
 * afin d'afficher son logo dans le menu et l'en-tête. Se met à jour quand la fiche change
 * (window.dispatchEvent(new Event("university:updated"))).
 */
export default function useUniversityBranding(user) {
  const [brand, setBrand] = useState(null);
  const isUni = user?.role === "university";

  const load = useCallback(() => {
    if (!isUni) return;
    api.get("/university/me")
      .then((r) => setBrand({ name: r.data?.university?.name, logo_path: r.data?.university?.logo_path }))
      .catch(() => {});
  }, [isUni]);

  useEffect(() => {
    load();
    window.addEventListener("university:updated", load);
    return () => window.removeEventListener("university:updated", load);
  }, [load]);

  return isUni ? brand : null;
}
