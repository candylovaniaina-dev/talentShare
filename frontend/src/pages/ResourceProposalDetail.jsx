
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Building2, FileText, Paperclip, Trash2, Check, X,
  Send, Edit3, Loader2, Briefcase, Ban, CalendarDays, Clock3,
  Users, RefreshCw, History, ChevronRight
} from "lucide-react";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import {
  PageLayout, Modal, Avatar, StatusBadge, Spinner, PROPOSAL_STATUS,
  MISSION_TYPES, fmtDate, durationLabel, apiError, cardCls,
  btnPrimary, btnGhost, btnDanger,
} from "../components/resource-sharing/shared";

const STEPS = ["Brouillon", "Envoyée", "Consultée", "Réponse"];
const ORDER = { draft: 0, sent: 1, viewed: 2 };
const FINAL = ["accepted", "declined", "expired", "cancelled"];

const FINAL_DOT = {
  accepted: "bg-emerald-500",
  declined: "bg-rose-500",
  expired: "bg-amber-500",
  cancelled: "bg-slate-400",
};

function Stepper({ status }) {
  const isFinal = FINAL.includes(status);
  const idx = isFinal ? 3 : ORDER[status] ?? 0;

  return (
    <ol className="flex items-center">
      {STEPS.map((label, i) => {
        const reached = i <= idx;
        const dot =
          i === 3 && isFinal
            ? FINAL_DOT[status]
            : reached
              ? "bg-emerald-500"
              : "bg-slate-200 dark:bg-slate-700";

        const text =
          i === 3 && isFinal
            ? PROPOSAL_STATUS[status]?.label || label
            : label;

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${dot} ${
                  i === idx ? "ring-4 ring-emerald-500/15" : ""
                }`}
              />
              <span
                className={`text-sm ${
                  i === idx
                    ? "font-semibold text-slate-900 dark:text-white"
                    : reached
                      ? "text-slate-600 dark:text-slate-300"
                      : "text-slate-400"
                }`}
              >
                {text}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <span
                className={`mx-3 h-px flex-1 ${
                  i < idx
                    ? "bg-emerald-400"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const Label = ({ children }) => (
  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
    {children}
  </p>
);

function Fact({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-slate-400">
        {Icon && <Icon size={14} />}
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="text-base font-medium text-slate-900 dark:text-white">
        {children}
      </p>
    </div>
  );
}

function TextBlock({ label, text }) {
  if (!text) return null;

  return (
    <div className="px-6 py-5">
      <Label>{label}</Label>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
        {text}
      </p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        {detail && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {detail}
          </p>
        )}
      </div>
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
      .then((r) =>
        setMyCompanyIds(
          (Array.isArray(r.data) ? r.data : r.data?.data || [])
            .map((c) => Number(c.id))
        )
      )
      .catch(() => setMyCompanyIds([]));
  }, []);

  const refresh = async () => {
    try {
      const r = await api.get(`/proposals/${p.id}`);
      setP(r.data);
    } catch {
      // Conserver les informations actuelles en cas d'erreur.
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const status = p.display_status || p.status;
  const isSender = myCompanyIds?.includes(Number(p.proposed_by_company_id));
  const isRecipient = myCompanyIds?.includes(Number(p.to_company_id));

  const offer = p.resource_offer || {};
  const talent = p.profile?.user || {};
  const other = isSender ? p.to_company : p.proposing_company;

  const pending = ["sent", "viewed"].includes(status);

  const otherIsLender =
    (isSender && !!p.resource_offer_id) ||
    (!isSender && !p.resource_offer_id);

  const title =
    offer.title || p.resource_request?.title || "Proposition directe";

  const canEditDocs = isSender && ["draft", "sent"].includes(p.status);

  const events = useMemo(() => {
    const e = [];

    if (p.created_at) e.push({ at: p.created_at, label: "Brouillon créé" });
    if (p.sent_at) e.push({ at: p.sent_at, label: "Envoyée" });
    if (p.viewed_at) e.push({ at: p.viewed_at, label: "Consultée" });

    if (p.responded_at) {
      e.push({
        at: p.responded_at,
        label: p.status === "accepted" ? "Acceptée" : "Refusée",
      });
    }

    if (p.cancelled_at) e.push({ at: p.cancelled_at, label: "Annulée" });

    if (status === "expired" && p.expires_at) {
      e.push({ at: p.expires_at, label: "Expirée" });
    }

    return e.sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [p, status]);

  const run = async () => {
    setActing(true);

    try {
      let msg = "";

      if (confirm === "accept") {
        const r = await api.post(`/proposals/${p.id}/accept`);
        msg = "Proposition acceptée — en attente de l'accord du salarié";

        if (r.data?.proposal) {
          setP((old) => ({
            ...old,
            ...r.data.proposal,
            mission: r.data.mission,
          }));
        }
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

      await api.post(`/proposals/${p.id}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
    return <PageLayout><Spinner /></PageLayout>;
  }

  const confirmCfg = {
    accept: {
      title: "Accepter la proposition ?",
      text: "Une mission sera créée et le salarié devra confirmer sa participation.",
      btn: btnPrimary,
      ok: "Accepter",
    },
    decline: {
      title: "Refuser la proposition ?",
      text: "L'entreprise sera prévenue. Cette action est définitive.",
      btn: btnDanger,
      ok: "Refuser",
    },
    cancel: {
      title: "Annuler la proposition ?",
      text: "Le destinataire ne pourra plus y répondre.",
      btn: btnDanger,
      ok: "Annuler la proposition",
    },
    submit: {
      title: "Envoyer la proposition ?",
      text: "Le destinataire sera notifié et pourra répondre jusqu'à la date limite.",
      btn: btnPrimary,
      ok: "Envoyer",
    },
  }[confirm];

  return (
    <PageLayout>
      <main className="px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px] space-y-6">

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/resource-proposals"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              Propositions
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>

          {/* En-tête compact */}
          <section className={`${cardCls} p-5 sm:p-6`}>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar
                  name={talent.name}
                  path={p.profile?.avatar_path}
                  size={54}
                />

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Détail de proposition
                    </span>
                    <StatusBadge map={PROPOSAL_STATUS} status={status} />
                  </div>

                  <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {talent.name || "Salarié"}
                  </h1>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {title}
                  </p>

                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Building2 size={14} />
                    {isSender ? "Envoyée à" : "Reçue de"}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {other?.name || "—"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isRecipient && pending && (
                  <>
                    <button onClick={() => setConfirm("accept")} className={btnPrimary}>
                      <Check size={15} /> Accepter
                    </button>
                    <button onClick={() => setConfirm("decline")} className={btnDanger}>
                      <X size={15} /> Refuser
                    </button>
                  </>
                )}

                {isSender && p.status === "draft" && (
                  <>
                    <button onClick={() => setConfirm("submit")} className={btnPrimary}>
                      <Send size={14} /> Envoyer
                    </button>

                    {p.resource_offer_id && (
                      <button onClick={() => setEditing(true)} className={btnGhost}>
                        <Edit3 size={14} /> Modifier
                      </button>
                    )}
                  </>
                )}

                {isSender &&
                  ["draft", "sent", "viewed"].includes(p.status) &&
                  status !== "expired" && (
                    <button onClick={() => setConfirm("cancel")} className={btnGhost}>
                      <Ban size={14} /> Annuler
                    </button>
                  )}

                {p.mission?.id && (
                  <Link to={`/missions/${p.mission.id}`} className={btnGhost}>
                    <Briefcase size={14} /> Voir la mission
                  </Link>
                )}

                {offer.id && (
                  <Link to={`/resource-offers/${offer.id}`} className={btnGhost}>
                    Voir l'offre <ChevronRight size={14} />
                  </Link>
                )}

                {!isSender && !isRecipient && (
                  <span className="text-sm text-slate-400">Lecture seule</span>
                )}
              </div>
            </div>
          </section>

          {/* Progression */}
          <section className={`${cardCls} px-5 py-5 sm:px-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <History size={17} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Suivi de la proposition
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Progression et état actuel
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="min-w-[480px]">
                <Stepper status={status} />
              </div>
            </div>
          </section>

          {/* Corps de page */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

            {/* Colonne principale */}
            <div className="min-w-0 space-y-6">

              {/* Conditions */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={CalendarDays}
                    title="Conditions de la mission"
                    detail="Période, durée et modalités prévues"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
                  <Fact icon={CalendarDays} label="Période">
                    <span className="block">{fmtDate(p.start_at)}</span>
                    <span className="block text-sm font-normal text-slate-500 dark:text-slate-400">
                      au {fmtDate(p.end_at)}
                    </span>
                  </Fact>

                  <Fact icon={Clock3} label="Durée">
                    {durationLabel(p.start_at, p.end_at) || "—"}
                  </Fact>

                  <Fact icon={Users} label="Charge">
                    {p.workload_percent || 100}%
                    {p.remote && (
                      <span className="block text-sm font-normal text-slate-500 dark:text-slate-400">
                        À distance
                      </span>
                    )}
                  </Fact>

                  <Fact icon={CalendarDays} label="Réponse avant le">
                    {p.expires_at ? fmtDate(p.expires_at) : "—"}
                    {pending && p.days_until_expiry != null && (
                      <span className="block text-sm font-normal text-slate-400">
                        ({p.days_until_expiry} j)
                      </span>
                    )}
                  </Fact>
                </div>
              </section>

              {/* Description */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={FileText}
                    title="Détails de la proposition"
                    detail="Contexte et conditions communiqués"
                  />
                </div>

                {p.description ? (
                  <TextBlock label="Contexte du besoin" text={p.description} />
                ) : (
                  <p className="px-6 py-5 text-sm text-slate-400">
                    Aucun contexte renseigné.
                  </p>
                )}

                {p.message && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <TextBlock label="Message" text={p.message} />
                  </div>
                )}

                {p.conditions && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <TextBlock label="Conditions" text={p.conditions} />
                  </div>
                )}
              </section>

              {/* Documents */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={Paperclip}
                    title="Documents joints"
                    detail={`${p.documents?.length || 0} document(s)`}
                  />

                  {canEditDocs && (
                    <>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                      >
                        {uploading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Paperclip size={15} />
                        )}
                        Ajouter
                      </button>

                      <input
                        ref={fileRef}
                        type="file"
                        hidden
                        onChange={(e) => {
                          upload(e.target.files[0]);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>

                {!p.documents?.length ? (
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800">
                      <FileText size={24} />
                    </div>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                      Aucun document joint
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Les documents associés apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {p.documents.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 px-6 py-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <FileText size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <a
                            href={`/storage/${d.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm font-medium text-slate-700 hover:text-emerald-700 hover:underline dark:text-slate-200"
                          >
                            {d.original_name || d.name || d.file_path.split("/").pop()}
                          </a>

                          {d.uploader?.name && (
                            <p className="mt-1 text-xs text-slate-400">
                              {d.uploader.name}
                            </p>
                          )}
                        </div>

                        {canEditDocs && (
                          <button
                            onClick={() => removeDoc(d)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                            title="Supprimer le document"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Colonne latérale */}
            <aside className="min-w-0 space-y-6">

              {/* Salarié */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={Users}
                    title="Salarié"
                    detail="Profil du talent"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={talent.name}
                      path={p.profile?.avatar_path}
                      size={48}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                        {talent.name || "Salarié"}
                      </p>
                      {p.profile?.headline && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {p.profile.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {offer.mission_type && (
                    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <Label>Type de mission</Label>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {MISSION_TYPES[offer.mission_type]}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Entreprise */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={Building2}
                    title="Entreprise"
                  />
                </div>

                <div className="p-5">
                  <Label>
                    {otherIsLender ? "Entreprise prêteuse" : "Entreprise demandeuse"}
                  </Label>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                      {other?.logo_path ? (
                        <img
                          src={`/storage/${other.logo_path}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 size={19} />
                      )}
                    </div>

                    <p className="break-words text-base font-medium text-slate-900 dark:text-white">
                      {other?.name || "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Historique */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                  <SectionHeading
                    icon={History}
                    title="Historique"
                    detail="Activité de la proposition"
                  />
                </div>

                {events.length === 0 ? (
                  <p className="px-5 py-5 text-sm text-slate-400">
                    Aucun événement enregistré.
                  </p>
                ) : (
                  <ol className="relative space-y-4 border-l border-slate-200 py-1 pl-5 ml-6 my-5 dark:border-slate-700">
                    {events.map((e, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white dark:bg-slate-600 dark:ring-slate-900" />
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {e.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(e.at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* Modal de modification */}
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

      {/* Modal de confirmation */}
      {confirm && confirmCfg && (
        <Modal
          title={confirmCfg.title}
          subtitle={other?.name}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button
                onClick={run}
                disabled={acting}
                className={`${confirmCfg.btn} flex-1`}
              >
                {acting && <Loader2 size={14} className="animate-spin" />}
                {confirmCfg.ok}
              </button>

              <button
                onClick={() => setConfirm(null)}
                className={btnGhost}
              >
                Retour
              </button>
            </>
          }
        >
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {confirmCfg.text}
          </p>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={close}
        />
      )}
    </PageLayout>
  );
}
