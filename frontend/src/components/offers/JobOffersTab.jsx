import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Briefcase, MapPin, Building2, Plus, X, Loader2,
  Home, Calendar, Users, Trash2, CheckCircle2,
  FileText, ChevronRight, AlertCircle, Clock,
  Eye, Pencil, Send, Ban, UserCheck,
} from "lucide-react";

const OFFER_TYPES = {
  internship:     "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job:      "Premier emploi",
};

const STATUS_LABELS = {
  draft:     { label: "Brouillon",  badge: "border-slate-500/30 bg-slate-500/10 text-slate-300" },
  published: { label: "Publiée",    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  closed:    { label: "Clôturée",   badge: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
  expired:   { label: "Expirée",    badge: "border-slate-500/30 bg-slate-500/10 text-slate-400" },
};

export default function JobOffersTab() {
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isCompany) return;
    api.get("/companies/me")
      .then((res) => setCompany(res.data))
      .catch(() => setCompany(null));
  }, [isCompany]);

  const load = () => {
    setLoading(true);
    const endpoint = isCompany ? "/job-offers/my" : "/job-offers";
    api.get(endpoint)
      .then((res) => setOffers(res.data.data || res.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [isCompany]);

  const myOffers = offers;

  const deleteOffer = async (id) => {
    if (!confirm("Supprimer cette offre ? Cette action est irréversible.")) return;
    try {
      await api.delete(`/job-offers/${id}`);
      flash("Offre supprimée");
      setSelectedOffer(null);
      load();
    } catch {
      flash("Erreur lors de la suppression", "error");
    }
  };

  const toggleStatus = async (offer) => {
    const newStatus = offer.status === "published" ? "closed" : "published";
    try {
      await api.patch(`/job-offers/${offer.id}`, { status: newStatus });
      flash(newStatus === "published" ? "Offre publiée" : "Offre clôturée");
      load();
      if (selectedOffer?.id === offer.id) {
        setSelectedOffer({ ...selectedOffer, status: newStatus });
      }
    } catch {
      flash("Erreur", "error");
    }
  };

  return (
    <>
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

      {/* Warning entreprise manquante */}
      {isCompany && !company && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="text-sm text-amber-200">
            <p className="font-semibold">Aucune entreprise liée à votre compte</p>
            <a href="/company" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 underline">
              Créer mon entreprise <ChevronRight size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Section header + action */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isCompany ? "Offres publiées" : "Offres disponibles"}
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {myOffers.length}
          </span>
        </div>

        {isCompany && company && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <Plus size={13} /> Créer une offre
          </button>
        )}
      </div>

      {/* Liste */}
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
            {isCompany ? "Cliquez sur « Créer une offre » pour commencer." : "Revenez plus tard."}
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
          {myOffers.map((o) => {
            const statusCfg = STATUS_LABELS[o.status] || STATUS_LABELS.published;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOffer(o)}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
              >
                {/* En-tête : type + statut */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    {OFFER_TYPES[o.offer_type] || o.offer_type}
                  </span>
                  {isCompany && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </span>
                  )}
                </div>

                {/* Titre */}
                <h3 className="mt-3 line-clamp-2 font-bold text-white group-hover:text-emerald-300 transition">
                  {o.title}
                </h3>

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
                    <span className="flex items-center gap-1"><MapPin size={11} /> {o.city}</span>
                  )}
                  {o.remote && (
                    <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-300">
                      <Home size={10} /> Télétravail
                    </span>
                  )}
                </div>

                {/* Bas de carte */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                  {isCompany ? (
                    /* ✅ LIEN VERS CANDIDATURES */
                    <Link
                      to={`/job-offers/${o.id}/applications`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      <Users size={12} />
                      {o.applications_count || 0} candidature{(o.applications_count || 0) > 1 ? "s" : ""}
                      <ChevronRight size={12} />
                    </Link>
                  ) : (
                    <span className="text-slate-500">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ✅ MODAL DÉTAIL */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          isCompany={isCompany}
          onClose={() => setSelectedOffer(null)}
          onDelete={() => deleteOffer(selectedOffer.id)}
          onToggleStatus={() => toggleStatus(selectedOffer)}
        />
      )}

      {/* MODAL CRÉATION */}
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
    </>
  );
}

// ============================================
// MODAL : DÉTAIL DE L'OFFRE
// ============================================
function OfferDetailModal({ offer, isCompany, onClose, onDelete, onToggleStatus }) {
  const statusCfg = STATUS_LABELS[offer.status] || STATUS_LABELS.published;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#0F1E45] px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                {OFFER_TYPES[offer.offer_type] || offer.offer_type}
              </span>
              {isCompany && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.badge}`}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">{offer.title}</h2>
            {offer.company && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <Building2 size={13} /> {offer.company.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">

          {/* Description */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <FileText size={11} /> Description
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {offer.description || "Aucune description fournie."}
            </p>
          </section>

          {/* Informations */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Briefcase size={11} /> Informations
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {offer.city && (
                <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Lieu</p>
                    <p className="text-sm text-white">{offer.city}{offer.country && `, ${offer.country}`}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3">
                <Home size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Télétravail</p>
                  <p className="text-sm text-white">{offer.remote ? "Oui" : "Non"}</p>
                </div>
              </div>

              {offer.application_deadline && (
                <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3">
                  <Calendar size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Date limite</p>
                    <p className="text-sm text-white">{formatDate(offer.application_deadline)}</p>
                  </div>
                </div>
              )}

              {offer.duration_text && (
                <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3">
                  <Clock size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Durée</p>
                    <p className="text-sm text-white">{offer.duration_text}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Compétences */}
          {offer.skills?.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <CheckCircle2 size={11} /> Compétences recherchées
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {offer.skills.map((s) => (
                  <span key={s.id} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    {s.name}
                    {s.pivot?.min_level && <span className="ml-1 text-emerald-400/70">· {s.pivot.min_level}</span>}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Statistiques (entreprise) */}
          {isCompany && (
            <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Users size={18} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Candidatures reçues</p>
                    <p className="text-2xl font-bold text-white">{offer.applications_count || 0}</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Actions */}
        {isCompany && (
          <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-[#0F1E45] px-6 py-4">
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 size={13} /> Supprimer
            </button>

            <button
              onClick={onToggleStatus}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                offer.status === "published"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              {offer.status === "published" ? (
                <><Ban size={13} /> Clôturer</>
              ) : (
                <><Send size={13} /> Publier</>
              )}
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MODAL CRÉATION
// ============================================
function CreateOfferModal({ company, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "", description: "", offer_type: "internship",
    remote: true, country: "Madagascar", city: "",
    status: "published", application_deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.title.trim().length < 5) return setError("Titre : 5 caractères minimum.");
    if (form.description.trim().length < 20) return setError("Description : 20 caractères minimum.");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0F1E45] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Nouvelle offre</p>
            <h2 className="mt-0.5 text-lg font-bold text-white">Publier une offre</h2>
            <p className="text-xs text-slate-500">pour {company.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <Field label="Titre de l'offre *" icon={Briefcase}>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Développeur Web Junior" className={inputCls} />
          </Field>

          <Field label="Type d'offre *" icon={FileText}>
            <select value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value })} className={inputCls}>
              <option value="internship">Stage</option>
              <option value="apprenticeship">Alternance</option>
              <option value="junior_mission">Mission junior</option>
              <option value="first_job">Premier emploi</option>
            </select>
          </Field>

          <Field label="Description *" icon={FileText}>
            <textarea required rows={4} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez la mission..." className={inputCls} />
            <p className={`mt-1 text-xs ${form.description.length < 20 ? "text-amber-400" : "text-slate-500"}`}>
              {form.description.length} / 20 caractères minimum
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville" icon={MapPin}>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Antananarivo" className={inputCls} />
            </Field>
            <Field label="Pays" icon={MapPin}>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Madagascar" className={inputCls} />
            </Field>
          </div>

          <Field label="Date limite" icon={Calendar}>
            <input type="date" value={form.application_deadline}
              onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} className={inputCls} />
          </Field>

          <label className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <input type="checkbox" checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="h-4 w-4 accent-emerald-500" />
            <Home size={14} className="text-slate-400" /> Poste en télétravail
          </label>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? "Publication..." : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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