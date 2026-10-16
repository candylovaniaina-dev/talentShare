import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Save, User, Building2, Calendar, FileText, AlertCircle } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

const asArray = (data) => Array.isArray(data) ? data : (data?.data || []);

export default function CreateProposal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { toast, show: showToast, close: closeToast } = useToast();

  const [form, setForm] = useState({
    professional_profile_id: "",
    to_company_id: "",
    message: "",
    description: "",
    conditions: "",
    start_at: "",
    end_at: "",
    workload_percent: 100,
    remote: false,
    expires_at: "",
  });

  useEffect(() => {
    api.get("/companies/me")
      .then((res) => setCompany(res.data))
      .catch(() => setCompany(null));

    api.get("/companies/me/employees")
      .then((res) => {
        const list = asArray(res.data.data || res.data);
        setEmployees(list.map((e) => ({
          profile_id: e.user?.professional_profile?.id || e.user?.professionalProfile?.id,
          name: e.user?.name || `${e.first_name} ${e.last_name}`,
          headline: e.position || e.user?.professional_profile?.headline,
        })).filter((t) => t.profile_id));
      })
      .catch(() => setEmployees([]));

    api.get("/companies", { params: { per_page: 100 } })
      .then((res) => setAllCompanies(asArray(res.data)))
      .catch(() => setAllCompanies([]));
  }, []);

  const submit = async (status) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/proposals", {
        ...form,
        proposed_by_company_id: company.id,
        status,
        workload_percent: Number(form.workload_percent) || 100,
      });
      showToast(
        status === "draft" ? "💾 Brouillon enregistré" : "✅ Proposition envoyée",
        "success"
      );
      // ✅ Redirection vers la page détail
      setTimeout(() => navigate(`/proposals/${res.data.id}`), 1200);
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      setError(msg || (errors ? Object.values(errors).flat().join(" · ") : "Erreur"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return (
      <AppShell>
        <p className="p-6 text-slate-500">Créez d'abord votre entreprise.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={15} /> Retour
        </button>

        <h1 className="text-2xl font-bold">Nouvelle proposition</h1>
        <p className="mt-1 text-sm text-slate-500">
          Proposez un de vos salariés à une autre entreprise.
        </p>

        <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          {/* Salarié */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <User size={14} /> Salarié à proposer *
            </label>
            <select
              required
              value={form.professional_profile_id}
              onChange={(e) => setForm({ ...form, professional_profile_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">— Sélectionner un salarié —</option>
              {employees.map((e) => (
                <option key={e.profile_id} value={e.profile_id}>
                  {e.name} {e.headline ? `· ${e.headline}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Entreprise destinataire */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 size={14} /> Entreprise destinataire *
            </label>
            <select
              required
              value={form.to_company_id}
              onChange={(e) => setForm({ ...form, to_company_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">— Sélectionner une entreprise —</option>
              {allCompanies
                .filter((c) => c.id !== company.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `· ${c.city}` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium">Message d'accompagnement</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Bonjour, nous pensons que..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du besoin et du profil proposé..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Début</label>
              <input
                type="date"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fin</label>
              <input
                type="date"
                min={form.start_at}
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          </div>

          {/* Charge */}
          <div>
            <label className="text-sm font-medium">Charge : {form.workload_percent}%</label>
            <input
              type="range" min="10" max="100" step="10"
              value={form.workload_percent}
              onChange={(e) => setForm({ ...form, workload_percent: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
            />
            🏠 Télétravail possible
          </label>

          {/* Conditions */}
          <div>
            <label className="text-sm font-medium">Conditions</label>
            <textarea
              rows={3}
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="Modalités particulières, contacts..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          {/* Expiration */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={14} /> Expiration (optionnel)
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-400">Par défaut : 30 jours après envoi</p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => submit("draft")}
              disabled={submitting || !form.professional_profile_id || !form.to_company_id}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={14} /> Brouillon
            </button>
            <button
              onClick={() => submit("sent")}
              disabled={submitting || !form.professional_profile_id || !form.to_company_id}
              className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={14} /> {submitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}