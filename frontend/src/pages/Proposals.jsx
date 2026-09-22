import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Handshake, Loader2, Building2, User, Calendar, Check, X,
  Clock, Users, AlertCircle, ArrowRight, Briefcase,
  Plus, FileText, Eye, Send, Ban,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

const STATUS_CFG = {
  draft:     { label: "Brouillon",  badge: "bg-slate-100 text-slate-600",      icon: FileText },
  sent:      { label: "Envoyée",    badge: "bg-amber-100 text-amber-700",      icon: Clock },
  viewed:    { label: "Consultée",  badge: "bg-blue-100 text-blue-700",        icon: Eye },
  accepted:  { label: "Acceptée",   badge: "bg-emerald-100 text-emerald-700",  icon: Check },
  declined:  { label: "Refusée",    badge: "bg-rose-100 text-rose-700",        icon: X },
  expired:   { label: "Expirée",    badge: "bg-slate-100 text-slate-500",      icon: Clock },
  cancelled: { label: "Annulée",    badge: "bg-slate-100 text-slate-500",      icon: Ban },
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Proposals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/proposals/received").catch(() => ({ data: [] })),
      api.get("/proposals/sent").catch(() => ({ data: [] })),
    ])
      .then(([recRes, sentRes]) => {
        setReceived(asArray(recRes.data));
        setSent(asArray(sentRes.data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const acceptProposal = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/accept`);
      showToast("✅ Proposition acceptée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const declineProposal = async (id) => {
    if (!confirm("Refuser cette proposition ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/decline`);
      showToast("Proposition refusée", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const submitProposal = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/submit`);
      showToast("✅ Proposition envoyée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelProposal = async (id) => {
    if (!confirm("Annuler cette proposition ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/cancel`);
      showToast("Proposition annulée", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const list = tab === "received" ? received : sent;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={32} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header avec bouton Nouvelle proposition */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Propositions</h1>
            <p className="mt-1 text-sm text-slate-500">
              Suivez les propositions de talents envoyées et reçues.
            </p>
          </div>

          {/* ✅ NOUVEAU : Bouton "Nouvelle proposition" */}
          <Link
            to="/proposals/new"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            <Plus size={16} /> Nouvelle proposition
          </Link>
        </div>

        {/* Onglets */}
        <div className="mt-6 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab("received")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              tab === "received"
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📥 Reçues
            {received.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold">
                {received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              tab === "sent"
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📤 Envoyées
            {sent.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold">
                {sent.length}
              </span>
            )}
          </button>
        </div>

        {/* Liste */}
        <div className="mt-6 space-y-4">
          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Handshake size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">
                {tab === "received" ? "Aucune proposition reçue" : "Aucune proposition envoyée"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {tab === "received"
                  ? "Les propositions de talents apparaîtront ici."
                  : "Vos propositions apparaîtront ici."}
              </p>
              {tab === "sent" && (
                <Link
                  to="/proposals/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
                >
                  <Plus size={16} /> Créer une proposition
                </Link>
              )}
            </div>
          )}

          {list.map((p) => {
            const cfg = STATUS_CFG[p.display_status || p.status] || STATUS_CFG.sent;
            const Icon = cfg.icon;
            const isPending = ["sent", "viewed"].includes(p.status);
            const isDraft = p.status === "draft";

            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${cfg.badge}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      {p.match_score !== null && p.match_score !== undefined && (
                        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">
                          🎯 {p.match_score}% match
                        </span>
                      )}
                      {p.days_until_expiry !== null && p.days_until_expiry !== undefined && p.status === "sent" && p.days_until_expiry <= 7 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          ⚠️ Expire dans {p.days_until_expiry}j
                        </span>
                      )}
                    </div>

                    {tab === "received" && p.profile?.user && (
                      <p className="font-bold flex items-center gap-1.5">
                        <User size={14} /> {p.profile.user.name}
                        {p.profile.headline && (
                          <span className="text-sm font-normal text-slate-500">· {p.profile.headline}</span>
                        )}
                      </p>
                    )}

                    {tab === "sent" && p.profile?.user && (
                      <p className="font-bold flex items-center gap-1.5">
                        <User size={14} /> {p.profile.user.name}
                      </p>
                    )}

                    {p.proposingCompany && tab === "received" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Building2 size={12} /> Proposé par {p.proposingCompany.name}
                      </p>
                    )}

                    {p.toCompany && tab === "sent" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Building2 size={12} /> À {p.toCompany.name}
                      </p>
                    )}

                    {p.message && (
                      <p className="mt-2 text-sm text-slate-600 italic">"{p.message}"</p>
                    )}

                    {p.start_at && p.end_at && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        {new Date(p.start_at).toLocaleDateString("fr-FR")} → {new Date(p.end_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}

                    <p className="mt-2 text-[11px] text-slate-400">
                      {p.sent_at ? "Envoyée le" : "Créée le"}{" "}
                      {new Date(p.sent_at || p.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions - Reçues */}
                {tab === "received" && isPending && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => acceptProposal(p.id)}
                      disabled={actionLoading === p.id}
                      className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Accepter
                    </button>
                    <button
                      onClick={() => declineProposal(p.id)}
                      disabled={actionLoading === p.id}
                      className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <X size={14} /> Refuser
                    </button>
                  </div>
                )}

                {/* Actions - Envoyées (draft) */}
                {tab === "sent" && isDraft && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => submitProposal(p.id)}
                      disabled={actionLoading === p.id}
                      className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> Envoyer
                    </button>
                    <Link
                      to={`/proposals/${p.id}/edit`}
                      className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-navy flex items-center justify-center gap-2"
                    >
                      <FileText size={14} /> Modifier
                    </Link>
                  </div>
                )}

                {/* Actions - Envoyées (sent/viewed) */}
                {tab === "sent" && isPending && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => cancelProposal(p.id)}
                      disabled={actionLoading === p.id}
                      className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Ban size={14} /> Annuler la proposition
                    </button>
                  </div>
                )}

                {/* Liens */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                  {p.resource_request_id && (
                    <Link
                      to={`/resource-requests/${p.resource_request_id}`}
                      className="text-xs text-navy font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Voir la demande <ArrowRight size={11} />
                    </Link>
                  )}
                  {p.mission && (
                    <Link
                      to={`/missions/${p.mission.id}`}
                      className="text-xs text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Voir la mission <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}