
import React, { useEffect, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Loader2,
  FolderOpen,
  RefreshCw,
  CalendarDays,
  HardDrive,
  Paperclip,
  ArrowDownToLine,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
} from "lucide-react";

import api from "../../services/api";

const DOCUMENT_TYPES = {
  contract: "Contrat",
  agreement: "Accord",
  invoice: "Facture",
  quote: "Devis",
  attachment: "Pièce jointe",
  other: "Autre",
};

const getTypeLabel = (type) => {
  return DOCUMENT_TYPES[type] || type || "Document";
};

// Couleurs selon le type de document
const getDocumentStyle = (type) => {
  const styles = {
    contract: {
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20",
      badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    },
    agreement: {
      icon: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
      badge: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
    },
    invoice: {
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
      badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    },
    quote: {
      icon: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20",
      badge: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
    },
    attachment: {
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    },
    other: {
      icon: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
      badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
  };

  return styles[type] || styles.other;
};

// Icône selon l'extension du fichier
const getFileIcon = (name = "") => {
  const extension = name.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) {
    return FileImage;
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (["zip", "rar", "7z"].includes(extension)) {
    return FileArchive;
  }

  if (["pdf", "doc", "docx", "txt"].includes(extension)) {
    return FileText;
  }

  return File;
};

const formatDate = (date) => {
  if (!date) return "Date inconnue";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date inconnue";

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (doc) => {
  if (doc.formatted_size) return doc.formatted_size;

  const size = Number(doc.size || 0);

  if (size < 1024) return `${size} octets`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

export default function DocumentList({
  documentableType,
  documentableId,
  refreshKey = 0,
}) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Chargement des documents
  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError(false);

      try {
        const cleanType = documentableType.replace(/\\\\/g, "\\");

        const res = await api.get("/documents", {
          params: {
            documentable_type: cleanType,
            documentable_id: documentableId,
          },
        });

        const result = res.data?.data ?? res.data;

        if (!cancelled) {
          setDocs(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error("Erreur chargement documents :", err);

        if (!cancelled) {
          setDocs([]);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (documentableId) {
      loadDocuments();
    } else {
      setDocs([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [documentableType, documentableId, refreshKey, retryKey]);

  // Nouvelle tentative sans recharger toute la page
  const handleRetry = () => {
    setRetryKey((previous) => previous + 1);
  };

  // Téléchargement d'un document
  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);

    try {
      const response = await api.get(
        `/documents/${doc.id}/download`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"],
      });

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = url;
      link.download = doc.original_name || `document-${doc.id}`;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur téléchargement document :", err);
    } finally {
      setDownloadingId(null);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
          <Loader2
            size={23}
            className="animate-spin text-emerald-600 dark:text-emerald-400"
          />
        </div>

        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Chargement des documents
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Veuillez patienter quelques instants...
        </p>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 px-5 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10">
          <FolderOpen
            size={22}
            className="text-rose-500 dark:text-rose-400"
          />
        </div>

        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Impossible de charger les documents
        </h3>

        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
          Une erreur est survenue pendant la récupération des fichiers.
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          <RefreshCw size={14} />
          Réessayer
        </button>
      </div>
    );
  }

  // Aucun document
  if (!docs.length) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center dark:border-slate-700 dark:bg-slate-800/30">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <FolderOpen
            size={27}
            className="text-slate-400 dark:text-slate-500"
          />

          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-emerald-500 text-white dark:border-slate-900">
            <span className="text-xs font-bold">0</span>
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Aucun document pour le moment
        </h3>

        <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
          Les contrats, accords et autres fichiers associés à cette mission
          apparaîtront dans cet espace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <FolderOpen
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              Fichiers disponibles
            </p>

            <p className="text-[11px] text-slate-500">
              {docs.length} document{docs.length > 1 ? "s" : ""} associé
              {docs.length > 1 ? "s" : ""} à cette mission
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          {docs.length} fichier{docs.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Liste des documents */}
      <div className="space-y-3">
        {docs.map((doc) => {
          const FileIcon = getFileIcon(doc.original_name || "");
          const documentType =
            doc.document_type || doc.type || "other";
          const documentStyle = getDocumentStyle(documentType);
          const isSigned =
            doc.is_signed || doc.status === "signed";
          const isDownloading = downloadingId === doc.id;

          return (
            <article
              key={doc.id}
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/30 dark:hover:shadow-none"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Icône et informations */}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {/* Icône colorée selon le type */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${documentStyle.iconBg}`}
                  >
                    <FileIcon
                      size={21}
                      className={documentStyle.icon}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {doc.original_name || `Document #${doc.id}`}
                      </h3>

                      {isSigned && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <ShieldCheck size={11} />
                          Signé
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <HardDrive size={12} />
                        {formatSize(doc)}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <CalendarDays size={12} />
                        {formatDate(doc.created_at)}
                      </span>

                      {/* Badge coloré selon le type */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${documentStyle.badge}`}
                      >
                        <Paperclip size={10} />
                        {getTypeLabel(documentType)}
                      </span>
                    </div>

                    {doc.notes && (
                      <p className="mt-2 border-l-2 border-emerald-200 pl-2 text-xs italic leading-5 text-slate-500 dark:border-emerald-500/30 dark:text-slate-400">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action téléchargement */}
                <div className="flex shrink-0 items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-all hover:border-emerald-200 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 sm:w-auto"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine size={15} />
                        Télécharger
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
