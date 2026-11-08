import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, LoaderCircle, UserRound } from "lucide-react";
import api from "../../services/api";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

const STATUS_META = {
  sent: { label: "À traiter", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  pending: { label: "À traiter", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  viewed: { label: "Consultée", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  accepted: { label: "Acceptée", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  rejected: { label: "Refusée", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
  declined: { label: "Refusée", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
  withdrawn: { label: "Retirée", cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400" },
};

const groupOf = (status) => {
  const s = String(status || "").toLowerCase();
  if (["sent", "pending", "viewed"].includes(s)) return "todo";
  if (s === "accepted") return "accepted";
  return "closed";
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "todo", label: "À traiter" },
  { key: "accepted", label: "Acceptées" },
  { key: "closed", label: "Refusées / retirées" },
];

export default function ProposalsList({ received = [], sent = [], loading }) {
  const [filter, setFilter] = useState("all");

  const rows = useMemo(
    () => [
      ...received.map((p) => ({ ...p, _dir: "applied" })),
      ...sent.map((p) => ({ ...p, _dir: "proposed" })),
    ],
    [received, sent]
  );

  const visible = rows.filter((p) => filter === "all" || groupOf(p.status) === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoaderCircle className="animate-spin text-emerald-500" size={30} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox size={40} className="text-slate-300" />
        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">Aucune proposition</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Aucun talent n'a encore postulé et vous n'avez encore proposé personne.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? rows.length : rows.filter((p) => groupOf(p.status) === f.key).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Aucune proposition dans cette catégorie.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((prop) => {
            const meta = STATUS_META[String(prop.status || "").toLowerCase()] || {
              label: prop.status || "—",
              cls: "bg-slate-100 text-slate-600",
            };
            const profileId = prop.professional_profile_id ?? prop.profile_id ?? prop.profile?.id;
            const avatar = prop.profile?.user?.avatar_path;

            return (
              <div
                key={`${prop._dir}-${prop.id}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500 dark:bg-white/10">
                    {avatar ? (
                      <img src={fileUrl(avatar)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {prop.profile?.user?.name || "Talent"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {prop.profile?.headline || "Candidat"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {prop._dir === "applied" ? "A postulé" : "Proposé par vous"}
                    </span>
                  </div>
                </div>

                {prop.message && (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    "{prop.message}"
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                  {profileId ? (
                    <Link to={`/talents/${profileId}`} className="text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                      Voir le profil
                    </Link>
                  ) : (
                    <span />
                  )}
                  <Link to={`/proposals/${prop.id}`} className="text-xs font-bold text-slate-700 hover:underline dark:text-slate-200">
                    Ouvrir la proposition &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}