import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Spinner, errMsg } from "./ui";
import UniversityHome from "./UniversityHome";
import UniversityProfile, { UniversityCreate } from "./UniversityProfile";

/**
 * Page /university?tab=home|profile
 * - Sans fiche : l'utilisateur tombe directement sur la création (onglet Profil).
 * - Avec fiche : Accueil (activité) ou Profil (fiche, équipe, étudiants, offre académique).
 */
export default function UniversityHub() {
  const [sp] = useSearchParams();
  const tab = sp.get("tab") === "profile" ? "profile" : "home";
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  const load = useCallback(() => {
    return api.get("/university/me")
      .then((r) => setState({ status: "ready", data: r.data, error: null }))
      .catch((e) => setState(e.response?.status === 404
        ? { status: "missing", data: null, error: null }
        : { status: "error", data: null, error: errMsg(e) }));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <p className="rounded-2xl bg-rose-50 p-5 text-[13px] text-rose-700">{state.error}</p>;

  if (state.status === "missing") {
    return <UniversityCreate onCreated={load} />;
  }

  const onUniversityChange = (university) => setState((s) => ({ ...s, data: { ...s.data, university } }));

  return tab === "profile"
    ? <UniversityProfile me={state.data} onChange={onUniversityChange} />
    : <UniversityHome me={state.data} />;
}

