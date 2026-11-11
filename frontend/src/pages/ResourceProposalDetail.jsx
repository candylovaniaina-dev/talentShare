import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Building2, FileText, Paperclip, Trash2, Check, X, Send, Edit3, Loader2,
  Briefcase, Ban, CalendarDays, Clock3, Users, RefreshCw, History, ChevronRight, Timer,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import { Modal, MISSION_TYPES, apiError } from "../components/resource-sharing/shared";
import {
  PROPOSAL_STATUS, TONES, Avatar, card, fmt, durationText,
  btnPrimary, btnGhost, btnDanger, heroPrimary, heroGhost,
} from "../components/collab/ui";

const STEPS = ["Brouillon", "Envoyée", "Consultée", "Réponse"];
const ORDER = { draft: 0, sent: 1, viewed: 2 };
const FINAL = ["accepted", "declined", "expired", "cancelled"];

function Stepper({ status }) {
  const isFinal = FINAL.includes(status);
  const idx = isFinal ? 3 : ORDER[status] ?? 0;
  const finalTone = PROPOSAL_STATUS[status]?.tone;

  return (
    <ol className="flex items-center">
      {STEPS.map((label, i) => {
        const reached = i <= idx;
        const current = i === idx;
        const dot = i === 3 && isFinal ? TONES[finalTone]?.dot || "bg-[#16B8B1]" : reached ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/15";
        const text = i === 3 && isFinal ? PROPOSAL_STATUS[status]?.label || label : label;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${dot} ${current ? "ring-4 ring-[#16B8B1]/20" : ""}`}>
                {reached && !current ? <Check size={13} strokeWidth={3} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
              </span>
              <span className={`whitespace-nowrap text-xs ${current ? "font-bold text-[#0B1F33] dark:text-white" : reached ? "font-medium text-slate-600 dark:text-slate-300" : "text-slate-400"}`}>
                {text}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={`mx-3 h-px flex-1 ${i < idx ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Panel({ icon: Icon, title, detail, action, children }) {
  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-teal-700 dark:text-[#16B8B1]">
            <Icon size={17} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0B1F33] dark:text-white">{title}</h2>
            {detail && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0A1230]">
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <div className="text-sm font-bold text-[#0B1F33] dark:text-white">{children}</div>
    </div>
  );
}

function TextBlock({ label, text }) {
  if (!text) return null;
  return (
    <div className="px-5 py-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{text}</p>
    </div>
  );
}

export default function ResourceProposalDetail({ initial }) {
  const { toast, show, close } = useToast();

  const [p, setP] = useState(initial);
  const [myCompanyIds, setMyCompanyIds] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    api.get("/companies/my/all")
      .then((r) => setMyCompanyIds((Array.isArray(r.data) ? r.data : r.data?.data || []).map((c) => Number(c.id))))
      .catch(() => setMyCompanyIds([]));
  }, []);

  const refresh = async () => {
    try {
      const r = await api.get(`/proposals/${p.id}`);
      setP(r.data);
    } catch {
      // On garde les informations actuelles en cas d'erreur.
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };

  const status = p.display_status || p.status;
  const statusCfg = PROPOSAL_STATUS[status] || PROPOSAL_STATUS.sent;
  const isSender = myCompanyIds?.includes(Number(p.proposed_by_company_id));
  const isRecipient = myCompanyIds?.includes(Number(p.to_company_id));

  const offer = p.resource_offer || {};
  const talent = p.profile?.user || {};
  const other = isSender ? p.to_company : p.proposing_company;
  const pending = ["sent", "viewed"].includes(status);
  const otherIsLender = (isSender && !!p.resource_offer_id) || (!isSender && !p.resource_offer_id);
  const title = offer.title || p.resource_request?.title || "Proposition directe";
  const canEditDocs = isSender && ["draft", "sent"].includes(p.status);

  const events = useMemo(() => {
    const e = [];
    if (p.created_at) e.push({ at: p.created_at, label: "Brouillon créé" });
    if (p.sent_at) e.push({ at: p.sent_at, label: "Envoyée" });
    if (p.viewed_at) e.push({ at: p.viewed_at, label: "Consultée" });
    if (p.responded_at) e.push({ at: p.responded_at, label: p.status === "accepted" ? "Acceptée" : "Refusée" });
    if (p.cancelled_at) e.push({ at: p.cancelled_at, label: "Annulée" });
    if (status === "expired" && p.expires_at) e.push({ at: p.expires_at, label: "Expirée" });
    return e.sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [p, status]);

  const run = async () => {
    setActing(true);
    try {
      let msg = "";
      if (confirm === "accept") {
        const r = await api.post(`/proposals/${p.id}/accept`);
        msg = "Proposition acceptée — en attente de l'accord du salarié";
        if (r.data?.proposal) setP((old) => ({ ...old, ...r.data.proposal, mission: r.data.mission }));
      } else if (confirm === "decline") {
        await api.post(`/proposals/${p.id}/decline`);
        msg = "Proposition refusée";
      } else if (confirm === "cancel") {
        await api.post(`/proposals/${p.id}/cancel`);
        msg = "Proposition annulée";
      } else if (confirm === "submit") {
        await api.post(`/proposals/${p.id}/submit`);
        msg = "Proposition envoyée";
      }
      setConfirm(null);
      show(msg, "success");
      await refresh();
    } catch (e) {
      show(apiError(e), "error");
      setConfirm(null);
    } finally {
      setActing(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/proposals/${p.id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refresh();
      show("Document ajouté avec succès", "success");
    } catch (e) {
      show(apiError(e), "error");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (d) => {
    try {
      await api.delete(`/proposals/${p.id}/documents/${d.id}`);
      await refresh();
      show("Document supprimé", "success");
    } catch (e) {
      show(apiError(e), "error");
    }
  };

  if (myCompanyIds === null) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin text-[#16B8B1]" size={30} />
        </div>
      </AppShell>
    );
  }

  const confirmCfg = {
    accept: { title: "Accepter la proposition ?", text: "Une mission sera créée et le salarié devra confirmer sa participation.", btn: btnPrimary, ok: "Accepter" },
    decline: { title: "Refuser la proposition ?", text: "L'entreprise sera prévenue. Cette action est définitive.", btn: btnDanger, ok: "Refuser" },
    cancel: { title: "Annuler la proposition ?", text: "Le destinataire ne pourra plus y répondre.", btn: btnDanger, ok: "Annuler la proposition" },
    submit: { title: "Envoyer la proposition ?", text: "Le destinataire sera notifié et pourra répondre jusqu'à la date limite.", btn: btnPrimary, ok: "Envoyer" },
  }[confirm];

  const backTab = isSender ? "sent" : "received";

  return (
    <AppShell>
      <main className="px-3 pb-12 pt-5 font-['Plus_Jakarta_Sans',sans-serif] sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Link to={`/collaborations?tab=${backTab}`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#16B8B1] dark:text-slate-400">
              <ArrowLeft size={15} /> Collaborations · Propositions
            </Link>
            <button type="button" onClick={handleRefresh} disabled={refreshing} className={btnGhost}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>

          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl bg-[#0B1F33] p-6 text-white shadow-xl shadow-[#0B1F33]/20 sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#16B8B1]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#16B8B1]/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar name={talent.name} path={p.profile?.avatar_path} size={60} className="!rounded-2xl" />
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 ring-1 ring-white/10">Proposition #{p.id}</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/20">
                      <span className={`h-2 w-2 rounded-full ${TONES[statusCfg.tone]?.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <h1 className="truncate text-2xl font-extrabold tracking-tight">{talent.name || "Salarié"}</h1>
                  <p className="mt-1 truncate text-sm text-white/65">{title}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/55">
                    <Building2 size={13} />
                    {isSender ? "Envoyée à" : "Reçue de"}
                    <span className="font-semibold text-white">{other?.name || "—"}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:max-w-[380px] lg:justify-end">
                {isRecipient && pending && (
                  <>
                    <button onClick={() => setConfirm("accept")} className={heroPrimary}><Check size={15} /> Accepter</button>
                    <button onClick={() => setConfirm("decline")} className={heroGhost}><X size={15} /> Refuser</button>
                  </>
                )}

                {isSender && p.status === "draft" && (
                  <>
                    <button onClick={() => setConfirm("submit")} className={heroPrimary}><Send size={14} /> Envoyer</button>
                    {p.resource_offer_id && (
                      <button onClick={() => setEditing(true)} className={heroGhost}><Edit3 size={14} /> Modifier</button>
                    )}
                  </>
                )}

                {isSender && ["draft", "sent", "viewed"].includes(p.status) && status !== "expired" && (
                  <button onClick={() => setConfirm("cancel")} className={heroGhost}><Ban size={14} /> Annuler</button>
                )}

                {p.mission?.id && (
                  <Link to={`/missions/${p.mission.id}`} className={heroPrimary}><Briefcase size={14} /> Voir la mission</Link>
                )}

                {offer.id && (
                  <Link to={`/resource-offers/${offer.id}`} className={heroGhost}>Voir l'offre <ChevronRight size={14} /></Link>
                )}

                {!isSender && !isRecipient && <span className="text-xs text-white/50">Lecture seule</span>}
              </div>
            </div>
          </section>

          {/* Suivi */}
          <section className={`${card} overflow-x-auto px-5 py-5 sm:px-6`}>
            <div className="min-w-[480px]">
              <Stepper status={status} />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              <Panel icon={CalendarDays} title="Conditions de la mission" detail="Période, durée et modalités prévues">
                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                  <Fact icon={CalendarDays} label="Période">
                    <span className="block">{fmt(p.start_at)}</span>
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">au {fmt(p.end_at)}</span>
                  </Fact>
                  <Fact icon={Clock3} label="Durée">{durationText(p.start_at, p.end_at) || "—"}</Fact>
                  <Fact icon={Users} label="Charge">
                    {p.workload_percent || 100}%
                    {p.remote && <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">À distance</span>}
                  </Fact>
                  <Fact icon={Timer} label="Réponse avant le">
                    {p.expires_at ? fmt(p.expires_at) : "—"}
                    {pending && p.days_until_expiry != null && (
                      <span className={`block text-xs font-medium ${p.days_until_expiry <= 3 ? "text-amber-600" : "text-slate-400"}`}>({p.days_until_expiry} j)</span>
                    )}
                  </Fact>
                </div>
              </Panel>

              <Panel icon={FileText} title="Détails de la proposition" detail="Contexte et conditions communiqués">
                {p.description ? (
                  <TextBlock label="Contexte du besoin" text={p.description} />
                ) : (
                  <p className="px-5 py-5 text-sm text-slate-400">Aucun contexte renseigné.</p>
                )}
                {p.message && <div className="border-t border-slate-100 dark:border-white/10"><TextBlock label="Message" text={p.message} /></div>}
                {p.conditions && <div className="border-t border-slate-100 dark:border-white/10"><TextBlock label="Conditions" text={p.conditions} /></div>}
              </Panel>

              <Panel
                icon={Paperclip}
                title="Documents joints"
                detail={`${p.documents?.length || 0} document(s)`}
                action={
                  canEditDocs && (
                    <>
                      <button onClick={() => fileRef.current?.click()} disabled={uploading} className={btnGhost}>
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />} Ajouter
                      </button>
                      <input ref={fileRef} type="file" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = ""; }} />
                    </>
                  )
                }
              >
                {!p.documents?.length ? (
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5">
                      <FileText size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Aucun document joint</p>
                    <p className="mt-1 text-xs text-slate-400">Les documents associés apparaîtront ici.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/10">
                    {p.documents.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-teal-700 dark:text-[#16B8B1]">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <a href={`/storage/${d.file_path}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-slate-700 hover:text-teal-700 hover:underline dark:text-slate-200">
                            {d.original_name || d.name || d.file_path.split("/").pop()}
                          </a>
                          {d.uploader?.name && <p className="mt-0.5 text-[11px] text-slate-400">{d.uploader.name}</p>}
                        </div>
                        {canEditDocs && (
                          <button onClick={() => removeDoc(d)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="Supprimer le document">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <aside className="min-w-0 space-y-5">
              <Panel icon={Users} title="Salarié" detail="Profil du talent">
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={talent.name} path={p.profile?.avatar_path} size={48} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{talent.name || "Salarié"}</p>
                      {p.profile?.headline && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{p.profile.headline}</p>}
                    </div>
                  </div>
                  {offer.mission_type && (
                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type de mission</p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{MISSION_TYPES[offer.mission_type]}</p>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel icon={Building2} title="Entreprise">
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {otherIsLender ? "Entreprise prêteuse" : "Entreprise demandeuse"}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={other?.name} path={other?.logo_path} size={44} className="!bg-[#0B1F33] !text-white" />
                    <p className="break-words text-sm font-bold text-[#0B1F33] dark:text-white">{other?.name || "—"}</p>
                  </div>
                </div>
              </Panel>

              <Panel icon={History} title="Historique" detail="Activité de la proposition">
                {events.length === 0 ? (
                  <p className="px-5 py-5 text-sm text-slate-400">Aucun événement enregistré.</p>
                ) : (
                  <ol className="relative m-5 ml-7 space-y-4 border-l border-slate-200 pl-5 dark:border-white/10">
                    {events.map((e, i) => (
                      <li key={i} className="relative">
                        <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-[#131E47] ${i === events.length - 1 ? "bg-[#16B8B1]" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{e.label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(e.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </aside>
          </div>
        </div>
      </main>

      {editing && offer.id && (
        <ProposalFormModal
          offer={{ ...offer, company: offer.company }}
          proposal={p}
          onClose={() => setEditing(false)}
          onSaved={async (msg) => {
            setEditing(false);
            show(msg, "success");
            await refresh();
          }}
        />
      )}

      {confirm && confirmCfg && (
        <Modal
          title={confirmCfg.title}
          subtitle={other?.name}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button onClick={run} disabled={acting} className={`${confirmCfg.btn} flex-1`}>
                {acting && <Loader2 size={14} className="animate-spin" />}
                {confirmCfg.ok}
              </button>
              <button onClick={() => setConfirm(null)} className={btnGhost}>Retour</button>
            </>
          }
        >
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{confirmCfg.text}</p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </AppShell>
  );
}