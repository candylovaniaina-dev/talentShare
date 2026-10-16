import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Check,
  X,
  Video,
  UserCheck,
  Eye,
  FileText,
  Download,
  ExternalLink,
  Building2,
  Users,
  Send,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Clock,
  StickyNote,
  MessageSquare,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import ScheduleInterviewModal from "../../components/ScheduleInterviewModal";
import api from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/ui/Toast";

const STATUS_CFG = {
  sent: {
    label: "Envoyée",
    icon: Send,
    color: "text-slate-300",
    bg: "bg-slate-500/10 border-slate-500/30",
    dot: "bg-slate-400",
  },
  viewed: {
    label: "Consultée",
    icon: Eye,
    color: "text-blue-300",
    bg: "bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-400",
  },
  shortlisted: {
    label: "Présélectionnée",
    icon: UserCheck,
    color: "text-violet-300",
    bg: "bg-violet-500/10 border-violet-500/30",
    dot: "bg-violet-400",
  },
  interview: {
    label: "Entretien",
    icon: Video,
    color: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Acceptée",
    icon: Check,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Refusée",
    icon: X,
    color: "text-rose-300",
    bg: "bg-rose-500/10 border-rose-500/30",
    dot: "bg-rose-400",
  },
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "sent", label: "Envoyées" },
  { key: "viewed", label: "Consultées" },
  { key: "shortlisted", label: "Présélectionnées" },
  { key: "interview", label: "Entretiens" },
  { key: "accepted", label: "Acceptées" },
  { key: "rejected", label: "Refusées" },
];

const STAT_ITEMS = [
  { key: "total", label: "Total", color: "text-white" },
  { key: "sent", label: "Envoyées", color: "text-slate-300" },
  { key: "viewed", label: "Consultées", color: "text-blue-300" },
  {
    key: "shortlisted",
    label: "Présélectionnées",
    color: "text-violet-300",
  },
  { key: "interview", label: "Entretiens", color: "text-amber-300" },
  { key: "accepted", label: "Acceptées", color: "text-emerald-300" },
];

const formatDate = (date, options = {}) => {
  if (!date) return "Date inconnue";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date inconnue";

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

const getInitial = (name) => {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
};

function StatusBadge({ status }) {
  const config = STATUS_CFG[status] || STATUS_CFG.sent;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.bg} ${config.color}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function StatCard({ item, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition hover:border-white/15 hover:bg-white/[0.06]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {item.label}
      </p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${item.color}`}>
        {Number(value || 0).toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

function ApplicationCard({ application, onClick }) {
  const user = application.profile?.user;
  const config = STATUS_CFG[application.status] || STATUS_CFG.sent;
  const Icon = config.icon;

  const fullName = user?.name || "Candidat";
  const headline = application.profile?.headline;
  const company = application.profile?.company_name;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-white/[0.08] bg-[#12364D] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[#142344] hover:shadow-lg hover:shadow-black/10 sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-lg font-bold text-emerald-300 transition group-hover:bg-emerald-400 group-hover:text-[#0B1F33]">
          {getInitial(fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-bold text-white transition group-hover:text-emerald-300">
              {fullName}
            </h3>
            <StatusBadge status={application.status} />
          </div>

          {headline && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">
              {headline}
            </p>
          )}

          {company && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 size={12} />
              {company}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDate(application.created_at, {
                year: undefined,
              })}
            </span>

            {application.portfolio && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={13} />
                Portfolio joint
              </span>
            )}

            {application.cv_path && (
              <span className="inline-flex items-center gap-1.5">
                <FileText size={13} />
                CV joint
              </span>
            )}
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] text-slate-500 transition group-hover:border-emerald-400/20 group-hover:bg-emerald-400/10 group-hover:text-emerald-300">
          <Icon size={17} className="hidden sm:block" />
          <ArrowLeft
            size={17}
            className="rotate-180 sm:hidden"
          />
        </div>
      </div>
    </button>
  );
}

function EmptyState({ filter, search }) {
  const searching = Boolean(search.trim());
  const filtered = filter !== "all";

  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
        {searching ? <Search size={27} /> : <Users size={27} />}
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        {searching
          ? "Aucun résultat trouvé"
          : filtered
            ? "Aucune candidature dans cette catégorie"
            : "Aucune candidature pour le moment"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {searching
          ? "Essaie un autre nom ou vérifie les termes de ta recherche."
          : filtered
            ? "Les candidatures correspondant à ce statut apparaîtront ici."
            : "Les candidatures reçues pour cette offre apparaîtront ici."}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <AppShell>
      <main className="min-h-screen bg-[#0B1F33] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-40 rounded-xl bg-white/5" />
          <div className="h-64 rounded-3xl border border-white/5 bg-[#12364D]" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STAT_ITEMS.map((item) => (
              <div
                key={item.key}
                className="h-24 rounded-2xl border border-white/5 bg-[#12364D]"
              />
            ))}
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-white/5 bg-[#12364D]"
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
            <Loader2 size={17} className="animate-spin" />
            Chargement des candidatures...
          </div>
        </div>
      </main>
    </AppShell>
  );
}

export default function OfferApplications() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { toast, show: showToast, close: closeToast } = useToast();

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get(`/job-offers/${id}/applications`);
        setData(res.data);
      } catch (err) {
        console.error("Erreur de chargement des candidatures :", err);
        showToast("Impossible de charger les candidatures", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, showToast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (applicationId, newStatus) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, {
        status: newStatus,
      });

      showToast("Statut mis à jour avec succès", "success");
      setSelected(null);
      await load(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Impossible de modifier le statut",
        "error"
      );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!data) {
    return (
      <AppShell>
        <main className="min-h-screen bg-[#0B1F33] px-4 py-10 text-white sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#12364D] p-8 text-center">
            <Users size={34} className="mx-auto text-slate-500" />
            <h1 className="mt-4 text-xl font-bold">
              Impossible de charger les candidatures
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Réessaie de charger les informations de cette offre.
            </p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#0B1F33] hover:bg-emerald-300"
            >
              <RefreshCw size={15} />
              Réessayer
            </button>
          </div>
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </AppShell>
    );
  }

  const offer = data.job_offer || {};
  const applications = Array.isArray(data.applications)
    ? data.applications
    : [];
  const stats = data.stats || {};

  const filtered = applications.filter((application) => {
    const matchesStatus =
      filter === "all" || application.status === filter;

    const name = application.profile?.user?.name || "";
    const headline = application.profile?.headline || "";
    const company = application.profile?.company_name || "";

    const matchesSearch = [name, headline, company]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell>
      <main className="min-h-screen bg-[#0B1F33] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/my-offers")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft size={16} />
              Retour à mes offres
            </button>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualiser
            </button>
          </div>

          {/* Header de l'offre */}
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#12364D] p-6 shadow-xl shadow-black/10 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/[0.08] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/[0.06] blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  <Users size={13} />
                  Recrutement
                </span>

                <span className="text-xs text-slate-500">
                  {applications.length} candidature(s) reçue(s)
                </span>
              </div>

              <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {offer.title || "Candidatures de l'offre"}
              </h1>

              {offer.company && (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                  <Building2 size={15} className="text-emerald-400" />
                  {offer.company.name}
                </p>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {STAT_ITEMS.map((item) => (
                  <StatCard
                    key={item.key}
                    item={item}
                    value={
                      stats[item.key] ??
                      (item.key === "total"
                        ? applications.length
                        : applications.filter(
                            (application) =>
                              application.status === item.key
                          ).length)
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Section candidatures */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Candidatures reçues
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Consulte les profils et mets à jour leur statut.
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un candidat..."
                  aria-label="Rechercher un candidat"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#12364D] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#12364D] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <SlidersHorizontal size={13} />
                Filtrer par statut
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => {
                  const count =
                    item.key === "all"
                      ? applications.length
                      : applications.filter(
                          (application) =>
                            application.status === item.key
                        ).length;

                  const active = filter === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? "border-emerald-400 bg-emerald-400 text-[#0B1F33]"
                          : "border-white/[0.08] bg-white/[0.025] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {item.label}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          active
                            ? "bg-black/10 text-[#0B1F33]"
                            : "bg-white/[0.06] text-slate-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                <span className="font-bold text-white">{filtered.length}</span>{" "}
                résultat(s)
              </p>

              {(filter !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  className="text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState filter={filter} search={search} />
            ) : (
              <div className="space-y-3">
                {filtered.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onClick={() => setSelected(application)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Note */}
          <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
              <MessageSquare size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Gère tes candidatures en un seul endroit
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Sélectionne un candidat pour consulter ses informations,
                examiner ses documents et gérer les prochaines étapes du
                recrutement.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Détail de candidature */}
      {selected && (
        <ApplicationDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
          onOpenInterviewModal={(application) => {
            setSelected(null);
            setInterviewModal(application);
          }}
        />
      )}

      {/* Programmer un entretien */}
      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          onClose={() => setInterviewModal(null)}
          onSuccess={() => {
            setInterviewModal(null);
            showToast(
              "Entretien programmé et invitation envoyée",
              "success"
            );
            load(true);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </AppShell>
  );
}

function ApplicationDetailModal({
  application,
  onClose,
  onUpdateStatus,
  onOpenInterviewModal,
}) {
  const user = application.profile?.user;

  const [notes, setNotes] = useState(application.recruiter_notes || "");
  const [saving, setSaving] = useState(false);
  const [notesError, setNotesError] = useState("");

  const config = STATUS_CFG[application.status] || STATUS_CFG.sent;
  const StatusIcon = config.icon;

  const handleStatus = async (newStatus) => {
    if (newStatus === "interview") {
      onOpenInterviewModal(application);
      return;
    }

    await onUpdateStatus(application.id, newStatus);
  };

  const saveNotes = async () => {
    setSaving(true);
    setNotesError("");

    try {
      await api.patch(`/applications/${application.id}/status`, {
        status: application.status,
        recruiter_notes: notes,
      });
    } catch (err) {
      setNotesError(
        err.response?.data?.message ||
          "Impossible d'enregistrer les notes."
      );
    } finally {
      setSaving(false);
    }
  };

  const hasInterviewDate = Boolean(application.interview_at);
  const interviewDate = hasInterviewDate
    ? new Date(application.interview_at)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#12364D] shadow-2xl shadow-black/40"
      >
        {/* En-tête de la modale */}
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#12364D] p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-lg font-bold text-emerald-300 sm:h-14 sm:w-14">
              {getInitial(user?.name)}
            </div>

            <div className="min-w-0">
              <h2
                id="application-detail-title"
                className="break-words text-lg font-bold text-white sm:text-xl"
              >
                {user?.name || "Candidat"}
              </h2>

              {application.profile?.headline && (
                <p className="mt-1 break-words text-sm text-slate-400">
                  {application.profile.headline}
                </p>
              )}

              <div className="mt-2">
                <StatusBadge status={application.status} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* Contenu */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          {/* Contact */}
          <section>
            <SectionLabel icon={Users} label="Informations de contact" />

            <div className="mt-3 flex flex-wrap gap-2">
              {user?.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="break-all">{user.email}</span>
                </a>
              )}

              {user?.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:text-emerald-300"
                >
                  <Phone size={14} />
                  {user.phone}
                </a>
              )}

              {!user?.email && !user?.phone && (
                <p className="text-sm text-slate-500">
                  Aucune information de contact disponible.
                </p>
              )}
            </div>
          </section>

          {/* Lettre de motivation */}
          {application.cover_letter && (
            <section>
              <SectionLabel
                icon={FileText}
                label="Lettre de motivation"
              />

              <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                  {application.cover_letter}
                </p>
              </div>
            </section>
          )}

          {/* Documents */}
          <section>
            <SectionLabel icon={Briefcase} label="Documents joints" />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {application.portfolio && (
                <a
                  href={`/portfolio/${application.portfolio.public_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.09]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Briefcase size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">
                      Portfolio
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {application.portfolio.title || "Voir le portfolio"}
                    </p>
                  </div>

                  <ExternalLink
                    size={15}
                    className="shrink-0 text-emerald-300"
                  />
                </a>
              )}

              {application.cv_path && (
                <a
                  href={`/storage/${application.cv_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 transition hover:border-rose-400/40 hover:bg-rose-400/[0.09]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">CV</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Consulter le document
                    </p>
                  </div>

                  <Download
                    size={15}
                    className="shrink-0 text-rose-300"
                  />
                </a>
              )}

              {!application.portfolio && !application.cv_path && (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center sm:col-span-2">
                  <FileText
                    size={24}
                    className="mx-auto text-slate-600"
                  />
                  <p className="mt-2 text-sm text-slate-400">
                    Aucun document joint à cette candidature.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Notes internes */}
          <section>
            <SectionLabel
              icon={StickyNote}
              label="Notes internes"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Ces notes sont destinées au suivi du recrutement.
            </p>

            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ajoute tes observations sur ce candidat..."
              className="mt-3 w-full resize-y rounded-2xl border border-white/[0.08] bg-[#0B1F33]/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/[0.06]"
            />

            {notesError && (
              <p className="mt-2 text-xs text-rose-300">{notesError}</p>
            )}

            {notes !== (application.recruiter_notes || "") && (
              <button
                type="button"
                onClick={saveNotes}
                disabled={saving}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                {saving ? "Enregistrement..." : "Enregistrer les notes"}
              </button>
            )}
          </section>

          {/* Entretien programmé */}
          {application.status === "interview" && hasInterviewDate && (
            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Calendar size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-amber-200">
                    Entretien programmé
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    {Number.isNaN(interviewDate.getTime())
                      ? "Date indisponible"
                      : interviewDate.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                  </p>

                  {!Number.isNaN(interviewDate.getTime()) && (
                    <p className="mt-1 text-sm text-slate-400">
                      À{" "}
                      {interviewDate.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {application.interview_link && (
                    <a
                      href={application.interview_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
                    >
                      Rejoindre l'entretien
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Actions */}
        <footer className="border-t border-white/[0.08] bg-[#12364D] p-5 sm:p-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Actions de recrutement
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "viewed",
                label: "Consultée",
                icon: Eye,
                style:
                  "border-blue-400/20 bg-blue-400/[0.06] text-blue-300 hover:bg-blue-400/15",
              },
              {
                key: "shortlisted",
                label: "Présélectionner",
                icon: UserCheck,
                style:
                  "border-violet-400/20 bg-violet-400/[0.06] text-violet-300 hover:bg-violet-400/15",
              },
              {
                key: "interview",
                label: "Programmer un entretien",
                icon: Video,
                style:
                  "border-amber-400/20 bg-amber-400/[0.06] text-amber-300 hover:bg-amber-400/15",
              },
              {
                key: "accepted",
                label: "Accepter",
                icon: Check,
                style:
                  "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300 hover:bg-emerald-400/15",
              },
              {
                key: "rejected",
                label: "Refuser",
                icon: X,
                style:
                  "border-rose-400/20 bg-rose-400/[0.06] text-rose-300 hover:bg-rose-400/15",
              },
            ].map(({ key, label, icon: Icon, style }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleStatus(key)}
                disabled={application.status === key}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm ${style}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
      <Icon size={14} />
      {label}
    </h3>
  );
}