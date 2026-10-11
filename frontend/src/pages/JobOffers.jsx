import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase, MapPin, Building2, Plus, X, Loader2,
  Home, Calendar, Users, Eye, Trash2, CheckCircle2,
  Clock, FileText, ChevronRight, AlertCircle,
} from "lucide-react";

const OFFER_TYPES = {
  internship:     "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job:      "Premier emploi",
};

export default function JobOffers() {
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ Charge la company via /companies/me (route dédiée)
  useEffect(() => {
    if (!isCompany) return;
    api.get("/companies/me")
      .then((res) => setCompany(res.data))
      .catch((err) => {
        console.error("Erreur chargement company:", err);
        flash("Impossible de charger votre entreprise", "error");
      });
  }, [isCompany]);

  // ✅ Charge les offres
  const load = () => {
    setLoading(true);
    api.get("/job-offers")
      .then((res) => setOffers(res.data.data || res.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // ✅ Mes offres (si entreprise)
  const myOffers = isCompany
    ? offers.filter((o) => o.company_id === company?.id)
    : offers;

  const deleteOffer = async (id) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try {
      await api.delete(`/job-offers/${id}`);
      flash("Offre supprimée");
      load();
    } catch {
      flash("Erreur lors de la suppression", "error");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">

        {/* ===== HEADER ===== */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mint">
              {isCompany ? "Espace entreprise" : "Espace talent"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-app)]">
              {isCompany ? "Mes offres d'emploi" : "Offres de stages & emplois"}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isCompany
                ? "Publiez et gérez vos offres de stages et d'emplois."
                : "Découvrez les opportunités publiées par les entreprises."}
            </p>
          </div>

          {/* Action principale (comme Shopify) */}
          {isCompany && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!company}
              className="inline-flex items-center gap-2 rounded-xl2 bg-mint px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} /> Créer une offre
            </button>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 rounded-xl2 border px-4 py-2.5 text-sm font-medium ${
            toast.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-mint/10 text-emerald-300"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Warning si entreprise mais pas de profil entreprise */}
        {isCompany && !company && (
          <div className="mb-6 flex items-start gap-3 rounded-xl2 border border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-semibold">Aucune entreprise liée à votre compte</p>
              <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
                Créez d'abord votre profil entreprise pour pouvoir publier des offres.
              </p>
              <a
                href="/company"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 underline"
              >
                Créer mon entreprise <ChevronRight size={11} />
              </a>
            </div>
          </div>
        )}

        {/* ===== SECTION HEADER ===== */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {isCompany ? "Offres publiées" : "Offres disponibles"}
          </h2>
          <span className="rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
            {myOffers.length}
          </span>
        </div>

        {/* ===== LISTE ===== */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-mint" size={32} />
          </div>
        ) : myOffers.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-2)] p-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl2 bg-[var(--bg-surface-2)] text-[var(--text-faint)]">
              <Briefcase size={26} />
            </span>
            <p className="mt-4 font-semibold text-[var(--text-app)]">
              {isCompany ? "Aucune offre publiée pour l'instant" : "Aucune opportunité pour le moment"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-faint)]">
              {isCompany
                ? "Cliquez sur « Créer une offre » pour commencer."
                : "Revenez plus tard, de nouvelles offres arrivent bientôt."}
            </p>
            {isCompany && company && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl2 bg-mint px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
              >
                <Plus size={14} /> Créer ma première offre
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myOffers.map((o) => (
              <div
                key={o.id}
                className="group flex flex-col rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card transition hover:border-mint/40 hover:shadow-cardHover"
              >
                {/* Type + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-mint/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    {OFFER_TYPES[o.offer_type] || o.offer_type}
                  </span>

                  {isCompany && (
                    <button
                      onClick={() => deleteOffer(o.id)}
                      className="rounded-xl2 p-1.5 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Titre */}
                <h3 className="mt-3 line-clamp-2 font-bold text-[var(--text-app)]">{o.title}</h3>

                {/* Entreprise */}
                {o.company && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Building2 size={11} /> {o.company.name}
                  </p>
                )}

                {/* Description */}
                <p className="mt-2 flex-1 line-clamp-3 text-sm text-[var(--text-muted)]">{o.description}</p>

                {/* Meta */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-faint)]">
                  {o.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {o.city}
                    </span>
                  )}
                  {o.remote && (
                    <span className="flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
                      <Home size={10} /> Télétravail
                    </span>
                  )}
                </div>

                {/* Action */}
                {isCompany ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Users size={12} /> Candidatures
                    </span>
                    <span className="font-bold text-[var(--text-app)]">{o.applications_count || 0}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {/* ton ApplyModal si tu veux */}}
                    className="mt-4 w-full rounded-xl2 bg-mint px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
                  >
                    Postuler
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== MODAL CRÉATION ===== */}
      {showCreateModal && company && (
        <CreateOfferModal
          company={company}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            flash("Offre créée avec succès");
            load();
          }}
        />
      )}
    </AppShell>
  );
}

// ============================================
// MODAL : CRÉER UNE OFFRE
// ============================================
function CreateOfferModal({ company, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    offer_type: "internship",
    remote: true,
    country: "Madagascar",
    city: "",
    status: "published",
    application_deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.title.trim().length < 5) {
      setError("Le titre doit faire au moins 5 caractères.");
      return;
    }
    if (form.description.trim().length < 20) {
      setError("La description doit faire au moins 20 caractères.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/job-offers", {
        ...form,
        company_id: company.id,
        application_deadline: form.application_deadline || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border-app)] bg-[var(--bg-surface)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">
              Nouvelle offre
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--text-app)]">
              Publier une offre
            </h2>
            <p className="text-xs text-[var(--text-faint)]">
              pour {company.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl2 p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl2 border border-rose-500/25 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Titre */}
          <Field label="Titre de l'offre *" icon={Briefcase}>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Développeur Web Junior"
              className={inputCls}
            />
          </Field>

          {/* Type */}
          <Field label="Type d'offre *" icon={FileText}>
            <select
              value={form.offer_type}
              onChange={(e) => setForm({ ...form, offer_type: e.target.value })}
              className={inputCls}
            >
              <option value="internship">Stage</option>
              <option value="apprenticeship">Alternance</option>
              <option value="junior_mission">Mission junior</option>
              <option value="first_job">Premier emploi</option>
            </select>
          </Field>

          {/* Description */}
          <Field label="Description *" icon={FileText}>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez la mission, les compétences recherchées, les conditions..."
              className={inputCls}
            />
            <p className={`mt-1 text-xs ${
              form.description.length < 20 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-faint)]"
            }`}>
              {form.description.length} / 20 caractères minimum
            </p>
          </Field>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville" icon={MapPin}>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Antananarivo"
                className={inputCls}
              />
            </Field>
            <Field label="Pays" icon={MapPin}>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Madagascar"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Date limite */}
          <Field label="Date limite de candidature" icon={Calendar}>
            <input
              type="date"
              value={form.application_deadline}
              onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
              className={inputCls}
            />
          </Field>

          {/* Télétravail */}
          <label className="flex items-center gap-2.5 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] p-3 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="h-4 w-4 accent-mint"
            />
            <Home size={14} className="text-[var(--text-muted)]" />
            Poste en télétravail
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl2 px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-app)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl2 bg-mint px-5 py-2 text-sm font-bold text-navy-900 transition hover:bg-mint-light disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? "Publication..." : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// PETITS COMPOSANTS
// ============================================
const inputCls =
  "w-full rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {Icon && <Icon size={11} />} {label}
      </label>
      {children}
    </div>
  );
}