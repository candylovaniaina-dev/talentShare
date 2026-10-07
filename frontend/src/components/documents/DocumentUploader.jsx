import React, { useRef, useState } from "react";
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import api from "../../services/api";

const DOCUMENT_TYPES = {
  contract:   { label: "Contrat", value: "contract" },
  agreement:  { label: "Convention", value: "agreement" },
  invoice:    { label: "Facture", value: "invoice" },
  quote:      { label: "Devis", value: "quote" },
  attachment: { label: "Pièce jointe", value: "attachment" },
  other:      { label: "Autre", value: "other" },
};

const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/webp",
  "text/plain",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export default function DocumentUploader({
  documentableType,
  documentableId,
  onUploaded,
  allowedTypes = Object.keys(DOCUMENT_TYPES),
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState(allowedTypes[0] || "attachment");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (f.size > MAX_SIZE) return "Fichier trop lourd (10 Mo max).";
    if (!ALLOWED_MIMES.includes(f.type) && !f.name.match(/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|webp|txt)$/i)) {
      return "Format non supporté (PDF, DOCX, XLSX, JPG, PNG, TXT).";
    }
    return null;
  };

  const pickFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError("");
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const upload = async () => {
    if (!file) { setError("Aucun fichier sélectionné."); return; }
    if (!documentableType || !documentableId) { setError("Ressource manquante."); return; }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentable_type", documentableType);
      formData.append("documentable_id", documentableId);
      formData.append("document_type", documentType);
      if (expiresAt) formData.append("expires_at", expiresAt);
      if (notes) formData.append("notes", notes);

      const res = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setNotes("");
        setExpiresAt("");
        setSuccess(false);
        onUploaded?.(res.data.document);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Upload size={14} className="text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Ajouter un document
        </h3>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* Zone de drag & drop */}
      {!file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-white/10 bg-white/[0.02] hover:border-emerald-500/40"
          }`}
        >
          <Upload size={32} className={dragOver ? "text-emerald-400" : "text-slate-500"} />
          <p className="mt-3 text-sm font-medium text-white">
            {dragOver ? "Déposez le fichier ici" : "Glissez votre fichier ou cliquez"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOCX, XLSX, JPG, PNG — 10 Mo max
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Fichier sélectionné */}
      {file && !success && (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <FileText size={24} className="shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* Formulaire */}
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Type de document *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>{DOCUMENT_TYPES[t]?.label || t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Date d'expiration (optionnel)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Notes (optionnel)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes internes..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={upload}
              disabled={uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Envoi en cours...</>
              ) : (
                <><Upload size={14} /> Téléverser</>
              )}
            </button>
          </div>
        </>
      )}

      {/* Succès */}
      {success && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-6">
          <CheckCircle size={32} className="text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-300">Document ajouté !</p>
        </div>
      )}
    </div>
  );
}