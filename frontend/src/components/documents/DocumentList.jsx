
import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  History,
  Loader2,
  X,
  CalendarDays,
  Files,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

const TYPE_LABELS = {
  contract: "Contrat",
  agreement: "Convention",
  invoice: "Facture",
  quote: "Devis",
  attachment: "Pièce jointe",
  other: "Autre",
};

const STATUS_CONFIG = {
  draft: {
    label: "Brouillon",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  signed: {
    label: "Signé",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  expired: {
    label: "Expiré",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  },
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (bytes) => {
  if (bytes == null || bytes === "") return null;

  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) return null;
  if (size < 1024) return `${size} octets`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} Ko`;

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

function ActionButton({
  label,
  onClick,
  children,
  variant = "default",
}) {
  const variants = {
    default:
      "text-slate-500 hover:bg-slate-100 hover:text-[#12305A]",
    success:
      "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
    danger:
      "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export default function DocumentList({
  documentableType,
  documentableId,
  refreshKey,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const res = await api.get("/documents", {
        params: {
          documentable_type: documentableType,
          documentable_id: documentableId,
        },
      });

      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDocuments([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [documentableType, documentableId, refreshKey]);

  const download = async (doc) => {
    setBusyAction(`${doc.id}-download`);

    try {
      const res = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([res.data])
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_name || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      alert("Erreur de téléchargement");
    } finally {
      setBusyAction(null);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Supprimer "${doc.original_name}" ?`)) {
      return;
    }

    setBusyAction(`${doc.id}-delete`);

    try {
      await api.delete(`/documents/${doc.id}`);
      await load();
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setBusyAction(null);
    }
  };

  const markSigned = async (doc) => {
    if (!window.confirm("Marquer ce document comme signé ?")) {
      return;
    }

    setBusyAction(`${doc.id}-sign`);

    try {
      await api.post(`/documents/${doc.id}/sign`);
      await load();
    } catch {
      alert("Erreur lors de la signature");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-12">
        <Loader2
          size={28}
          className="animate-spin text-teal-600"
        />
        <p className="mt-3 text-sm font-medium text-slate-500">
          Chargement des documents...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle size={23} />
        </div>

        <h3 className="mt-4 font-semibold text-[#12305A]">
          Impossible de charger les documents
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Vérifiez votre connexion puis réessayez.
        </p>

        <button
          type="button"
          onClick={load}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#12305A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B4478]"
        >
          <RefreshCw size={15} />
          Réessayer
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Files size={28} strokeWidth={1.7} />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#12305A]">
          Aucun document pour le moment
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Les contrats, factures, conventions et autres fichiers
          associés à cette ressource apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#12305A]">
              Documents
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Consultez et gérez vos fichiers.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
            <Files size={16} className="text-teal-600" />
            {documents.length}{" "}
            {documents.length > 1 ? "documents" : "document"}
          </div>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => {
            const statusCfg =
              STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;

            const isExpired = Boolean(doc.is_expired);
            const isBusy = Boolean(
              busyAction?.startsWith(`${doc.id}-`)
            );

            return (
              <article
                key={doc.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-teal-200 hover:shadow-md hover:shadow-slate-200/40 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
                      <FileText size={23} strokeWidth={1.7} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          title={doc.original_name}
                          className="break-words text-sm font-bold leading-5 text-[#12305A] sm:text-base"
                        >
                          {doc.original_name}
                        </h4>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusCfg.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                          />
                          {statusCfg.label}
                        </span>

                        {isExpired && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                            <AlertCircle size={12} />
                            Expiré
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 sm:text-sm">
                        <span className="font-medium text-slate-600">
                          {TYPE_LABELS[doc.document_type] ||
                            doc.document_type ||
                            "Document"}
                        </span>

                        {doc.current_version != null && (
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Version {doc.current_version}
                          </span>
                        )}

                        {doc.size != null && (
                          <span>{formatSize(doc.size)}</span>
                        )}

                        {doc.expires_at && (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            Expire le {formatDate(doc.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-1">
                      <ActionButton
                        label="Télécharger"
                        onClick={() => download(doc)}
                      >
                        {busyAction === `${doc.id}-download` ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Download size={17} />
                        )}
                      </ActionButton>

                      <ActionButton
                        label="Voir l'historique"
                        onClick={() => setShowHistory(doc)}
                      >
                        <History size={17} />
                      </ActionButton>

                      {doc.status !== "signed" && (
                        <ActionButton
                          label="Marquer comme signé"
                          variant="success"
                          onClick={() => markSigned(doc)}
                        >
                          {busyAction === `${doc.id}-sign` ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <CheckCircle size={17} />
                          )}
                        </ActionButton>
                      )}

                      <ActionButton
                        label="Supprimer"
                        variant="danger"
                        onClick={() => remove(doc)}
                      >
                        {busyAction === `${doc.id}-delete` ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </ActionButton>
                    </div>

                    <button
                      type="button"
                      onClick={() => download(doc)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#12305A] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1B4478] disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
                    >
                      <Download size={14} />
                      Télécharger
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {showHistory && (
        <HistoryModal
          doc={showHistory}
          onClose={() => setShowHistory(null)}
        />
      )}
    </>
  );
}

function HistoryModal({ doc, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError(false);

    api
      .get(`/documents/${doc.id}/history`)
      .then((res) => {
        if (active) {
          setHistory(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (active) {
          setHistory([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [doc.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-history-title"
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <History size={21} />
            </div>

            <div className="min-w-0">
              <h3
                id="document-history-title"
                className="text-lg font-bold text-[#12305A]"
              >
                Historique du document
              </h3>
              <p className="mt-1 break-words text-sm text-slate-500">
                {doc.original_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#12305A] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(85vh-100px)] overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={27} className="animate-spin text-teal-600" />
              <p className="mt-3 text-sm text-slate-500">
                Chargement de l’historique...
              </p>
            </div>
          ) : loadError ? (
            <div className="py-10 text-center">
              <AlertCircle
                size={26}
                className="mx-auto text-rose-500"
              />
              <p className="mt-3 text-sm font-semibold text-[#12305A]">
                Impossible de charger l’historique
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Veuillez réessayer plus tard.
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <History size={25} />
              </div>
              <p className="mt-3 font-semibold text-[#12305A]">
                Aucun événement
              </p>
              <p className="mt-1 text-sm text-slate-500">
                L’activité de ce document apparaîtra ici.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="relative flex gap-3 pb-6 last:pb-0"
                >
                  {index !== history.length - 1 && (
                    <div className="absolute bottom-0 left-[15px] top-8 w-px bg-teal-100" />
                  )}

                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-teal-700">
                    <Clock size={15} />
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-sm font-semibold text-[#12305A]">
                      {item.action_label || item.action}
                    </p>

                    {item.notes && (
                      <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                        {item.notes}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-500">
                      {item.user?.name || "Système"}
                      {item.created_at && (
                        <>
                          {" · "}
                          {new Date(item.created_at).toLocaleString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#12305A] transition hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>
      </section>
    </div>
  );
}