import React, { useEffect, useState, useRef } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import {
  Building2, MapPin, Globe, Phone, Mail, Users,
  Edit, Camera, X, Plus, Trash2, CheckCircle,
  AlertCircle, Loader2, Save, Building, UserPlus,
  Link2, Briefcase, Hash,
} from "lucide-react";

// ============================================
// CONFIG
// ============================================
const COMPANY_SIZES = [
  { value: "1-10",     label: "1-10 employés" },
  { value: "11-50",    label: "11-50 employés" },
  { value: "51-200",   label: "51-200 employés" },
  { value: "201-500",  label: "201-500 employés" },
  { value: "501-1000", label: "501-1000 employés" },
  { value: "1000+",    label: "1000+ employés" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  industry: "",
  country: "Madagascar",
  city: "",
  website: "",
  address: "",
  phone: "",
  size: "",
  latitude: "",
  longitude: "",
};

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function CompanyProfile() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // ============================================
  // CHARGEMENT
  // ============================================
  useEffect(() => { loadCompany(); }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/companies/me");
      const data = res.data;
      setCompany(data);

      try {
        const membersRes = await api.get(`/companies/${data.id}/members`);
        setMembers(membersRes.data.data || []);
      } catch { setMembers([]); }

      try {
        const employeesRes = await api.get(`/companies/${data.id}/employees`);
        setEmployees(employeesRes.data.data || []);
      } catch { setEmployees([]); }
    } catch (err) {
      if (err.response?.status === 404) {
        setCompany(null);
        setShowFormModal(true); // Ouvre le modal si pas d'entreprise
      } else {
        setError("Erreur lors du chargement de l'entreprise.");
      }
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg, type = "success") => {
    if (type === "error") { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  // ============================================
  // UPLOAD LOGO
  // ============================================
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post(`/companies/${company.id}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      flash("✅ Logo mis à jour");
      loadCompany();
    } catch {
      flash("Erreur lors de l'upload du logo", "error");
    }
  };

  // ============================================
  // MEMBRES
  // ============================================
  const handleRemoveMember = async (memberId) => {
    if (!confirm("Retirer ce membre ?")) return;
    try {
      await api.delete(`/companies/${company.id}/members/${memberId}`);
      flash("Membre retiré");
      loadCompany();
    } catch { flash("Erreur", "error"); }
  };

  // ============================================
  // SALARIÉS
  // ============================================
  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm("Retirer ce salarié ?")) return;
    try {
      await api.delete(`/companies/${company.id}/employees/${employeeId}`);
      flash("Salarié retiré");
      loadCompany();
    } catch { flash("Erreur", "error"); }
  };

  // ============================================
  // VÉRIFICATION
  // ============================================
  const handleRequestVerification = async () => {
    try {
      await api.post(`/companies/${company.id}/verify`);
      flash("✅ Demande de vérification envoyée");
      loadCompany();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    }
  };

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
        </div>
      </AppShell>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">

        {/* Flash messages */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" /> {success}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative">
              {company?.logo_path ? (
                <img
                  src={`http://localhost:8000/storage/${company.logo_path}`}
                  alt={company.name}
                  className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-bold text-white">
                  {company?.name?.charAt(0).toUpperCase() || "🏢"}
                </div>
              )}
              {company && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full border border-white/20 bg-[#0F1E45] p-1.5 text-slate-300 shadow-lg transition hover:bg-[#1a2b5a]"
                >
                  <Camera size={14} />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {company?.name || "Mon entreprise"}
                </h1>
                {company?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    <CheckCircle size={11} /> Vérifiée
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {company?.industry || "Secteur non renseigné"}
              </p>
            </div>
          </div>

          {/* Actions */}
          {company && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFormModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
              >
                <Edit size={15} /> Modifier
              </button>
              {!company.is_verified && (
                <button
                  onClick={handleRequestVerification}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
                >
                  <CheckCircle size={15} /> Demander vérification
                </button>
              )}
            </div>
          )}
        </div>

        {/* Si pas d'entreprise */}
        {!company ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
              <Building2 size={26} />
            </span>
            <p className="mt-4 font-semibold text-white">Aucune entreprise</p>
            <p className="mt-1 text-sm text-slate-500">Créez votre profil entreprise pour commencer.</p>
            <button
              onClick={() => setShowFormModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              <Plus size={15} /> Créer mon entreprise
            </button>
          </div>
        ) : (
          <>
            {/* Grille Infos */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card icon={Building} title="Informations générales">
                <InfoRow label="Secteur" value={company.industry} />
                <InfoRow label="Taille" value={company.size} />
                <InfoRow label="Pays" value={company.country} />
                <InfoRow label="Ville" value={company.city} />
                <InfoRow label="Adresse" value={company.address} />
              </Card>

              <Card icon={Globe} title="Contact & Statut">
                <InfoRow
                  label="Site web"
                  value={company.website ? (
                    <a href={company.website} target="_blank" rel="noopener" className="text-emerald-400 hover:underline">
                      {company.website}
                    </a>
                  ) : null}
                />
                <InfoRow label="Téléphone" value={company.phone} />
                <InfoRow label="Statut" value={
                  <span className={company.is_verified ? "text-emerald-400" : "text-amber-400"}>
                    {company.is_verified ? "✅ Vérifiée" : "⏳ En attente"}
                  </span>
                } />
              </Card>
            </div>

            {/* Membres */}
            <div className="mt-6">
              <Card
                icon={Users}
                title={`Membres (${members.length})`}
                action={
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                }
              >
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun membre pour l'instant.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                            {member.user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{member.user?.name}</p>
                            <p className="text-xs text-slate-500">{member.user?.email}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            member.role === "owner" ? "bg-amber-500/10 text-amber-300" :
                            member.role === "admin" ? "bg-blue-500/10 text-blue-300" :
                            "bg-slate-500/10 text-slate-400"
                          }`}>
                            {member.role}
                          </span>
                        </div>
                        {member.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Salariés */}
            <div className="mt-6">
              <Card
                icon={UserPlus}
                title={`Salariés (${employees.length})`}
                action={
                  <button
                    onClick={() => setShowAddEmployee(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                }
              >
                {employees.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun salarié pour l'instant.</p>
                ) : (
                  <div className="space-y-2">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                            {emp.user?.name?.charAt(0).toUpperCase() || emp.first_name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">
                              {emp.user?.name || `${emp.first_name} ${emp.last_name}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {emp.position || "Poste non défini"}
                              {!emp.has_account && <span className="ml-2 text-blue-400">(Salarié)</span>}
                              {emp.has_account && <span className="ml-2 text-emerald-400">(Compte)</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Modal création/modification */}
      {showFormModal && (
        <CompanyFormModal
          company={company}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false);
            flash(company ? "✅ Entreprise mise à jour" : "✅ Entreprise créée");
            loadCompany();
          }}
        />
      )}

      {/* Modal ajout membre */}
      {showAddMember && (
        <AddMemberModal
          companyId={company.id}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => { setShowAddMember(false); loadCompany(); }}
        />
      )}

      {/* Modal ajout salarié */}
      {showAddEmployee && (
        <AddEmployeeModal
          companyId={company.id}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => { setShowAddEmployee(false); loadCompany(); }}
        />
      )}
    </AppShell>
  );
}

// ============================================
// MODAL : CRÉATION/MODIFICATION ENTREPRISE
// ============================================
function CompanyFormModal({ company, onClose, onSuccess }) {
  const isEditing = !!company;
  const [form, setForm] = useState(
    company ? {
      name: company.name || "",
      description: company.description || "",
      industry: company.industry || "",
      country: company.country || "Madagascar",
      city: company.city || "",
      website: company.website || "",
      address: company.address || "",
      phone: company.phone || "",
      size: company.size || "",
      latitude: company.latitude || "",
      longitude: company.longitude || "",
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // ✅ NETTOYAGE : chaîne vide → null pour éviter les erreurs de validation
    const payload = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined) {
        payload[key] = null;
      }
    });
    // name reste requis
    payload.name = form.name;

    try {
      if (isEditing) {
        await api.patch(`/companies/${company.id}`, payload);
      } else {
        await api.post("/companies", payload);
      }
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || "Erreur lors de l'enregistrement.";
      setError(message);
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
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">
              {isEditing ? "Modifier l'entreprise" : "Nouvelle entreprise"}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-white">
              {isEditing ? company.name : "Créer mon entreprise"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? "Mettez à jour les informations" : "Remplissez les informations de votre entreprise"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Nom */}
          <Field icon={Building} label="Nom de l'entreprise *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field icon={Briefcase} label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
              placeholder="Décrivez votre entreprise..."
            />
          </Field>

          {/* Secteur + Taille */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Briefcase} label="Secteur d'activité">
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className={inputCls}
                placeholder="Ex: Informatique"
              />
            </Field>
            <Field icon={Users} label="Taille">
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className={inputCls}
              >
                <option value="">Sélectionner</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Pays + Ville */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Globe} label="Pays">
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={inputCls}
              >
                <option value="">Sélectionner</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field icon={MapPin} label="Ville">
              <input
                type="text"
                list="city-list-modal"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
              />
              <datalist id="city-list-modal">
                {cities.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
          </div>

          {/* Adresse */}
          <Field icon={MapPin} label="Adresse">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls}
            />
          </Field>

          {/* Site web + Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Link2} label="Site web">
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
                className={inputCls}
              />
            </Field>
            <Field icon={Phone} label="Téléphone">
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+261 34 12 345 67"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Latitude + Longitude */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Hash} label="Latitude (optionnel)">
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className={inputCls}
                placeholder="-18.9137"
              />
            </Field>
            <Field icon={Hash} label="Longitude (optionnel)">
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className={inputCls}
                placeholder="47.5361"
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-white/10 bg-[#0F1E45] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer mon entreprise"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODAL AJOUT MEMBRE
// ============================================
function AddMemberModal({ companyId, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const userRes = await api.get(`/users/search?email=${email}`);
      await api.post(`/companies/${companyId}/members`, {
        user_id: userRes.data.id,
        role,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Utilisateur introuvable ou déjà membre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Ajouter un membre" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field icon={Mail} label="Email du membre *">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field icon={Users} label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
            <option value="viewer">Visualisateur</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-white/5">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============================================
// MODAL AJOUT SALARIÉ
// ============================================
function AddEmployeeModal({ companyId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    email: "", first_name: "", last_name: "", position: "", phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      payload.email = form.email;
      payload.first_name = form.first_name;
      payload.last_name = form.last_name;

      await api.post(`/companies/${companyId}/employees`, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Ajouter un salarié" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field icon={Mail} label="Email *">
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemple.com" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Users} label="Prénom *">
            <input type="text" required value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className={inputCls} />
          </Field>
          <Field icon={Users} label="Nom *">
            <input type="text" required value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={inputCls} />
          </Field>
        </div>
        <Field icon={Briefcase} label="Poste">
          <input type="text" value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Ex: Développeur" className={inputCls} />
        </Field>
        <Field icon={Phone} label="Téléphone">
          <input type="text" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0321234567" className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-white/5">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============================================
// COMPOSANTS UI
// ============================================
const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

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

function Card({ icon: Icon, title, action, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          {Icon && <Icon size={13} />} {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-white">{value || <span className="text-slate-600">—</span>}</span>
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F1E45] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}