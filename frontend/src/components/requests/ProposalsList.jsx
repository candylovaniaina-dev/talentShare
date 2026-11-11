import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, LoaderCircle, UserRound, ArrowUpRight } from "lucide-react";
import api from "../../services/api";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const fileUrl = (p) =>
  !p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`;

const STATUS_META = {
  sent: {
    label: "À traiter",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  pending: {
    label: "À traiter",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  viewed: {
    label: "Consultée",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  accepted: {
    label: "Acceptée",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Refusée",
    color: "text-rose-700",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
  declined: {
    label: "Refusée",
    color: "text-rose-700",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
  withdrawn: {
    label: "Retirée",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
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
  { key: "closed", label: "Terminées" },
];

export default function ProposalsList({
  received = [],
  sent = [],
  loading,
}) {
  const [filter, setFilter] = useState("all");

  const rows = useMemo(
    () => [
      ...received.map((p) => ({ ...p, _dir: "applied" })),
      ...sent.map((p) => ({ ...p, _dir: "proposed" })),
    ],
    [received, sent]
  );

  const visible = rows.filter(
    (p) => filter === "all" || groupOf(p.status) === filter
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      todo: rows.filter((p) => groupOf(p.status) === "todo").length,
      accepted: rows.filter((p) => groupOf(p.status) === "accepted").length,
      closed: rows.filter((p) => groupOf(p.status) === "closed").length,
    }),
    [rows]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoaderCircle className="animate-spin text-[#16B8B1]" size={32} />
        <p className="mt-3 text-sm font-medium text-slate-500">
          Chargement des propositions...
        </p>
      </div>
    );
  }

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#0B1F33] dark:text-white">
                Mes propositions
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Suivez les candidatures et les talents proposés.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {rows.length} proposition{rows.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* EMPTY STATE */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-14 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-white/5">
            <Inbox size={27} />
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0B1F33] dark:text-white">
            Aucune proposition pour le moment
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Les candidatures reçues et les talents auxquels vous envoyez des
            propositions apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          {/* FILTER TABS (Sans icônes) */}
          <div className="mb-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-white/10 dark:bg-white/[0.03]">
              {FILTERS.map((f) => {
                const active = filter === f.key;

                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                      active
                        ? "bg-white text-[#0B1F33] shadow-sm ring-1 ring-slate-200/70 dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:ring-0"
                        : "text-slate-500 hover:bg-white/70 hover:text-[#0B1F33] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {f.label}

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        active
                          ? "bg-[#E8F8F7] text-[#078D88] dark:bg-[#0B1F33]/10 dark:text-[#0B1F33]"
                          : "bg-slate-200/70 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                      }`}
                    >
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PROPOSALS */}
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center dark:border-white/10">
              <Inbox size={25} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Aucun résultat dans cette catégorie
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-3 text-xs font-bold text-[#119D98] hover:underline"
              >
                Voir toutes les propositions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visible.map((prop) => {
                const status =
                  STATUS_META[String(prop.status || "").toLowerCase()] ||
                  STATUS_META.sent;

                const profileId =
                  prop.professional_profile_id ??
                  prop.profile_id ??
                  prop.profile?.id;

                const avatar = prop.profile?.user?.avatar_path;

                const name = prop.profile?.user?.name || "Talent";
                const headline = prop.profile?.headline || "Candidat";

                return (
                  <article
                    key={`${prop._dir}-${prop.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-300 hover:border-[#16B8B1]/50 hover:shadow-[0_8px_30px_rgba(11,31,51,0.07)] dark:border-white/10 dark:bg-[#131E47]"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      {/* AVATAR */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-white/10 dark:bg-white/10">
                            {avatar ? (
                              <img
                                src={fileUrl(avatar)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={22} className="text-slate-400" />
                            )}
                          </div>

                          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#16B8B1] dark:border-[#131E47]" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold text-[#0B1F33] transition-colors group-hover:text-[#078D88] dark:text-white">
                            {name}
                          </h4>

                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {headline}
                          </p>

                          <div className="mt-2 flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                prop._dir === "applied"
                                  ? "bg-blue-500"
                                  : "bg-[#16B8B1]"
                              }`}
                            />

                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {prop._dir === "applied"
                                ? "Candidature reçue"
                                : "Talent proposé"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* MESSAGE */}
                      {prop.message && (
                        <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-white/[0.04]">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Message
                          </p>
                          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {prop.message}
                          </p>
                        </div>
                      )}

                      {/* STATUS (Sans icône) */}
                      <div className="flex shrink-0 items-center sm:justify-end">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 ${status.bg} ${status.color}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                          <span className="text-[10px] font-bold">
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/5 dark:bg-white/[0.025]">
                      <div className="flex items-center gap-2">
                        {profileId ? (
                          <Link
                            to={`/talents/${profileId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-[#078D88] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-[#16B8B1]"
                          >
                            Voir le profil
                          </Link>
                        ) : (
                          <span />
                        )}
                      </div>

                      <Link
                        to={`/proposals/${prop.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F33] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#123A50] hover:shadow-md dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#36D0C8]"
                      >
                        Ouvrir la proposition
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}