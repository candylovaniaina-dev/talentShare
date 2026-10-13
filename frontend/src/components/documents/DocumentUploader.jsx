
import React, { useRef, useState } from "react";
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  FileUp,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import api from "../../services/api";

const DOCUMENT_TYPES = {
  contract: { label: "Contrat", value: "contract" },
  agreement: { label: "Convention", value: "agreement" },
  invoice: { label: "Facture", value: "invoice" },
  quote: { label: "Devis", value: "quote" },
  attachment: { label: "Pièce jointe", value: "attachment" },
  other: { label: "Autre", value: "other" },
};

const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

const MAX_SIZE = 10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt";

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

const labelClassName =
  "mb-2 block text-sm font-semibold text-[#12305A]";

export default function DocumentUploader({
  documentableType,
  documentableId,
  onUploaded,
  allowedTypes = Object.keys(DOCUMENT_TYPES),
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState(
    allowedTypes[0] || "attachment"
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);
  const resetTimerRef = useRef(null);

  const validateFile = (selectedFile) => {
    if (selectedFile.size > MAX_SIZE) {
      return "Ce fichier dépasse la limite autorisée de 10 Mo.";
    }

    const hasValidMime = ALLOWED_MIMES.includes(selectedFile.type);
    const hasValidExtension = /\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|webp|txt)$/i.test(
      selectedFile.name
    );

    if (!hasValidMime && !hasValidExtension) {
      return "Format non pris en charge. Utilisez PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, WEBP ou TXT.";
    }

    return null;
  };

  const pickFile = (selectedFile) => {
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess(false);
    setFile(selectedFile);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) pickFile(droppedFile);
  };

  const clearFile = () => {
    setFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const upload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier avant de continuer.");
      return;
    }

    if (!documentableType || !documentableId) {
      setError(
        "La ressource associée est introuvable. Veuillez vérifier la page actuelle."
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("documentable_type", documentableType);
      formData.append("documentable_id", documentableId);
      formData.append("document_type", documentType);

      if (expiresAt) {
        formData.append("expires_at", expiresAt);
      }

      if (notes) {
        formData.append("notes", notes);
      }

      const res = await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setFile(null);
        setNotes("");
        setExpiresAt("");
        setSuccess(false);

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        onUploaded?.(res.data.document);
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de l’envoi du document."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <FileUp size={22} />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#12305A] sm:text-lg">
              Ajouter un document
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Importez et associez un fichier à cette ressource.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600">
              <AlertCircle size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-800">
                Impossible de continuer
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-rose-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Fermer le message d’erreur"
              className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!file && !success && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Sélectionner un document à envoyer"
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDragOver(false);
              }
            }}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-9 text-center transition duration-200 sm:py-12 ${
              dragOver
                ? "border-teal-500 bg-teal-50"
                : "border-slate-300 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/50"
            }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl transition duration-200 ${
                dragOver
                  ? "scale-105 bg-teal-100 text-teal-700"
                  : "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200 group-hover:bg-teal-50 group-hover:ring-teal-200"
              }`}
            >
              <Upload size={28} strokeWidth={1.8} />
            </div>

            <h4 className="mt-5 text-sm font-bold text-[#12305A] sm:text-base">
              {dragOver
                ? "Déposez votre fichier ici"
                : "Glissez-déposez votre fichier"}
            </h4>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              ou{" "}
              <span className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4">
                parcourez vos fichiers
              </span>{" "}
              pour le sélectionner sur votre appareil.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["PDF", "DOCX", "XLSX", "JPG", "PNG", "TXT"].map(
                (format) => (
                  <span
                    key={format}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {format}
                  </span>
                )
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Taille maximale : 10 Mo par fichier
            </p>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_EXTENSIONS}
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  pickFile(event.target.files[0]);
                }
              }}
            />
          </div>
        )}

        {file && !success && (
          <>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-white text-teal-700">
                  <FileText size={23} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-[#12305A]">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle size={13} />
                    Fichier prêt à être envoyé
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={uploading}
                  aria-label="Retirer le fichier sélectionné"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-rose-600 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>
                  Type de document{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <select
                  required
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value)
                  }
                  className={inputClassName}
                >
                  {allowedTypes.map((type) => (
                    <option key={type} value={type}>
                      {DOCUMENT_TYPES[type]?.label || type}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  Sélectionnez la catégorie correspondant au fichier.
                </p>
              </div>

              <div>
                <label className={labelClassName}>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-teal-700" />
                    Date d’expiration
                    <span className="font-normal text-slate-400">
                      (optionnel)
                    </span>
                  </span>
                </label>

                <input
                  type="date"
                  value={expiresAt}
                  onChange={(event) =>
                    setExpiresAt(event.target.value)
                  }
                  className={inputClassName}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Renseignez cette date si le document possède une
                  échéance.
                </p>
              </div>

              <div>
                <label className={labelClassName}>
                  Notes{" "}
                  <span className="font-normal text-slate-400">
                    (optionnel)
                  </span>
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ajoutez des informations utiles sur ce document..."
                  className={`${inputClassName} min-h-[100px] resize-y`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-teal-700"
                />
                Vérifiez les informations avant l’envoi.
              </div>

              <button
                type="button"
                onClick={upload}
                disabled={uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#12305A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B4478] focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Téléverser le document
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <FileCheck2 size={31} />
            </div>

            <h4 className="mt-4 text-lg font-bold text-emerald-900">
              Document ajouté avec succès !
            </h4>

            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Votre fichier a été envoyé. Actualisation de la liste
              des documents...
            </p>

            <div className="mt-4 flex justify-center">
              <Loader2
                size={18}
                className="animate-spin text-emerald-600"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}