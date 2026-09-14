import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Briefcase } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = { draft: "Brouillon", published: "Publiée", closed: "Fermée", expired: "Expirée" };

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceRequests() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [requests, setRequests] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingMissions, setPendingMissions] = useState(0);

  useEffect(() => {
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id));
    });

    // ✅ Charger le nombre de missions en attente d'action
    api.get("/dashboard")
      .then((res) => {
        setPendingMissions(res.data.pending_missions || 0);
      })
      .catch(() => setPendingMissions(0));
  }, [user.id]);

  const load = () => {
    setLoading(true);
    api.get("/resource-requests").then((res) => {
      const all = asArray(res.data);
      setRequests(company ? all.filter((r) => r.company_id === company.id) : all);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { if (company) load(); }, [company]);

  const viewCandidates = async (id) => {
    const res = await api.get(`/resource-requests/${id}/candidates`);
    setCandidates((c) => ({ ...c, [id]: asArray(res.data) }));
  };

  const propose = async (requestId, profileId) => {
    await api.post("/proposals", {
      resource_request_id: requestId,
      professional_profile_id: profileId,
      proposed_by_company_id: company.id,
    });
    alert("Proposition envoyée !");
  };

  if (!company) {
    return <AppShell><p className="text-slate-500">Créez d'abord votre entreprise dans "Mon entreprise".</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes demandes de ressources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publiez un besoin et laissez TalentShare identifier les meilleurs profils.
          </p>
        </div>

        {/* ✅ Boutons à droite : Mes missions + Nouvelle demande */}
        <div className="flex items-center gap-3">
          <Link
            to="/missions"
            className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:border-navy transition"
          >
            <Briefcase size={16} />
            Mes missions
            {pendingMissions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                {pendingMissions > 9 ? "9+" : pendingMissions}
              </span>
            )}
          </Link>

          <Link
            to="/resource-requests/new"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            <Plus size={16} /> Nouvelle demande
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading && <p className="text-slate-400">Chargement...</p>}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="font-semibold text-slate-600">Aucune demande pour l'instant.</p>
            <p className="mt-1 text-sm text-slate-400">
              Créez votre première demande pour trouver les talents qu'il vous faut.
            </p>
            <Link
              to="/resource-requests/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} /> Créer une demande
            </Link>
          </div>
        )}

        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{r.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                {STATUS_LABELS[r.status] || r.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{r.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(r.skills || []).map((s) => (
                <span key={s.id} className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                  {s.name}
                </span>
              ))}
            </div>

            <button
              onClick={() => viewCandidates(r.id)}
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-navy underline"
            >
              <Users size={14} /> Voir les candidats
            </button>

            {candidates[r.id] && (
              <ul className="mt-3 space-y-2">
                {candidates[r.id].length === 0 && (
                  <li className="text-sm text-slate-400">Aucun candidat trouvé pour l'instant.</li>
                )}
                {candidates[r.id].map((c) => (
                  <li
                    key={c.profile_id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm"
                  >
                    <span>
                      {c.name} — {c.headline}{" "}
                      <b className="text-navy">{c.match.total}% match</b>
                    </span>
                    <button
                      onClick={() => propose(r.id, c.profile_id)}
                      className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-navy"
                    >
                      Proposer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}