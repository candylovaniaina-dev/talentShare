import React, { useEffect, useState } from "react";
import {
  FileText, Download, Trash2, Eye, Clock, CheckCircle,
  AlertCircle, History, Upload, Loader2, X, Edit2,
} from "lucide-react";
import api from "../../services/api";

const TYPE_LABELS = {
  contract: "Contrat", agreement: "Convention", invoice: "Facture",
  quote: "Devis", attachment: "Pièce jointe", other: "Autre",
};

const STATUS_CONFIG = {
  draft:     { label: "Brouillon",   color: "text-slate-400",  bg: "bg-slate-500/10" },
  pending:   { label: "En attente",  color: "text-amber-400",  bg: "bg-amber-500/10" },
  signed:    { label: "Signé",       color: "text-emerald-400",bg: "bg-emerald-500/10" },
  expired:   { label: "Expiré",      color: "text-rose-400",   bg: "bg-rose-500/10" },
  cancelled: { label: "Annulé",      color: "text-slate-500",  bg: "bg-slate-500/10" },
};

export default function DocumentList({ documentableType, documentableId, refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showHistory, setShowHistory] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/documents", {
      params: { documentable_type: documentableType, documentable_id: documentableId },
    })
      .then((res) => setDocuments(res.data || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [documentableType, documentableId, refreshKey]);

  const download = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erreur de téléchargement");
    }
  };

  const remove = async (doc) => {
    if (!confirm(`Supprimer "${doc.original_name}" ?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      load();
    } catch {
      alert("Erreur");
    }
  };

  const markSigned = async (doc) => {
    if (!confirm("Marquer ce document comme signé ?")) return;
    try {
      await api.post(`/documents/${doc.id}/sign`);
      load();
    } catch {
      alert("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] py-8 text-center">
        <FileText size={24} className="mx-auto text-slate-500" />
        <p className="mt-2 text-sm text-slate-500">Aucun document</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
          const isExpired = doc.is_expired;

          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {doc.original_name}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  {isExpired && (
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      Expiré
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                  <span>v{doc.current_version}</span>
                  {doc.size && <span>{(doc.size / 1024).toFixed(0)} Ko</span>}
                  {doc.expires_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      Expire {new Date(doc.expires_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => download(doc)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-emerald-400"
                  title="Télécharger"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => setShowHistory(doc)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-blue-400"
                  title="Historique"
                >
                  <History size={14} />
                </button>
                {doc.status !== "signed" && (
                  <button
                    onClick={() => markSigned(doc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-emerald-400"
                    title="Marquer signé"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                <button
                  onClick={() => remove(doc)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-rose-400"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historique modal */}
      {showHistory && (
        <HistoryModal doc={showHistory} onClose={() => setShowHistory(null)} />
      )}
    </>
  );
}

function HistoryModal({ doc, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/documents/${doc.id}/history`)
      .then((res) => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [doc.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1E45] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Historique</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <p className="mb-3 truncate text-xs text-slate-500">{doc.original_name}</p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucun événement</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3 border-l-2 border-emerald-500/30 pl-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">
                    {h.action_label || h.action}
                  </p>
                  {h.notes && <p className="text-xs text-slate-400">{h.notes}</p>}
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {h.user?.name || "Système"} ·{" "}
                    {new Date(h.created_at).toLocaleString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}