
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";
import AppShell from "../components/layout/AppShell";
import ProposalDetail from "./ProposalDetail";
import ResourceProposalDetail from "./ResourceProposalDetail";

/* ============================================================
   DESIGN — TALENTSHARE
============================================================ */

const STYLES = `
@keyframes proposal-fade {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes proposal-pulse {
  0%, 100% { opacity: .45; }
  50% { opacity: 1; }
}

@keyframes proposal-shimmer {
  0% { background-position: -500px 0; }
  100% { background-position: 500px 0; }
}

@keyframes proposal-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.proposal-loading {
  animation: proposal-fade .5s ease both;
}

.proposal-shimmer {
  background: linear-gradient(
    90deg,
    #edf2f5 25%,
    #f8fafc 50%,
    #edf2f5 75%
  );
  background-size: 1000px 100%;
  animation: proposal-shimmer 1.8s infinite linear;
}

.proposal-orbit {
  animation: proposal-orbit 8s linear infinite;
}

.proposal-pulse {
  animation: proposal-pulse 1.8s ease-in-out infinite;
}
`;

/* ============================================================
   ROUTING
============================================================ */

const isCompanyToCompany = (p) =>
  p && (
    p.resource_offer_id ||
    (p.proposed_by_company_id && p.to_company_id)
  );

/* ============================================================
   LOADING SCREEN
============================================================ */

function ProposalLoading() {
  return (
    <AppShell>
      <style>{STYLES}</style>

      <div className="proposal-loading min-h-[75vh] bg-[#F5F8FA] px-4 py-10 dark:bg-[#091C2A] sm:px-6">

        <div className="mx-auto max-w-5xl">

          {/* Navigation */}
          <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>TalentShare</span>
            <ArrowRight size={12} />
            <span className="text-[#0E8F8A]">Collaborations</span>
            <ArrowRight size={12} />
            <span>Détails</span>
          </div>

          {/* Intro */}
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#16B8B1]/10 text-[#0E8F8A]">

                <FileText size={25} strokeWidth={1.8} />

                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#F5F8FA] bg-[#16B8B1] dark:border-[#091C2A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>

              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-[#0B2235] dark:text-white sm:text-2xl">
                    Votre collaboration
                  </h1>

                  <Sparkles size={16} className="text-[#16B8B1]" />
                </div>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Préparation des informations de votre proposition...
                </p>
              </div>

            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-[#16B8B1]/20 bg-white px-3.5 py-2 shadow-sm dark:border-white/10 dark:bg-[#102C40]">

              <LoaderCircle size={14} className="animate-spin text-[#16B8B1]" />

              <span className="text-[11px] font-bold text-[#0E8F8A] dark:text-[#5EE0DA]">
                Chargement en cours
              </span>

            </div>

          </div>

          {/* Main skeleton */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">

            <div className="space-y-5">

              {/* Main card */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-[#102C40]">

                <div className="border-b border-slate-100 p-5 dark:border-white/10 sm:p-7">

                  <div className="mb-5 flex items-center justify-between">

                    <div className="h-6 w-28 rounded-full proposal-shimmer" />

                    <div className="h-6 w-24 rounded-full proposal-shimmer" />

                  </div>

                  <div className="h-7 w-3/4 rounded-lg proposal-shimmer" />

                  <div className="mt-3 h-4 w-1/2 rounded-md proposal-shimmer" />

                  <div className="mt-7 flex flex-wrap gap-3">

                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 w-28 rounded-xl proposal-shimmer" />
                    ))}

                  </div>

                </div>

                <div className="space-y-6 p-5 sm:p-7">

                  <div>
                    <div className="mb-4 h-4 w-40 rounded proposal-shimmer" />

                    <div className="space-y-2.5">
                      <div className="h-3 w-full rounded proposal-shimmer" />
                      <div className="h-3 w-11/12 rounded proposal-shimmer" />
                      <div className="h-3 w-4/5 rounded proposal-shimmer" />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-white/10" />

                  <div>
                    <div className="mb-4 h-4 w-36 rounded proposal-shimmer" />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">

                          <div className="h-3 w-16 rounded proposal-shimmer" />

                          <div className="mt-3 h-5 w-24 rounded proposal-shimmer" />

                        </div>
                      ))}

                    </div>
                  </div>

                </div>

              </section>

              {/* Secondary card */}
              <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#102C40] sm:p-7">

                <div className="mb-5 h-4 w-44 rounded proposal-shimmer" />

                <div className="space-y-3">

                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">

                      <div className="h-10 w-10 shrink-0 rounded-xl proposal-shimmer" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded proposal-shimmer" />
                        <div className="h-2.5 w-2/3 rounded proposal-shimmer" />
                      </div>

                    </div>
                  ))}

                </div>

              </section>

            </div>

            {/* Sidebar */}
            <aside className="space-y-5">

              <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#102C40]">

                <div className="mb-5 h-4 w-32 rounded proposal-shimmer" />

                <div className="mb-4 h-10 w-3/4 rounded-lg proposal-shimmer" />

                <div className="space-y-3">

                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <div className="h-3 w-20 rounded proposal-shimmer" />
                      <div className="h-3 w-16 rounded proposal-shimmer" />
                    </div>
                  ))}

                </div>

                <div className="mt-6 h-11 rounded-xl proposal-shimmer" />

                <div className="mt-3 h-11 rounded-xl proposal-shimmer" />

              </section>

              <div className="rounded-2xl border border-[#16B8B1]/15 bg-[#16B8B1]/[0.06] p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck size={19} className="shrink-0 text-[#16B8B1]" />

                  <div>
                    <p className="text-xs font-bold text-[#0B2235] dark:text-white">
                      Espace sécurisé
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      Vos échanges et informations de collaboration sont protégés.
                    </p>
                  </div>

                </div>

              </div>

            </aside>

          </div>

          {/* Bottom message */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1] proposal-pulse" />
            TalentShare · Connecting opportunities
          </div>

        </div>

      </div>
    </AppShell>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function ProposalRouter() {
  const { id } = useParams();

  const [state, setState] = useState({
    loading: true,
    proposal: null,
  });

  useEffect(() => {
    let active = true;

    setState({
      loading: true,
      proposal: null,
    });

    api.get(`/proposals/${id}`)
      .then((r) => {
        if (active) {
          setState({
            loading: false,
            proposal: r.data,
          });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            loading: false,
            proposal: null,
          });
        }
      });

    return () => {
      active = false;
    };

  }, [id]);

  if (state.loading) {
    return <ProposalLoading />;
  }

  if (isCompanyToCompany(state.proposal)) {
    return (
      <ResourceProposalDetail
        key={id}
        initial={state.proposal}
      />
    );
  }

  return <ProposalDetail />;
}
