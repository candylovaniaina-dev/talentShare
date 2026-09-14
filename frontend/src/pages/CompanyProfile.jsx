import React, { useEffect, useState, useRef } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import { 
  Building2, MapPin, Globe, Phone, Mail, Users, 
  Edit, Camera, X, Plus, Trash2, CheckCircle, 
  AlertCircle, Star, Loader2, Save, Building, UserPlus
} from "lucide-react";

export default function CompanyProfile() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ 
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
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState("");
  const [newEmployeeLastName, setNewEmployeeLastName] = useState("");
  const [newEmployeePosition, setNewEmployeePosition] = useState("");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");
  const fileInputRef = useRef(null);

  // Charger l'entreprise et ses membres
  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Récupérer l'entreprise de l'utilisateur
      const res = await api.get("/companies/me");
      const data = res.data;
      setCompany(data);
      setForm({
        name: data.name || "",
        description: data.description || "",
        industry: data.industry || "",
        country: data.country || "Madagascar",
        city: data.city || "",
        website: data.website || "",
        address: data.address || "",
        phone: data.phone || "",
        size: data.size || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
      });
      
      // Charger les membres
      try {
        const membersRes = await api.get(`/companies/${data.id}/members`);
        setMembers(membersRes.data.data || []);
      } catch (err) {
        console.error("Erreur chargement membres:", err);
        setMembers([]);
      }

      // Charger les salariés
      try {
        const employeesRes = await api.get(`/companies/${data.id}/employees`);
        setEmployees(employeesRes.data.data || []);
      } catch (err) {
        console.error("Erreur chargement salariés:", err);
        setEmployees([]);
      }
    } catch (err) {
      // Si 404, l'utilisateur n'a pas encore d'entreprise
      if (err.response?.status === 404) {
        setCompany(null);
      } else {
        setError("Erreur lors du chargement de l'entreprise.");
        console.error("Erreur:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      let response;
      if (company) {
        response = await api.patch(`/companies/${company.id}`, form);
        setSuccess("✅ Entreprise mise à jour avec succès !");
      } else {
        response = await api.post("/companies", form);
        setSuccess("✅ Entreprise créée avec succès !");
      }
      setCompany(response.data);
      setIsEditing(false);
      loadCompany();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post(`/companies/${company.id}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCompany(response.data);
      setSuccess("✅ Logo mis à jour avec succès !");
    } catch (err) {
      setError("Erreur lors de l'upload du logo.");
    } finally {
      setUploading(false);
    }
  };

  // === Gestion des membres ===
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const userRes = await api.get(`/users/search?email=${newMemberEmail}`);
      const userData = userRes.data;

      await api.post(`/companies/${company.id}/members`, {
        user_id: userData.id,
        role: newMemberRole,
      });

      setSuccess("✅ Membre ajouté avec succès !");
      setNewMemberEmail("");
      setShowAddMember(false);
      loadCompany();
    } catch (err) {
      setError(err.response?.data?.message || "Utilisateur introuvable ou déjà membre.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;
    try {
      await api.delete(`/companies/${company.id}/members/${memberId}`);
      setSuccess("✅ Membre retiré avec succès !");
      loadCompany();
    } catch (err) {
      setError("Erreur lors du retrait du membre.");
    }
  };

  // === Gestion des salariés ===
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Vérifier si l'utilisateur existe
      let hasAccount = false;
      
      try {
        const userRes = await api.get(`/users/search?email=${newEmployeeEmail}`);
        hasAccount = true;
      } catch (err) {
        // Utilisateur non trouvé, on continue
        hasAccount = false;
      }

      // Données du salarié
      const employeeData = {
        email: newEmployeeEmail,
        first_name: newEmployeeFirstName,
        last_name: newEmployeeLastName,
        position: newEmployeePosition,
        phone: newEmployeePhone || '',
      };

      await api.post(`/companies/${company.id}/employees`, employeeData);

      setSuccess(hasAccount ? "✅ Salarié ajouté avec succès !" : "✅ Salarié ajouté (invité) !");
      setNewEmployeeEmail("");
      setNewEmployeeFirstName("");
      setNewEmployeeLastName("");
      setNewEmployeePosition("");
      setNewEmployeePhone("");
      setShowAddEmployee(false);
      loadCompany();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm("Voulez-vous vraiment retirer ce salarié ?")) return;
    try {
      await api.delete(`/companies/${company.id}/employees/${employeeId}`);
      setSuccess("✅ Salarié retiré avec succès !");
      loadCompany();
    } catch (err) {
      setError("Erreur lors du retrait du salarié.");
    }
  };

  const handleRequestVerification = async () => {
    try {
      await api.post(`/companies/${company.id}/verify`);
      setSuccess("✅ Demande de vérification envoyée !");
      loadCompany();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande.");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-navy" size={40} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative">
              {company?.logo_path ? (
                <img
                  src={`http://localhost:8000/storage/${company.logo_path}`}
                  alt={company.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                  {company?.name?.charAt(0).toUpperCase() || "🏢"}
                </div>
              )}
              {company && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-50"
                >
                  <Camera size={14} className="text-slate-500" />
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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{company?.name || "Mon entreprise"}</h1>
                {company?.is_verified && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <CheckCircle size={14} /> Vérifiée
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{company?.industry || "Secteur non renseigné"}</p>
            </div>
          </div>

          {company && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <Edit size={16} />
                {isEditing ? "Annuler" : "Modifier"}
              </button>
              {!company.is_verified && (
                <button
                  onClick={handleRequestVerification}
                  className="px-4 py-2 bg-navy text-white rounded-xl hover:bg-navy/90 text-sm font-medium"
                >
                  Demander vérification
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Formulaire de création/modification */}
        {!company || isEditing ? (
          <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
            {!company && (
              <p className="text-sm text-slate-500 mb-4">Remplissez les informations de votre entreprise</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Nom de l'entreprise *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Secteur */}
              <div>
                <label className="block text-sm font-medium mb-1">Secteur d'activité</label>
                <input
                  type="text"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Taille */}
              <div>
                <label className="block text-sm font-medium mb-1">Taille</label>
                <select
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  <option value="">Sélectionner</option>
                  <option value="1-10">1-10 employés</option>
                  <option value="11-50">11-50 employés</option>
                  <option value="51-200">51-200 employés</option>
                  <option value="201-500">201-500 employés</option>
                  <option value="501-1000">501-1000 employés</option>
                  <option value="1000+">1000+ employés</option>
                </select>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium mb-1">Pays</label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  <option value="">Sélectionner un pays</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ville */}
              <div>
                <label className="block text-sm font-medium mb-1">Ville</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  list="city-list"
                  placeholder="Tapez votre ville"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
                <datalist id="city-list">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-400 mt-1">Commencez à taper pour voir les suggestions</p>
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Site web */}
              <div>
                <label className="block text-sm font-medium mb-1">Site web</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  pattern="https?://.+"
                  title="Veuillez entrer une URL valide (ex: https://example.com)"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
                <p className="text-xs text-slate-400 mt-1">Format: https://example.com</p>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-navy text-white rounded-xl hover:bg-navy/90 flex items-center gap-2"
            >
              <Save size={18} />
              {company ? "💾 Enregistrer les modifications" : "🏢 Créer mon entreprise"}
            </button>
          </form>
        ) : (
          /* Affichage des informations */
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building size={18} className="text-navy" /> Informations générales
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Secteur :</span> {company?.industry || "Non renseigné"}</p>
                <p><span className="text-slate-500">Taille :</span> {company?.size || "Non renseigné"}</p>
                <p><span className="text-slate-500">Pays :</span> {company?.country || "Non renseigné"}</p>
                <p><span className="text-slate-500">Ville :</span> {company?.city || "Non renseigné"}</p>
                <p><span className="text-slate-500">Adresse :</span> {company?.address || "Non renseignée"}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Globe size={18} className="text-navy" /> Contact & Statut
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Site web :</span> {company?.website ? (
                  <a href={company.website} target="_blank" rel="noopener" className="text-navy hover:underline">
                    {company.website}
                  </a>
                ) : "Non renseigné"}</p>
                <p><span className="text-slate-500">Téléphone :</span> {company?.phone || "Non renseigné"}</p>
                <p><span className="text-slate-500">Latitude :</span> {company?.latitude || "Non renseignée"}</p>
                <p><span className="text-slate-500">Longitude :</span> {company?.longitude || "Non renseignée"}</p>
                <p><span className="text-slate-500">Statut :</span> 
                  <span className={`ml-1 ${company?.is_verified ? 'text-green-600' : 'text-orange-500'}`}>
                    {company?.is_verified ? '✅ Vérifiée' : '⏳ En attente de vérification'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gestion des membres */}
        {company && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users size={18} /> Membres de l'entreprise ({members.length})
              </h3>
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1 text-sm text-navy font-medium hover:underline"
              >
                <Plus size={16} /> Ajouter un membre
              </button>
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-slate-400 mt-3">Aucun membre pour l'instant.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center text-sm font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.user?.name}</p>
                        <p className="text-xs text-slate-400">{member.user?.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === "owner" ? "bg-amber-100 text-amber-700" :
                        member.role === "admin" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gestion des salariés */}
        {company && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold flex items-center gap-2">
                <UserPlus size={18} /> Salariés ({employees.length})
              </h3>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="flex items-center gap-1 text-sm text-navy font-medium hover:underline"
              >
                <Plus size={16} /> Ajouter un salarié
              </button>
            </div>

            {employees.length === 0 ? (
              <p className="text-sm text-slate-400 mt-3">Aucun salarié pour l'instant.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center text-sm font-semibold">
                        {emp.user?.name?.charAt(0).toUpperCase() || emp.first_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {emp.user?.name || `${emp.first_name} ${emp.last_name}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {emp.position || "Poste non défini"}
                          {emp.has_account === false || emp.has_account === null ? (
  <span className="ml-2 text-xs text-blue-500">(Salarié)</span>
) : (
  <span className="ml-2 text-xs text-green-500">(Compte)</span>
)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modale ajout membre */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Ajouter un membre</h3>
              <form onSubmit={handleAddMember}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email du membre</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Rôle</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Administrateur</option>
                    <option value="viewer">Visualisateur</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-navy text-white rounded-xl hover:bg-navy/90"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale ajout salarié */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Ajouter un salarié</h3>
              <form onSubmit={handleAddEmployee}>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={newEmployeeEmail}
                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    required
                    placeholder="email@exemple.com"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                  <p className="text-xs text-slate-400 mt-1">Si le compte n'existe pas, une invitation sera envoyée</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={newEmployeeFirstName}
                      onChange={(e) => setNewEmployeeFirstName(e.target.value)}
                      required
                      placeholder="Jean"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Nom *</label>
                    <input
                      type="text"
                      value={newEmployeeLastName}
                      onChange={(e) => setNewEmployeeLastName(e.target.value)}
                      required
                      placeholder="Dupont"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Poste</label>
                  <input
                    type="text"
                    value={newEmployeePosition}
                    onChange={(e) => setNewEmployeePosition(e.target.value)}
                    placeholder="Ex: Développeur"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={newEmployeePhone}
                    onChange={(e) => setNewEmployeePhone(e.target.value)}
                    placeholder="0321234567"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-navy text-white rounded-xl hover:bg-navy/90"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEmployee(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}