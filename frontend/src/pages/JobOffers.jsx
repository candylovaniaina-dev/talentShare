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
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {isCompany ? "Espace entreprise" : "Espace talent"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {isCompany ? "Mes offres d'emploi" : "Offres de stages & emplois"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
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
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} /> Créer une offre
            </button>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            toast.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Warning si entreprise mais pas de profil entreprise */}
        {isCompany && !company && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold">Aucune entreprise liée à votre compte</p>
              <p className="mt-1 text-xs text-amber-300/80">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isCompany ? "Offres publiées" : "Offres disponibles"}
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {myOffers.length}
          </span>
        </div>

        {/* ===== LISTE ===== */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : myOffers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
              <Briefcase size={26} />
            </span>
            <p className="mt-4 font-semibold text-white">
              {isCompany ? "Aucune offre publiée pour l'instant" : "Aucune opportunité pour le moment"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isCompany
                ? "Cliquez sur « Créer une offre » pour commencer."
                : "Revenez plus tard, de nouvelles offres arrivent bientôt."}
            </p>
            {isCompany && company && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
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
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
              >
                {/* Type + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    {OFFER_TYPES[o.offer_type] || o.offer_type}
                  </span>

                  {isCompany && (
                    <button
                      onClick={() => deleteOffer(o.id)}
                      className="rounded-lg p-1.5 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Titre */}
                <h3 className="mt-3 line-clamp-2 font-bold text-white">{o.title}</h3>

                {/* Entreprise */}
                {o.company && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Building2 size={11} /> {o.company.name}
                  </p>
                )}

                {/* Description */}
                <p className="mt-2 flex-1 line-clamp-3 text-sm text-slate-400">{o.description}</p>

                {/* Meta */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {o.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {o.city}
                    </span>
                  )}
                  {o.remote && (
                    <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-300">
                      <Home size={10} /> Télétravail
                    </span>
                  )}
                </div>

                {/* Action */}
                {isCompany ? (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users size={12} /> Candidatures
                    </span>
                    <span className="font-bold text-white">{o.applications_count || 0}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {/* ton ApplyModal si tu veux */}}
                    className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0F1E45] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Nouvelle offre
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-white">
              Publier une offre
            </h2>
            <p className="text-xs text-slate-500">
              pour {company.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
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
              form.description.length < 20 ? "text-amber-400" : "text-slate-500"
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
          <label className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
            <Home size={14} className="text-slate-400" />
            Poste en télétravail
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
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
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {Icon && <Icon size={11} />} {label}
      </label>
      {children}
    </div>
  );
}