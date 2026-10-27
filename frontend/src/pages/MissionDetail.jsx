import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, CalendarDays, Check, CheckCircle,
  Clock3, FileText, Flag, Loader2, MessageSquare, Play,
  UserRound, X, FolderOpen, Download, ShieldCheck, CircleCheck,
  RefreshCw, FileSignature, ChevronRight, AlertCircle,
  BriefcaseBusiness, CalendarCheck2, ArrowUpRight, Users,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import DocumentUploader from "../components/documents/DocumentUploader";
import DocumentList from "../components/documents/DocumentList";

const STATUS_CONFIG = {
  pending_employee: { label: "En attente", tone: "amber", description: "En attente de la réponse du talent" },
  trial: { label: "Période d'essai", tone: "violet", description: "Période d'essai en cours avant confirmation en CDI" },
  planned: { label: "Planifiée", tone: "blue", description: "La mission est prête à démarrer" },
  active: { label: "En cours", tone: "teal", description: "La mission est actuellement en cours" },
  completed: { label: "Terminée", tone: "slate", description: "Cette mission est terminée" },
  cancelled: { label: "Annulée", tone: "rose", description: "Cette mission a été annulée" },
};

const STATUS_STYLES = {
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
  teal: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  slate: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
  violet: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
};

const TABS = [
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "details", label: "Détails", Icon: Building2 },
  { id: "exchanges", label: "Échanges", Icon: MessageSquare },
  { id: "history", label: "Historique", Icon: Clock3 },
];

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "À définir";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "À définir" : date.toLocaleDateString("fr-FR", options);
}

function computeTimeline(mission) {
  if (!mission?.start_at || !mission?.end_at) return null;
  const now = new Date();
  const start = new Date(mission.start_at);
  const end = new Date(mission.end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const totalMs = end - start;
  const remainingMs = end - now;
  const elapsedMs = now - start;
  const days = (ms) => Math.ceil(ms / 86400000);

  return {
    percent: totalMs > 0 ? Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100))) : 0,
    remainingDays: Math.max(0, days(remainingMs)),
    daysUntilStart: Math.max(0, days(start - now)),
    notStarted: now < start,
    finished: now > end,
  };
}

function getMissionTitle(mission) {
  return (
    mission?.resource_offer?.title ||
    mission?.proposal?.resource_request?.title ||
    mission?.resource_request?.title ||
    `Mission de ${mission?.profile?.user?.name || "Talent"}`
  );
}

function isEmploymentMission(mission, proposal) {
  return (
    mission?.proposal?.contract_kind === "job" ||
    proposal?.contract_kind === "job" ||
    Boolean(mission?.is_trial) ||
    mission?.status === "trial"
  );
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#0D2030]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {subtext && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</p>}
      </div>
    </div>
  );
}

function StudentDocumentView({ documentableId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadDocuments() {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get("/documents", {
          params: {
            documentable_type: "App\\Models\\Proposal",
            documentable_id: documentableId,
          },
        });
        const result = res.data?.data ?? res.data;
        if (!cancelled) setDocs(Array.isArray(result) ? result : []);
      } catch {
        if (!cancelled) {
          setError(true);
          setDocs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!documentableId) {
      setDocs([]);
      setLoading(false);
      setError(false);
    } else {
      loadDocuments();
    }
    return () => { cancelled = true; };
  }, [documentableId, retryKey]);

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0B1D2C]">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des documents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle size={19} className="mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Impossible de charger les documents</p>
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">Vérifiez votre connexion puis réessayez.</p>
            <button type="button" onClick={() => setRetryKey((v) => v + 1)} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-rose-700 underline dark:text-rose-300">
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center dark:border-slate-700 dark:bg-[#0B1D2C]">
        <FolderOpen size={30} className="mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Aucun document disponible</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Les documents associés à cette proposition apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const isSigned = doc.is_signed || doc.status === "signed";
        return (
          <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 dark:border-slate-800 dark:bg-[#0B1D2C] dark:hover:border-emerald-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${isSigned ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {isSigned ? <ShieldCheck size={22} /> : <FileText size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{doc.original_name || `Document #${doc.id}`}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doc.formatted_size || "—"} · {isSigned ? "Signé" : "Disponible"}</p>
                </div>
              </div>
              <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B253B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#143B55] dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
                <Download size={14} /> Télécharger <ArrowUpRight size={13} />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function MissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mission, setMission] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");
  const [docsRefresh, setDocsRefresh] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/missions/${id}`);
      const missionData = res.data?.data || res.data || null;
      setMission(missionData);
      setProposal(null);
      if (missionData?.proposal_id) {
        const propRes = await api.get(`/proposals/${missionData.proposal_id}`).catch(() => null);
        if (propRes) setProposal(propRes.data?.data || propRes.data);
      }
    } catch (err) {
      setMission(null);
      showToast(err.response?.data?.message || "Mission introuvable", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === "accept") await api.post(`/missions/${id}/accept`);
      if (action === "decline") await api.post(`/missions/${id}/decline`);
      if (action === "active") await api.patch(`/missions/${id}/status`, { status: "active" });
      if (action === "completed") await api.patch(`/missions/${id}/status`, { status: "completed" });
      showToast("Action effectuée", "success");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const validateTrial = async () => {
    if (!window.confirm("Confirmer le talent ? Il passera en CDI (sans date de fin) et sera ajouté à vos salariés.")) return;
    setActionLoading(true);
    try {
      await api.post(`/missions/${id}/validate-trial`);
      showToast("Période d'essai validée : le talent est maintenant salarié en CDI.", "success");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la validation", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectTrial = async () => {
    if (!window.confirm("Ne pas confirmer le talent ? La collaboration prendra fin.")) return;
    setActionLoading(true);
    try {
      await api.post(`/missions/${id}/reject-trial`);
      showToast("La période d'essai n'a pas été confirmée.", "info");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const myProfileId = user?.professional_profile?.id || user?.professionalProfile?.id || user?.professional_profile_id;
  const myCompanyIds = (user?.companies || []).map((company) => Number(company.id));

  const isEmployee = Boolean(myProfileId) && Number(mission?.professional_profile_id) === Number(myProfileId);
  const isSupplying = myCompanyIds.includes(Number(mission?.supplying_company_id));
  const isRequesting = myCompanyIds.includes(Number(mission?.requesting_company_id));
  const isCompany = isSupplying || isRequesting;

  const isEmployment = isEmploymentMission(mission, proposal);
  const isTrial = mission?.status === "trial";

  const status = (() => {
    const base = STATUS_CONFIG[mission?.status] || STATUS_CONFIG.planned;
    if (isEmployment && mission?.status === "active") {
      return { ...base, label: "CDI en cours", description: "Le talent est salarié de l'entreprise en CDI" };
    }
    return base;
  })();

  const timeline = useMemo(() => computeTimeline(mission), [mission]);
  const title = getMissionTitle(mission);
  const employeeName = mission?.profile?.user?.name || "Salarié à confirmer";
  const requesterName = mission?.requesting_company?.name || "Entreprise non renseignée";
  const supplierName = mission?.supplying_company?.name || "Recrutement direct";

  const criteria = parseList(mission?.resource_offer?.criteria || mission?.proposal?.resource_request?.skills || mission?.criteria);
  const objective = mission?.resource_offer?.description || mission?.proposal?.resource_request?.description || mission?.description || "Aucune description détaillée.";

  const nextStep = (() => {
    if (mission?.status === "trial") return isCompany ? "Confirmer ou non le talent à la fin de l'essai" : "Période d'essai en cours";
    if (mission?.status === "pending_employee") return isEmployee ? "Répondre à la proposition" : `En attente de ${employeeName}`;
    if (mission?.status === "planned") return isSupplying ? "Démarrer la mission" : "Préparer le démarrage";
    if (mission?.status === "active") return "Mettre à jour la progression";
    if (mission?.status === "completed") return "Mission terminée";
    return "Consulter les informations";
  })();

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F4F7FA] dark:bg-transparent">
          <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={30} />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chargement de la mission…</p>
        </div>
      </AppShell>
    );
  }

  if (!mission) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FA] px-4 py-20 text-center dark:bg-transparent">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-[#0D2030]">
            <BriefcaseBusiness size={26} />
          </div>
          <h1 className="mt-5 text-xl font-extrabold text-[#0B253B] dark:text-white">Mission introuvable</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Cette mission est indisponible ou vous n’y avez pas accès.</p>
          <Link to="/missions" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B253B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143B55] dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
            <ArrowLeft size={16} /> Retour aux missions
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ✅ dark:bg-transparent pour prendre la couleur du parent (AppShell) sans décalage */}
      <main className="min-h-screen bg-[#F4F7FA] px-3 pb-10 pt-5 transition-colors duration-300 dark:bg-transparent sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1350px]">
          <div className="mb-5">
            <Link to="/missions" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
              <ArrowLeft size={15} /> Toutes mes missions
            </Link>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D2030] sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[status.tone]}`}>
                      <CircleCheck size={12} /> {status.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <BriefcaseBusiness size={12} /> {isEmployment ? "Emploi · CDI" : "Mission professionnelle"}
                    </span>
                  </div>
                  <h1 className="break-words text-xl font-extrabold tracking-tight text-[#0B253B] dark:text-white sm:text-2xl">{title}</h1>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{status.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2"><UserRound size={15} className="text-emerald-600 dark:text-emerald-400" />{employeeName}</span>
                    <span className="inline-flex items-center gap-2"><Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />{requesterName}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-emerald-600 dark:text-emerald-400" />{mission.workload_percent ?? 100}% du temps</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[310px] xl:justify-end">
                  {isEmployee && mission.status === "pending_employee" && (
                    <>
                      <button type="button" onClick={() => doAction("accept")} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
                        {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Accepter
                      </button>
                      <button type="button" onClick={() => doAction("decline")} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                        <X size={14} /> Refuser
                      </button>
                    </>
                  )}

                  {isCompany && mission.status === "planned" && (
                    <button type="button" onClick={() => doAction("active")} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
                      {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Démarrer la mission
                    </button>
                  )}

                  {isCompany && mission.status === "active" && (
                    <button type="button" onClick={() => doAction("completed")} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/60">
                      {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />} {isEmployment ? "Mettre fin au contrat" : "Terminer la mission"}
                    </button>
                  )}

                  {isCompany && isTrial && (
                    <>
                      <button type="button" onClick={validateTrial} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-60">
                        {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Confirmer en CDI
                      </button>
                      <button type="button" onClick={rejectTrial} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/50 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/30">
                        <X size={14} /> Ne pas confirmer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={UserRound} label="Talent mobilisé" value={employeeName} subtext="Professionnel concerné" />
            <InfoCard icon={Building2} label="Entreprise demandeuse" value={requesterName} subtext="Bénéficiaire de la mission" />
            <InfoCard icon={Users} label="Entreprise fournisseuse" value={supplierName} subtext="Organisation mobilisatrice" />
            <InfoCard
              icon={CalendarDays}
              label={isEmployment ? "Début du contrat" : "Période prévue"}
              value={
                mission.start_at
                  ? mission.end_at
                    ? `${formatDate(mission.start_at, { day: "2-digit", month: "short" })} – ${formatDate(mission.end_at, { day: "2-digit", month: "short" })}`
                    : `Depuis le ${formatDate(mission.start_at)}`
                  : "À définir"
              }
              subtext={isEmployment ? (isTrial ? `Essai jusqu'au ${formatDate(mission.trial_ends_at)}` : "Contrat à durée indéterminée") : `${mission.workload_percent ?? 100}% du temps`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-5">
              {isTrial && (
                <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900/50 dark:bg-violet-950/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-violet-900 dark:text-violet-200">Période d'essai en cours {mission.trial_ends_at && ` · jusqu'au ${formatDate(mission.trial_ends_at)}`}</h2>
                      <p className="mt-1 text-xs leading-5 text-violet-800 dark:text-violet-300">
                        {isCompany ? "À l'issue de l'essai, confirmez le talent pour le passer en CDI et l'ajouter à vos salariés, ou mettez fin à la collaboration." : "Si l'entreprise vous confirme à la fin de l'essai, vous devenez salarié en CDI."}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {timeline && ["planned", "active"].includes(mission.status) && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D2030] sm:p-6">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle size={19} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Progression de la mission</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Suivi de la période prévue</p>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Clock3 size={13} /> {timeline.notStarted ? `${timeline.daysUntilStart} jours avant le début` : timeline.finished ? "Période échue" : `${timeline.remainingDays} jours restants`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700" style={{ width: `${Math.max(timeline.percent, timeline.percent === 0 ? 2 : 0)}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    <span>{formatDate(mission.start_at)}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{timeline.percent}% écoulé</span>
                    <span>{formatDate(mission.end_at)}</span>
                  </div>
                </section>
              )}

              {proposal && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                  <SectionHeading icon={FileSignature} title="Résumé de la proposition" subtitle="Conditions et informations transmises par le talent." />
                  <div className="space-y-5 p-5 sm:p-6">
                    {proposal.message && (
                      <div>
                        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lettre de motivation / Message</h3>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#091A28]">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{proposal.message}</p>
                        </div>
                      </div>
                    )}
                    {proposal.conditions && (
                      <div>
                        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Conditions</h3>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{proposal.conditions}</p>
                      </div>
                    )}
                    <div className="grid gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Début proposé</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">{formatDate(proposal.start_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fin proposée</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">{formatDate(proposal.end_at)}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                <div className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex overflow-x-auto px-2 sm:px-3">
                    {TABS.map(({ id: tabId, label, Icon }) => {
                      const selected = activeTab === tabId;
                      return (
                        <button key={tabId} type="button" onClick={() => setActiveTab(tabId)} className={`relative inline-flex shrink-0 items-center gap-2 px-4 py-4 text-xs font-bold transition ${selected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}>
                          <Icon size={15} /> {label}
                          {selected && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTab === "documents" && (
                  <div className="p-4 sm:p-6">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Documents de la mission</h2>
                        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Retrouvez les contrats et pièces justificatives associés à cette mission.</p>
                      </div>
                      {!isEmployee && mission.proposal_id && (
                        <button type="button" onClick={() => setShowUploadModal(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
                          <FolderOpen size={15} /> Ajouter un document
                        </button>
                      )}
                    </div>
                    {isEmployee ? (
                      <StudentDocumentView documentableId={mission.proposal_id} />
                    ) : mission.proposal_id ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B1D2C]">
                        <div className="p-3 sm:p-4">
                          <DocumentList documentableType="App\\Models\\Proposal" documentableId={mission.proposal_id} refreshKey={docsRefresh} />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center dark:border-slate-700 dark:bg-[#0B1D2C]">
                        <FolderOpen size={30} className="mx-auto text-slate-400 dark:text-slate-500" />
                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">Aucun document associé</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Aucun document n’est rattaché à une proposition pour le moment.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-6 p-5 sm:p-6">
                    <div>
                      <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Objectif et description</h2>
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{objective}</p>
                    </div>
                    {criteria.length > 0 && (
                      <div>
                        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Compétences requises</h2>
                        <div className="flex flex-wrap gap-2">
                          {criteria.map((item, index) => (
                            <span key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {typeof item === "string" ? item : item.name || item.label || "Compétence"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Entreprise fournisseuse</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{supplierName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Entreprise demandeuse</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{requesterName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "exchanges" && (
                  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <MessageSquare size={24} />
                    </div>
                    <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Échanges autour de la mission</h2>
                    <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500 dark:text-slate-400">Retrouvez vos conversations et coordonnez les prochaines étapes de la mission.</p>
                    <Link to="/messages" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B253B] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#143B55] dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400">
                      Ouvrir la messagerie <ChevronRight size={15} />
                    </Link>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="p-5 sm:p-6">
                    <h2 className="mb-6 text-sm font-bold text-slate-900 dark:text-white">Historique de la mission</h2>
                    <div className="space-y-6 border-l-2 border-slate-100 pl-5 dark:border-slate-800">
                      <div className="relative">
                        <span className="absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0D2030]" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Mission créée</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(mission.created_at)}</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 ring-4 ring-white dark:bg-slate-600 dark:ring-[#0D2030]" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Statut actuel</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{status.label}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Flag size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prochaine étape</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Action recommandée</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xs font-bold leading-5 text-emerald-800 dark:text-emerald-300">{nextStep}</p>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                <SectionHeading icon={CalendarCheck2} title="Période de mission" subtitle="Dates prévisionnelles" />
                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <Play size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Début</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatDate(mission.start_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fin prévue</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{mission.end_at ? formatDate(mission.end_at) : "Sans date de fin (CDI)"}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                <SectionHeading icon={Users} title="Participants" subtitle="Organisations et talent" />
                <div className="space-y-5 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Talent</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-white">{employeeName}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Entreprise demandeuse</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-white">{requesterName}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Entreprise fournisseuse</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-white">{supplierName}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D2030]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Objectif de la mission</h2>
                    <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{objective}</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="upload-document-title" className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0D2030]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h3 id="upload-document-title" className="text-base font-bold text-slate-900 dark:text-white">Ajouter un document</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Joignez une pièce utile à la mission.</p>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setShowUploadModal(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6">
              <DocumentUploader documentableType="App\\Models\\Proposal" documentableId={mission.proposal_id} allowedTypes={["contract", "agreement", "invoice", "attachment"]} onUploaded={() => { setDocsRefresh((v) => v + 1); setShowUploadModal(false); }} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}