import React, { useCallback, useEffect, useState } from "react";
import { Check, X, Loader2, ShieldCheck, Building2, Clock, RefreshCw, AlertCircle, CalendarDays, UserRound, Mail } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AdminVerifications() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/admin/verification-requests");

      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Erreur de chargement des vérifications :", err);
      setError(
        err.response?.data?.message ||
          "Impossible de charger les demandes de vérification."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      load();
    } else {
      setLoading(false);
    }
  }, [user?.role, load]);

  const review = async (id, status) => {
    let note = "";

    if (status === "rejected") {
      const result = window.prompt("Raison du refus (optionnel) :");

      if (result === null) return;

      note = result.trim();
    }

    setProcessing(id);

    try {
      await api.patch(`/admin/verification-requests/${id}/review`, {
        status,
        review_note: note,
      });

      showToast(
        status === "approved"
          ? "Demande de vérification approuvée."
          : "Demande de vérification refusée.",
        "success"
      );

      await load();
    } catch (err) {
      console.error("Erreur lors du traitement :", err);
      showToast(
        err.response?.data?.message ||
          "Impossible de traiter cette demande.",
        "error"
      );
    } finally {
      setProcessing(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl py-16">
          <div className="rounded-3xl border border-rose-500/20 bg-[var(--bg-surface)] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <ShieldCheck size={27} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[var(--text-app)]">
              Accès non autorisé
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
              Vous devez être administrateur pour accéder aux demandes de
              vérification.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck size={14} />
                Administration
              </span>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-app)] sm:text-3xl">
                Vérifications
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                Examinez les demandes de vérification des entreprises et des
                universités avant de prendre une décision.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--text-app)] transition hover:border-emerald-500/40 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Actualiser
            </button>
          </div>
        </section>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-muted)]">
                  Demandes en attente
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-app)]">
                  {loading ? "—" : items.length}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <Clock size={21} />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-muted)]">
                  À examiner
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-app)]">
                  {loading ? "—" : items.length}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Building2 size={21} />
              </span>
            </div>
          </div>
        </div>

        {/* Requests */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-app)]">
                Demandes reçues
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Consultez les informations et traitez chaque demande.
              </p>
            </div>

            <span className="rounded-full border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
              {items.length} demande{items.length > 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
              <Loader2 size={30} className="animate-spin text-emerald-400" />
              <p className="text-sm text-[var(--text-muted)]">
                Chargement des demandes…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-[var(--bg-surface)] p-8 text-center">
              <AlertCircle
                size={28}
                className="mx-auto text-rose-400"
              />
              <p className="mt-3 text-sm text-[var(--text-app)]">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-4 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400"
              >
                Réessayer
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Check size={26} />
              </div>
              <h3 className="mt-4 font-bold text-[var(--text-app)]">
                Tout est à jour !
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Aucune demande de vérification en attente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <VerificationCard
                  key={item.id}
                  item={item}
                  processing={processing === item.id}
                  onApprove={() => review(item.id, "approved")}
                  onReject={() => review(item.id, "rejected")}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function VerificationCard({ item, processing, onApprove, onReject }) {
  const name =
    item.verifiable?.name ||
    item.verifiable_type?.split("\\").pop() ||
    "Organisation";

  const requester = item.requester;

  const createdAt = item.created_at
    ? new Date(item.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date inconnue";

  return (
    <article className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition hover:border-emerald-500/30 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
          <Building2 size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[var(--text-app)]">
              {name}
            </h3>

            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
              <Clock size={11} />
              En attente
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
              <UserRound size={14} className="shrink-0 text-[var(--text-faint)]" />
              <span>Demandeur :</span>
              <span className="font-medium text-[var(--text-app)]">
                {requester?.name || "Utilisateur inconnu"}
              </span>
            </p>

            {requester?.email && (
              <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <Mail size={14} className="shrink-0 text-[var(--text-faint)]" />
                {requester.email}
              </p>
            )}

            <p className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
              <CalendarDays size={13} />
              Demande soumise le {createdAt}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:self-center">
          <button
            type="button"
            onClick={onApprove}
            disabled={processing}
            title="Approuver la demande"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {processing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span>Approuver</span>
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={processing}
            title="Refuser la demande"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {processing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <X size={16} />
            )}
            <span>Refuser</span>
          </button>
        </div>
      </div>
    </article>
  );
}