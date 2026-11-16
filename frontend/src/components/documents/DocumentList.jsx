import React, { useEffect, useState } from "react";
import {
  FileText, ShieldCheck, Loader2, FolderOpen, RefreshCw,
  CalendarDays, HardDrive, Paperclip, ArrowDownToLine,
  FileImage, FileSpreadsheet, FileArchive, File, Folder
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

// Couleurs selon le type de document (adaptées au design épuré)
const getDocumentStyle = (type) => {
  const styles = {
    contract: {
      icon: "text-blue-600",
      iconBg: "bg-blue-50",
      badge: "bg-blue-50 text-blue-700",
    },
    agreement: {
      icon: "text-violet-600",
      iconBg: "bg-violet-50",
      badge: "bg-violet-50 text-violet-700",
    },
    invoice: {
      icon: "text-amber-600",
      iconBg: "bg-amber-50",
      badge: "bg-amber-50 text-amber-700",
    },
    quote: {
      icon: "text-cyan-600",
      iconBg: "bg-cyan-50",
      badge: "bg-cyan-50 text-cyan-700",
    },
    attachment: {
      icon: "text-emerald-600",
      iconBg: "bg-emerald-50",
      badge: "bg-emerald-50 text-emerald-700",
    },
    other: {
      icon: "text-purple-500",
      iconBg: "bg-purple-50",
      badge: "bg-purple-50 text-purple-700",
    },
  };

  return styles[type] || styles.other;
};

// Icône selon l'extension du fichier
const getFileIcon = (name = "") => {
  const extension = name.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) return FileImage;
  if (["xls", "xlsx", "csv"].includes(extension)) return FileSpreadsheet;
  if (["zip", "rar", "7z"].includes(extension)) return FileArchive;
  if (["pdf", "doc", "docx", "txt"].includes(extension)) return FileText;
  
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

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get("/documents", {
          params: {
            documentable_type: documentableType,
            documentable_id: documentableId,
          },
        });
        const result = res.data?.data ?? res.data;
        
        // ✅ DEBUG : Regarde dans la console de ton navigateur pour voir les champs exacts
        console.log("Documents reçus de l'API :", result);

        if (!cancelled) setDocs(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Erreur chargement documents :", err);
        if (!cancelled) {
          setDocs([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (documentableId) loadDocuments();
    else {
      setDocs([]);
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [documentableType, documentableId, refreshKey, retryKey]);

  const handleRetry = () => setRetryKey((prev) => prev + 1);

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers?.["content-type"] });
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

  if (loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
          <Loader2 size={23} className="animate-spin text-teal-600" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Chargement des documents</p>
        <p className="mt-1 text-xs text-slate-400">Veuillez patienter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 px-5 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
          <FolderOpen size={22} className="text-rose-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Impossible de charger les documents</h3>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Une erreur est survenue.</p>
        <button onClick={handleRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <FolderOpen size={27} className="text-slate-400" />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-teal-500 text-white">
            <span className="text-xs font-bold">0</span>
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Aucun document pour le moment</h3>
        <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500">
          Les contrats, accords et autres fichiers associés à cette mission apparaîtront dans cet espace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Bloc Fichiers disponibles */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F8F7] text-[#109E98]">
            <Folder size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0B1F33]">Fichiers disponibles</p>
            <p className="text-xs text-slate-500">
              {docs.length} document{docs.length > 1 ? "s" : ""} associé{docs.length > 1 ? "s" : ""} à cette mission
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#E8F8F7] px-3 py-1 text-xs font-semibold text-[#109E98]">
          {docs.length} fichier{docs.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Liste des documents */}
      <div className="space-y-3">
        {docs.map((doc) => {
          const FileIcon = getFileIcon(doc.original_name || "");
          
          // ✅ CORRECTION ICI : On cherche le type dans plusieurs champs possibles
          const documentType = 
            doc.document_type || 
            doc.type || 
            doc.category || 
            (doc.documentable_type && doc.documentable_type.includes("Agreement") ? "agreement" : null) || 
            "other";

          const documentStyle = getDocumentStyle(documentType);
          const isSigned = doc.is_signed || doc.status === "signed";
          const isDownloading = downloadingId === doc.id;

          return (
            <article
              key={doc.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-[#16B8B1]/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {/* Icône du fichier (Couleur selon le type) */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${documentStyle.iconBg} ${documentStyle.icon}`}>
                  <FileIcon size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-[#0B1F33]">
                      {doc.original_name || `Document #${doc.id}`}
                    </h3>
                    {isSigned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        <ShieldCheck size={11} /> Signé
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <HardDrive size={13} />
                      {formatSize(doc)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={13} />
                      {formatDate(doc.created_at)}
                    </span>
                    {/* ✅ Le fameux badge "Accord" */}
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${documentStyle.badge}`}>
                      <Paperclip size={10} />
                      {getTypeLabel(documentType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton Télécharger */}
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E8F8F7] px-4 py-2.5 text-xs font-bold text-[#109E98] transition-colors hover:bg-[#16B8B1] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isDownloading ? (
                    <><Loader2 size={14} className="animate-spin" /> Téléchargement...</>
                  ) : (
                    <><ArrowDownToLine size={15} /> Télécharger</>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}