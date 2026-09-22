import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, User, Building2, Calendar, Clock, FileText,
  Download, Trash2, Upload, Check, X, Ban, Send, AlertCircle,
  Briefcase, Paperclip,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

const STATUS_CFG = {
  draft:     { label: "Brouillon",  badge: "bg-slate-100 text-slate-600",      icon: FileText },
  sent:      { label: "Envoyée",    badge: "bg-amber-100 text-amber-700",      icon: Clock },
  viewed:    { label: "Consultée",  badge: "bg-blue-100 text-blue-700",        icon: Clock },
  accepted:  { label: "Acceptée",   badge: "bg-emerald-100 text-emerald-700",  icon: Check },
  declined:  { label: "Refusée",    badge: "bg-rose-100 text-rose-700",        icon: X },
  expired:   { label: "Expirée",    badge: "bg-slate-100 text-slate-500",      icon: Clock },
  cancelled: { label: "Annulée",    badge: "bg-slate-100 text-slate-500",      icon: Ban },
};

const DOC_TYPES = {
  contract:   "Contrat",
  agreement:  "Accord",
  attachment: "Pièce jointe",
  other:      "Autre",
};

export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [propRes, docsRes] = await Promise.all([
        api.get(`/proposals/${id}`),
        api.get("/documents", { params: { documentable_type: "proposal", documentable_id: id } }),
      ]);
      setProposal(propRes.data);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.data || []));
    } catch (err) {
      setError(err.response?.status === 403 ? "forbidden" : "not_found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const uploadDocument = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentable_type", "proposal");
      formData.append("documentable_id", id);
      formData.append("type", type);
      formData.append("file", file);

      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("✅ Document ajouté", "success");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      showToast("Document supprimé", "info");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    }
  };

  const doAction = async (action) => {
    if (action === "cancel" && !confirm("Annuler cette proposition ?")) return;
    if (action === "decline" && !confirm("Refuser cette proposition ?")) return;
    setActionLoading(true);
    try {
      await api.post(`/proposals/${id}/${action}`);
      showToast("✅ Action effectuée", "success");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={32} />
        </div>
      </AppShell>
    );
  }

  if (error || !proposal) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-20">
          <AlertCircle size={40} className="mx-auto text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold">
            {error === "forbidden" ? "Accès refusé" : "Proposition introuvable"}
          </h1>
          <Link
            to="/proposals"
            className="mt-6 inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white"
          >
            ← Retour aux propositions
          </Link>
        </div>
      </AppShell>
    );
  }

  const cfg = STATUS_CFG[proposal.display_status] || STATUS_CFG.sent;
  const Icon = cfg.icon;
  const myCompanyIds = (user?.companies || []).map((c) => c.id);
  const isSender = myCompanyIds.includes(proposal.proposed_by_company_id);
  const isPending = ["sent", "viewed"].includes(proposal.status);
  const isDraft = proposal.status === "draft";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={15} /> Retour
        </button>

        {/* HEADER */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 ${cfg.badge}`}>
                  <Icon size={11} /> {cfg.label}
                </span>
                {proposal.match_score != null && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
                    🎯 {proposal.match_score}% match
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold">
                Proposition — {proposal.profile?.user?.name}
              </h1>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                {proposal.proposingCompany && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} /> {proposal.proposingCompany.name}
                  </span>
                )}
                {proposal.toCompany && (
                  <>
                    <span>→</span>
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} /> {proposal.toCompany.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TALENT */}
        {proposal.profile?.user && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold mb-4">Talent proposé</h2>
            <div className="flex items-center gap-4">
              {proposal.profile.avatar_path ? (
                <img
                  src={`http://localhost:8000/storage/${proposal.profile.avatar_path}`}
                  className="h-16 w-16 rounded-2xl object-cover"
                  alt={proposal.profile.user.name}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/20 text-navy font-bold text-xl">
                  {proposal.profile.user.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{proposal.profile.user.name}</p>
                {proposal.profile.headline && (
                  <p className="text-sm text-mint">{proposal.profile.headline}</p>
                )}
              </div>
            </div>
            {proposal.description && (
              <p className="mt-4 text-sm text-slate-600">{proposal.description}</p>
            )}
            {proposal.conditions && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">Conditions</p>
                <p className="text-sm text-slate-600 whitespace-pre-line">{proposal.conditions}</p>
              </div>
            )}
          </div>
        )}

        {/* PÉRIODE */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {proposal.start_at && proposal.end_at && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Période</p>
              <p className="text-sm">
                <b>{new Date(proposal.start_at).toLocaleDateString("fr-FR")}</b>
                <br />
                <span className="text-slate-400">→</span>{" "}
                <b>{new Date(proposal.end_at).toLocaleDateString("fr-FR")}</b>
              </p>
            </div>
          )}
          {proposal.workload_percent != null && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Charge</p>
              <p className="text-sm font-bold">{proposal.workload_percent}%</p>
              {proposal.remote && <p className="text-xs text-blue-600 mt-1">🏠 Télétravail</p>}
            </div>
          )}
          {proposal.expires_at && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold uppercase text-amber-700 mb-2">Expire le</p>
              <p className="text-sm font-bold text-amber-700">
                {new Date(proposal.expires_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
        </div>

        {/* MESSAGE */}
        {proposal.message && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold mb-2">Message</h2>
            <p className="text-sm text-slate-600 italic">"{proposal.message}"</p>
          </div>
        )}

        {/* DOCUMENTS */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Paperclip size={18} className="text-navy" /> Documents
              <span className="text-sm font-normal text-slate-400">({documents.length})</span>
            </h2>

            <div className="flex gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy">
                <Upload size={12} /> Contrat
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => uploadDocument(e, "contract")}
                />
              </label>

              <label className="cursor-pointer flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                <Upload size={12} /> Ajouter
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => uploadDocument(e, "attachment")}
                />
              </label>
            </div>
          </div>

          {uploading && (
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Upload en cours...
            </div>
          )}

          {documents.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-6 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Aucun document joint</p>
              <p className="text-xs text-slate-400 mt-1">
                Ajoutez un contrat ou une pièce jointe ci-dessus
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-navy transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {d.original_name || d.file_path.split("/").pop()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {DOC_TYPES[d.type] || d.type} · {d.formatted_size || "—"}
                        {d.uploader && ` · par ${d.uploader.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <a
                      href={`http://localhost:8000/api/documents/${d.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 p-2 hover:border-navy"
                      title="Télécharger"
                    >
                      <Download size={14} />
                    </a>
                    {d.uploaded_by === user?.id && (
                      <button
                        onClick={() => deleteDocument(d.id)}
                        className="rounded-full border border-slate-200 p-2 hover:border-rose-400 hover:text-rose-500"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-3">
          {isSender && isDraft && (
            <>
              <button
                onClick={() => doAction("submit")}
                disabled={actionLoading}
                className="flex-1 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Send size={16} /> Envoyer la proposition
              </button>
            </>
          )}

          {isSender && isPending && (
            <button
              onClick={() => doAction("cancel")}
              disabled={actionLoading}
              className="flex-1 rounded-2xl border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Ban size={16} /> Annuler la proposition
            </button>
          )}

          {!isSender && isPending && (
            <>
              <button
                onClick={() => doAction("accept")}
                disabled={actionLoading}
                className="flex-1 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Check size={16} /> Accepter
              </button>
              <button
                onClick={() => doAction("decline")}
                disabled={actionLoading}
                className="flex-1 rounded-2xl border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <X size={16} /> Refuser
              </button>
            </>
          )}

          {proposal.mission && (
            <Link
              to={`/missions/${proposal.mission.id}`}
              className="rounded-2xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light flex items-center gap-2"
            >
              <Briefcase size={16} /> Voir la mission
            </Link>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}