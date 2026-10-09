import React, { useEffect, useState } from "react";
import {
  X, Send, Save, User, Building2, Calendar, AlertCircle,
  Plus, MapPin, Wallet, Zap, Loader2,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ============================================================
   MODAL : Créer un besoin (entreprise OU talent)
============================================================ */
export default function CreateResourceRequestModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [myCompany, setMyCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isTalent = user?.role === "student" || user?.role === "employee";
  const isCompany = user?.role === "company";

  const [form, setForm] = useState({
    company_id: "",
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    workload_percent: 100,
    remote: false,
    country: "",
    city: "",
    budget_min: "",
    budget_max: "",
    urgency: "normal",
    skills: [],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (isCompany) {
      api.get("/companies/me")
        .then((res) => {
          setMyCompany(res.data);
          if (res.data?.id) setForm((f) => ({ ...f, company_id: res.data.id }));
        })
        .catch(() => setMyCompany(null))
        .finally(() => setLoadingCompany(false));
    } else {
      setLoadingCompany(false);
    }
  }, [isCompany]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm({
      ...form,
      skills: [...form.skills, { name: newSkill.trim(), min_level: "intermediate" }],
    });
    setNewSkill("");
  };

  const removeSkill = (i) => {
    setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) });
  };

  const submit = async (status) => {
    setError(null);

    if (isCompany && !form.company_id) {
      setError("Vous devez d'abord créer votre entreprise.");
      return;
    }
    if (!form.title || !form.description || !form.start_at || !form.end_at) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_id: isCompany ? form.company_id : null,
        title: form.title,
        description: form.description,
        start_at: form.start_at,
        end_at: form.end_at,
        workload_percent: Number(form.workload_percent) || 100,
        remote: form.remote,
        country: form.country || null,
        city: form.city || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        urgency: form.urgency,
        status,
        skills: form.skills,
      };

      const res = await api.post("/resource-requests", payload);
      showToast(
        status === "draft" ? "💾 Brouillon enregistré" : "✅ Besoin publié",
        "success"
      );
      onSuccess?.(res.data);
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      setError(msg || (errors ? Object.values(errors).flat().join(" · ") : "Erreur"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============ HEADER ============ */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
              {isTalent ? <User size={16} /> : <Building2 size={16} />}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Publier un besoin
              </p>
              <h2 className="mt-0.5 text-base font-bold text-[var(--text-app)]">
                {isTalent ? "Décrivez votre recherche" : "Décrivez votre besoin"}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Publié en tant que{" "}
                <span className="font-semibold text-[var(--text-app)]">
                  {isTalent ? user?.name : (myCompany?.name || "…")}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ============ BODY ============ */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">

          {loadingCompany && isCompany ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-emerald-400" size={24} />
            </div>
          ) : (
            <>
              {isCompany && !myCompany && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Vous devez créer votre entreprise d'abord.{" "}
                    <a href="/company" className="underline font-semibold">Créer mon entreprise →</a>
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    isTalent
                      ? "Ex : Recherche stage développeur web"
                      : "Ex : Recherche développeur React senior"
                  }
                  className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  Description *
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre besoin en détail..."
                  className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none resize-none"
                />
              </div>

              {/* Compétences */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  Compétences recherchées
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Ex : React, Node.js..."
                    className="flex-1 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-lg bg-navy px-3 text-white text-sm font-semibold hover:bg-navy-light transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {form.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.skills.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-400"
                      >
                        {s.name}
                        <button
                          onClick={() => removeSkill(i)}
                          className="text-emerald-400/70 hover:text-rose-400"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Période */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <Calendar size={11} /> Début *
                  </label>
                  <input
                    type="date"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <Calendar size={11} /> Fin *
                  </label>
                  <input
                    type="date"
                    min={form.start_at}
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lieu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <MapPin size={11} /> Pays
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="France, Madagascar..."
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <MapPin size={11} /> Ville
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Paris, Antananarivo..."
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <Wallet size={11} /> Budget min (€/jour)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget_min}
                    onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <Wallet size={11} /> Budget max (€/jour)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget_max}
                    onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Charge + Télétravail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    Charge : {form.workload_percent}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={form.workload_percent}
                    onChange={(e) => setForm({ ...form, workload_percent: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    <Zap size={11} /> Urgence
                  </label>
                  <select
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--text-app)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
                🏠 Télétravail possible
              </label>
            </>
          )}
        </div>

        {/* ============ FOOTER ============ */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submit("draft")}
              disabled={submitting || loadingCompany || (isCompany && !myCompany)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-app)] px-4 py-2 text-sm font-semibold text-[var(--text-app)] hover:border-emerald-500/40 disabled:opacity-50 transition"
            >
              <Save size={14} /> Brouillon
            </button>
            <button
              type="button"
              onClick={() => submit("published")}
              disabled={submitting || loadingCompany || (isCompany && !myCompany)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Publication...
                </>
              ) : (
                <>
                  <Send size={14} /> Publier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}