import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import {
  Building2, MapPin, Globe, Phone, Users, Edit, Camera, X, Plus,
  Trash2, CheckCircle, AlertCircle, Loader2, Save, Building,
  Link2, Briefcase, Hash, ShieldCheck, Eye, ExternalLink,
  TrendingUp, Search, Mail, ArrowRight, UserPlus, Award,
  Sparkles, Layers, Star, Calendar, FileText,
  Home, Clock, Heart, MessageCircle, Send, BadgeCheck,
  Quote, Zap, Euro,
} from "lucide-react";

/* ============================================
   CONFIG
============================================ */
const COMPANY_SIZES = [
  { value: "1-10",     label: "1-10 employés" },
  { value: "11-50",    label: "11-50 employés" },
  { value: "51-200",   label: "51-200 employés" },
  { value: "201-500",  label: "201-500 employés" },
  { value: "501-1000", label: "501-1000 employés" },
  { value: "1000+",    label: "1000+ employés" },
];

const EMPTY_FORM = {
  name: "", description: "", industry: "", country: "Madagascar", city: "",
  website: "", address: "", phone: "", size: "", latitude: "", longitude: "",
};

const TABS = [
  { id: "home",     label: "Accueil",   icon: Home,     color: "text-emerald-400" },
  { id: "requests", label: "Demande",   icon: Layers,   color: "text-amber-400" },
  { id: "feed",     label: "Actualité", icon: Sparkles, color: "text-blue-400" },
];

/* ============================================
   AVATAR
============================================ */
function Avatar({ path, name, size = "md", rounded = "full" }) {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };
  const roundedCls = rounded === "full" ? "rounded-full" : "rounded-lg";
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`http://localhost:8000/storage/${path}`}
        alt={name}
        className={`${sizes[size]} shrink-0 ${roundedCls} border border-[var(--border-app)] object-cover`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} ${roundedCls} flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white`}>
      {initials}
    </div>
  );
}

/* ============================================
   PAGE PRINCIPALE
============================================ */
export default function CompanyProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [applyOffer, setApplyOffer] = useState(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("home");

  const [feedOffers, setFeedOffers] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => { loadCompany(); }, []);

  useEffect(() => {
    if (!company) return;
    if (activeTab === "home") loadFeed("mine");
    if (activeTab === "feed") loadFeed("others");
    if (activeTab === "requests") loadRequests();
  }, [company, activeTab]);

  const loadFeed = async (mode = "mine") => {
    try {
      setLoadingFeed(true);
      const params = { per_page: 20 };
      if (mode === "mine")   params.only_mine = 1;
      if (mode === "others") params.exclude_mine = 1;

      const res = await api.get("/job-offers", { params });
      setFeedOffers(res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement feed:", err);
      setFeedOffers([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get("/resource-requests?per_page=30");
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
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
        setShowFormModal(true);
      } else {
        showToast("Erreur de chargement", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      showToast("Format non supporté", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image trop lourde (2 Mo max)", "error");
      e.target.value = "";
      return;
    }
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const response = await api.post(`/companies/${company.id}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCompany(response.data.data || response.data);
      showToast("Logo mis à jour", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm("Supprimer le logo ?")) return;
    try {
      const res = await api.delete(`/companies/${company.id}/logo`);
      setCompany(res.data.data);
      showToast("Logo supprimé", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Retirer ce membre ?")) return;
    try {
      await api.delete(`/companies/${company.id}/members/${memberId}`);
      showToast("Membre retiré", "success");
      loadCompany();
    } catch { showToast("Erreur", "error"); }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm("Retirer ce salarié ?")) return;
    try {
      await api.delete(`/companies/${company.id}/employees/${employeeId}`);
      showToast("Salarié retiré", "success");
      loadCompany();
    } catch { showToast("Erreur", "error"); }
  };

  const handleRequestVerification = async () => {
    try {
      await api.post(`/companies/${company.id}/verify`);
      showToast("Demande envoyée", "success");
      loadCompany();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
        </div>
      </AppShell>
    );
  }

  if (!company) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Building2 size={30} />
            </span>
            <h1 className="mt-4 text-xl font-bold text-[var(--text-app)]">
              Créez votre entreprise
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Rejoignez le réseau TalentShare et commencez à recruter.
            </p>
            <button
              onClick={() => setShowFormModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              <Plus size={15} /> Créer mon entreprise
            </button>
          </div>
        </div>
        {showFormModal && (
          <CompanyFormModal company={null} onClose={() => setShowFormModal(false)} onSuccess={() => { setShowFormModal(false); loadCompany(); }} />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr_280px]">

        {/* COLONNE GAUCHE */}
        <aside className="hidden space-y-4 lg:block">
          <div className="overflow-hidden rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
            <div className="h-16 bg-gradient-to-r from-emerald-500/40 to-blue-500/30" />

            <div className="-mt-9 px-4 pb-4">
              <div
                className="group relative inline-block cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {company.logo_path ? (
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border-4 border-[var(--bg-surface)] bg-white shadow-lg">
                    <img
                      src={`http://localhost:8000/storage/${company.logo_path}`}
                      alt={company.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-[var(--bg-surface)] bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white shadow-lg">
                    {company.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100">
                  {uploadingLogo ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
                </div>
                <input ref={fileInputRef} type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
              </div>

              <h2 className="mt-3 truncate text-base font-bold text-[var(--text-app)]">
                {company.name}
              </h2>
              {company.industry && (
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {company.industry}
                </p>
              )}
              {(company.city || company.country) && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
                  <MapPin size={10} />
                  <span className="truncate">
                    {company.city && company.country
                      ? `${company.city}, ${company.country}`
                      : company.city || company.country}
                  </span>
                </p>
              )}

              {company.is_verified ? (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck size={11} /> Entreprise vérifiée
                </div>
              ) : (
                <button
                  onClick={handleRequestVerification}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] font-semibold text-amber-400 transition hover:bg-amber-500/20"
                >
                  <AlertCircle size={11} /> Demander la vérification
                </button>
              )}
            </div>

            <div className="border-t border-[var(--border-app)] p-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAllMembers(true)}
                  className="rounded-lg bg-[var(--bg-surface-hover)] p-2.5 text-left transition hover:bg-[var(--bg-surface)]"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Membres</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-400">{members.length}</p>
                </button>
                <button
                  onClick={() => setShowAllEmployees(true)}
                  className="rounded-lg bg-[var(--bg-surface-hover)] p-2.5 text-left transition hover:bg-[var(--bg-surface)]"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Salariés</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-400">{employees.length}</p>
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border-app)] p-3 space-y-2">
              <button
                onClick={() => setShowFormModal(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-xs font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
              >
                <Edit size={12} /> Modifier
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-app)]">
              <Building size={13} className="text-emerald-400" /> Informations
            </p>
            <div className="mt-3 space-y-2.5 text-xs">
              {company.size && (
                <div className="flex items-start gap-2">
                  <Users size={12} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                  <span className="text-[var(--text-muted)]">
                    {COMPANY_SIZES.find((s) => s.value === company.size)?.label || company.size}
                  </span>
                </div>
              )}
              {company.website && (
                <div className="flex items-start gap-2">
                  <Globe size={12} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="truncate text-emerald-400 hover:underline">
                    {company.website}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={12} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                  <span className="text-[var(--text-muted)]">{company.phone}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                  <span className="text-[var(--text-muted)]">{company.address}</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* COLONNE CENTRALE */}
        <div className="min-w-0 space-y-4">

          {/* Composer + onglets */}
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-3">
              <Avatar path={company.logo_path} name={company.name} size="md" rounded="lg" />
              <button
                onClick={() => setShowCreateOffer(true)}
                className="flex-1 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)] hover:border-emerald-500/40"
              >
                Publier une offre...
              </button>
            </div>

            <div className="mt-3 flex items-center justify-around border-t border-[var(--border-app)] pt-3">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active ? t.color : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
                    }`}
                  >
                    <Icon size={14} className={active ? t.color : "text-[var(--text-faint)]"} />
                    {t.label}
                    {active && (
                      <span className={`absolute inset-x-2 -bottom-[13px] h-[2px] rounded-full ${
                        t.id === "home" ? "bg-emerald-400" : t.id === "requests" ? "bg-amber-400" : "bg-blue-400"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ONGLET ACCUEIL */}
          {activeTab === "home" && (
            <>
              {company.description && (
                <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Building size={12} /> À propos
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    {company.description}
                  </p>
                </div>
              )}

              <TestimonialsSection companyId={company.id} />

              <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
                <p className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <TrendingUp size={12} /> Activité récente
                </p>

                <div className="space-y-4">
                  {employees.length > 0 && (
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <UserPlus size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-app)]">
                          <span className="font-bold text-blue-400">{employees.length} nouveau{employees.length > 1 ? "x" : ""} salarié{employees.length > 1 ? "s" : ""}</span>
                          {" "}ajouté{employees.length > 1 ? "s" : ""} à votre équipe
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                          {employees.slice(0, 3).map((e) => e.user?.name || `${e.first_name} ${e.last_name}`).join(", ")}
                          {employees.length > 3 && ` +${employees.length - 3}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {members.length > 0 && (
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Users size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-app)]">
                          <span className="font-bold text-emerald-400">{members.length} membre{members.length > 1 ? "s" : ""}</span>
                          {" "}actif{members.length > 1 ? "s" : ""} dans votre entreprise
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                          {members.slice(0, 3).map((m) => m.user?.name).filter(Boolean).join(", ")}
                          {members.length > 3 && ` +${members.length - 3}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      company.is_verified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      <ShieldCheck size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-app)]">
                        Vérification :{" "}
                        <span className={company.is_verified ? "font-bold text-emerald-400" : "font-bold text-amber-400"}>
                          {company.is_verified ? "Vérifiée" : "En attente"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-app)]">Équipe</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {members.length} membre{members.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {members.length > 4 && (
                      <button
                        onClick={() => setShowAllMembers(true)}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        Voir tout →
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
                    >
                      <Plus size={11} /> Ajouter
                    </button>
                  </div>
                </div>

                {members.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-[var(--text-faint)]">Aucun membre pour l'instant</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.slice(0, 4).map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onRemove={handleRemoveMember}
                        onClick={(m) => setSelectedMember(m)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-app)]">Salariés</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {employees.length} salarié{employees.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {employees.length > 4 && (
                      <button
                        onClick={() => setShowAllEmployees(true)}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        Voir tout →
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddEmployee(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
                    >
                      <Plus size={11} /> Ajouter
                    </button>
                  </div>
                </div>

                {employees.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-[var(--text-faint)]">Aucun salarié pour le moment</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {employees.slice(0, 4).map((emp) => (
                      <EmployeeCard
                        key={emp.id}
                        employee={emp}
                        onRemove={handleRemoveEmployee}
                        onClick={(e) => setSelectedEmployee(e)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* MES OFFRES PUBLIÉES (uniquement sur l'onglet Accueil) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Briefcase size={12} /> Mes offres publiées
                  </p>
                  <button
                    onClick={() => loadFeed("mine")}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Rafraîchir
                  </button>
                </div>

                {loadingFeed ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  </div>
                ) : feedOffers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-10 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                      <Briefcase size={22} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[var(--text-app)]">
                      Vous n'avez publié aucune offre pour le moment
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Cliquez sur « Publier une offre... » pour commencer.
                    </p>
                  </div>
                ) : (
                  feedOffers.map((offer) => (
                    <OfferFeedCard
                      key={offer.id}
                      offer={offer}
                      currentCompanyId={company.id}
                      currentUser={user}
                      onDeleted={() => loadFeed("mine")}
                        onApply={(o) => setApplyOffer(o)} 
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* ONGLET DEMANDE */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Layers size={12} /> Demandes des entreprises
                </p>
                <button
                  onClick={loadRequests}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Rafraîchir
                </button>
              </div>

              {loadingRequests ? (
                <div className="flex h-40 items-center justify-center rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
                  <Loader2 className="animate-spin text-emerald-400" size={24} />
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-10 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                    <Layers size={22} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[var(--text-app)]">
                    Aucune demande pour le moment
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Les entreprises n'ont pas encore publié de besoins.
                  </p>
                </div>
              ) : (
                requests.map((r) => <RequestFeedCard key={r.id} request={r} />)
              )}
            </div>
          )}

          {/* ONGLET ACTUALITÉ */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Sparkles size={12} /> Offres des autres entreprises
                </p>
                <button
                  onClick={() => loadFeed("others")}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Rafraîchir
                </button>
              </div>

              {loadingFeed ? (
                <div className="flex h-40 items-center justify-center rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
                  <Loader2 className="animate-spin text-emerald-400" size={24} />
                </div>
              ) : feedOffers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-10 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                    <Briefcase size={22} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[var(--text-app)]">
                    Aucune offre d'une autre entreprise pour le moment
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Revenez plus tard pour voir les publications du réseau.
                  </p>
                </div>
              ) : (
                feedOffers.map((offer) => (
                  <OfferFeedCard
                    key={offer.id}
                    offer={offer}
                    currentCompanyId={company.id}
                    currentUser={user}
                    onDeleted={() => loadFeed("others")}
                    onApply={(o) => setApplyOffer(o)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* COLONNE DROITE */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm font-bold text-[var(--text-app)]">Talents suggérés</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
              Basés sur votre activité
            </p>

            <div className="mt-3 space-y-3">
              <Link
                to="/explore-dashboard"
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
                  LC
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--text-app)]">Lovaniaina Candy</p>
                  <p className="truncate text-[10px] text-[var(--text-faint)]">Développeuse Fullstack</p>
                </div>
                <Plus size={14} className="text-emerald-400" />
              </Link>

              <Link
                to="/explore-dashboard"
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
                  LR
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--text-app)]">Laza Rakotondrasoa</p>
                  <p className="truncate text-[10px] text-[var(--text-faint)]">Chef de projet</p>
                </div>
                <Plus size={14} className="text-emerald-400" />
              </Link>

              <Link
                to="/explore-dashboard"
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white">
                  AR
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--text-app)]">Annick Rojonirina</p>
                  <p className="truncate text-[10px] text-[var(--text-faint)]">Développeur Backend PHP</p>
                </div>
                <Plus size={14} className="text-emerald-400" />
              </Link>
            </div>

            <Link
              to="/explore-dashboard"
              className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-app)] py-2 text-[11px] font-medium text-[var(--text-muted)] transition hover:text-emerald-400"
            >
              Voir tous les talents <ArrowRight size={11} />
            </Link>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles size={14} />
            </span>
            <p className="mt-3 text-sm font-bold text-[var(--text-app)]">
              Complétez votre profil
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Une entreprise complète attire 3x plus de candidatures.
            </p>
            <ul className="mt-3 space-y-2 text-[11px] text-[var(--text-muted)]">
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Ajoutez votre logo</li>
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Décrivez votre activité</li>
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Demandez la vérification</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm font-bold text-[var(--text-app)]">Statistiques</p>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Membres</span>
                <span className="font-bold text-emerald-400">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Salariés</span>
                <span className="font-bold text-blue-400">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Taille</span>
                <span className="font-bold text-violet-400">
                  {COMPANY_SIZES.find((s) => s.value === company.size)?.label || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Vérifiée</span>
                <span className={company.is_verified ? "font-bold text-emerald-400" : "font-bold text-amber-400"}>
                  {company.is_verified ? "Oui" : "Non"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODALS */}
      {showAllMembers && (
        <AllPeopleModal
          title="Tous les membres"
          subtitle={`${members.length} membre${members.length > 1 ? "s" : ""}`}
          icon={Users}
          people={members}
          type="member"
          onClose={() => setShowAllMembers(false)}
          onRemove={handleRemoveMember}
          onClick={(m) => { setShowAllMembers(false); setSelectedMember(m); }}
          onAdd={() => { setShowAllMembers(false); setShowAddMember(true); }}
        />
      )}

      {showAllEmployees && (
        <AllPeopleModal
          title="Tous les salariés"
          subtitle={`${employees.length} salarié${employees.length > 1 ? "s" : ""}`}
          icon={Briefcase}
          people={employees}
          type="employee"
          onClose={() => setShowAllEmployees(false)}
          onRemove={handleRemoveEmployee}
          onAdd={() => { setShowAllEmployees(false); setShowAddEmployee(true); }}
        />
      )}

      {showFormModal && (
        <CompanyFormModal
          company={company}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => { setShowFormModal(false); showToast("Entreprise mise à jour", "success"); loadCompany(); }}
        />
      )}

      {showAddMember && (
        <AddMemberModal companyId={company.id} onClose={() => setShowAddMember(false)} onSuccess={() => { setShowAddMember(false); loadCompany(); }} />
      )}

      {showAddEmployee && (
        <AddEmployeeModal
          companyId={company.id}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => { setShowAddEmployee(false); loadCompany(); }}
        />
      )}

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          companyId={company.id}
          onClose={() => setSelectedMember(null)}
          onPhotoUpdated={() => { setSelectedMember(null); loadCompany(); }}
        />
      )}

      {showCreateOffer && (
        <CreateOfferModal
          company={company}
          onClose={() => setShowCreateOffer(false)}
          onSuccess={() => {
            setShowCreateOffer(false);
            showToast("Offre publiée ✅", "success");
            loadFeed("mine");
          }}
        />
      )}
      {applyOffer && (
  <ApplyOfferModal
    offer={applyOffer}
    onClose={() => setApplyOffer(null)}
    onSuccess={() => {
      setApplyOffer(null);
      showToast("Candidature envoyée ✅", "success");
    }}
  />
)}
    </AppShell>
  );
}

/* ============================================
   SECTION TÉMOIGNAGES
============================================ */
function TestimonialsSection({ companyId }) {
  const [testimonials, setTestimonials] = useState(() => {
    try {
      const saved = localStorage.getItem(`testimonials_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  const save = (list) => {
    setTestimonials(list);
    try { localStorage.setItem(`testimonials_${companyId}`, JSON.stringify(list)); } catch {}
  };

  const submit = (e) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;
    const entry = {
      id: Date.now(),
      author: author.trim(),
      role: role.trim(),
      text: text.trim(),
      rating,
      date: new Date().toISOString(),
    };
    save([entry, ...testimonials]);
    setAuthor(""); setRole(""); setText(""); setRating(5);
    setShowForm(false);
  };

  const remove = (id) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    save(testimonials.filter((t) => t.id !== id));
  };

  return (
    <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <Quote size={12} /> Témoignages
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
        >
          <Plus size={11} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 space-y-2.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nom de la personne"
              className={inputCls}
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Poste / relation"
              className={inputCls}
            />
          </div>
          <textarea
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Le témoignage..."
            className={inputCls}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="text-amber-400"
                >
                  <Star size={16} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#0A1229] hover:bg-emerald-400"
              >
                Publier
              </button>
            </div>
          </div>
        </form>
      )}

      {testimonials.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-[var(--text-faint)]">Aucun témoignage pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.id} className="group relative rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3.5">
              <button
                onClick={() => remove(t.id)}
                className="absolute right-2 top-2 hidden text-[var(--text-faint)] hover:text-rose-400 group-hover:block"
              >
                <X size={12} />
              </button>
              <div className="flex items-center gap-2.5">
                <Avatar name={t.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--text-app)]">{t.author}</p>
                  {t.role && <p className="truncate text-[10px] text-[var(--text-faint)]">{t.role}</p>}
                </div>
                <div className="flex shrink-0 gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={10} fill={n <= t.rating ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs italic leading-relaxed text-[var(--text-muted)]">
                "{t.text}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================
   CARTE DEMANDE
============================================ */
function RequestFeedCard({ request }) {
  const isUrgent = request.urgency === "urgent";
  const company = request.company;

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  return (
    <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-amber-500/30">
      <div className="flex items-start gap-3">
        <Avatar path={company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-[var(--text-app)]">{company?.name || "Entreprise"}</p>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-400">
                <Zap size={9} /> Urgent
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
            <Clock size={10} /> {timeAgo(request.created_at)}
            {request.city && (
              <>
                <span>·</span>
                <MapPin size={10} /> {request.city}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-base font-bold text-[var(--text-app)]">{request.title}</h3>
        {request.description && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
            {request.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {request.budget_min && request.budget_max && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <Euro size={11} /> {request.budget_min}–{request.budget_max} €/j
            </span>
          )}
          {request.skills?.length > 0 && request.skills.slice(0, 4).map((s) => (
            <span key={s.id} className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
              {s.name}
            </span>
          ))}
        </div>

        <Link
          to={`/resource-requests/${request.id}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-amber-400"
        >
          Proposer un profil <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

/* ============================================
   CARTE : Membre
============================================ */
function MemberCard({ member, onRemove, onClick }) {
  const name = member.user?.name || "Utilisateur";
  const email = member.user?.email;

  const avatar =
    member.user?.professional_profile?.avatar_path ||
    member.user?.professionalProfile?.avatar_path ||
    member.photo_path ||
    null;

  return (
    <div
      onClick={() => onClick?.(member)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 transition hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
    >
      <Avatar path={avatar} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--text-app)]">{name}</p>
        {email && <p className="truncate text-[10px] text-[var(--text-faint)]">{email}</p>}
      </div>
      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
        member.role === "owner" ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : member.role === "admin" ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
        : "border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
      }`}>
        {member.role}
      </span>
      <ArrowRight
        size={14}
        className="shrink-0 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100"
      />
    </div>
  );
}

/* ============================================
   CARTE : Salarié
============================================ */
function EmployeeCard({ employee, onRemove, onClick }) {
  const name = employee.user?.name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Salarié";
  const position = employee.position || "Poste non défini";

  const avatar =
    employee.photo_path ||
    employee.user?.professional_profile?.avatar_path ||
    employee.user?.professionalProfile?.avatar_path;

  return (
    <div
      onClick={() => onClick?.(employee)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 transition hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
    >
      <Avatar path={avatar} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--text-app)]">{name}</p>
        <p className="truncate text-[10px] text-[var(--text-faint)]">{position}</p>
      </div>
      {employee.has_account && (
        <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
          Compte
        </span>
      )}
      <ArrowRight
        size={14}
        className="shrink-0 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100"
      />
    </div>
  );
}

/* ============================================
   MODAL : Détails du salarié
============================================ */
function EmployeeDetailModal({ employee, onClose }) {
  const name = employee.user?.name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Salarié";
  const email = employee.user?.email || employee.email;
  const phone = employee.user?.phone || employee.phone;
  const position = employee.position;

  const profile = employee.user?.professional_profile || employee.user?.professionalProfile;
  const bio = profile?.bio;
  const headline = profile?.headline;
  const displayPosition = position || headline;

  const links = {
    portfolio: profile?.portfolio_url,
    linkedin: profile?.linkedin_url,
    github: profile?.github_url,
  };
  const hasLinks = links.portfolio || links.linkedin || links.github;

  const avatar = employee.photo_path || profile?.avatar_path;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--text-app)]">Détails du salarié</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar path={avatar} name={name} size="xl" />
            <h2 className="mt-3 text-lg font-bold text-[var(--text-app)]">{name}</h2>
            {position && <p className="text-xs text-emerald-400">{position}</p>}
            {headline && <p className="mt-1 text-xs text-[var(--text-muted)]">{headline}</p>}

            {employee.has_account ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                <CheckCircle size={10} /> Compte actif
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                <AlertCircle size={10} /> Sans compte
              </span>
            )}
          </div>

          {bio && (
            <div className="mt-5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                À propos
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{bio}</p>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {email && <DetailRow icon={Mail} label="Email" value={email} />}
            {phone && <DetailRow icon={Phone} label="Téléphone" value={phone} />}
            {displayPosition && <DetailRow icon={Briefcase} label="Poste" value={displayPosition} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MODAL : Détails du membre
============================================ */
function MemberDetailModal({ member, companyId, onClose, onPhotoUpdated }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const name = member.user?.name || "Utilisateur";
  const email = member.user?.email;
  const role = member.role;
  const profile = member.user?.professional_profile || member.user?.professionalProfile;
  const headline = profile?.headline;
  const bio = profile?.bio;

  const avatar =
    profile?.avatar_path ||
    member.user?.professionalProfile?.avatar_path ||
    member.photo_path ||
    null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo trop lourde (2 Mo max)", "error");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      await api.post(`/companies/${companyId}/members/${member.id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Photo mise à jour ✅", "success");
      onPhotoUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--text-app)]">Détails du membre</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center text-center">
            <div
              className="group relative cursor-pointer"
              onClick={() => photoInputRef.current?.click()}
            >
              <Avatar path={avatar} name={name} size="xl" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                {uploading
                  ? <Loader2 size={20} className="animate-spin text-white" />
                  : <Camera size={20} className="text-white" />}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <h2 className="mt-3 text-lg font-bold text-[var(--text-app)]">{name}</h2>

            {headline && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">{headline}</p>
            )}

            <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
              role === "owner" ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : role === "admin" ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
              : "border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
            }`}>
              {role}
            </span>
          </div>

          {email && (
            <div className="mt-4 space-y-3">
              <DetailRow icon={Mail} label="Email" value={email} />
            </div>
          )}

          <p className="mt-4 text-center text-[10px] text-[var(--text-faint)]">
            Cliquez sur la photo pour la modifier
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Ligne de détail
============================================ */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)]">
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-app)]">{value}</p>
      </div>
    </div>
  );
}

/* ============================================
   MODAL : Tous les membres / salariés
============================================ */
function AllPeopleModal({ title, subtitle, icon: Icon, people, type, onClose, onRemove, onAdd, onClick }) {
  const [search, setSearch] = useState("");

  const filtered = people.filter((p) => {
    const name = p.user?.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
    const email = p.user?.email || p.email || "";
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Icon size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-app)]">{title}</h2>
              <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border-app)] px-6 py-3">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 transition focus-within:border-emerald-500/50">
            <Search size={14} className="shrink-0 text-[var(--text-faint)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-app)]">Aucun élément</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const isMember = type === "member";
                const name = p.user?.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Utilisateur";
                const email = p.user?.email || p.email;
                const avatar = isMember
                  ? (p.user?.professional_profile?.avatar_path ||
                     p.user?.professionalProfile?.avatar_path ||
                     p.photo_path)
                  : (p.photo_path ||
                     p.user?.professional_profile?.avatar_path ||
                     p.user?.professionalProfile?.avatar_path);
                const subtitle = isMember ? null : p.position;

                return (
                  <div
                    key={p.id}
                    onClick={() => onClick?.(p)}
                    className={`rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4 ${onClick ? "cursor-pointer transition hover:border-emerald-500/40" : ""}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar path={avatar} name={name} size="lg" />
                      <p className="mt-3 line-clamp-1 text-sm font-bold text-[var(--text-app)]">{name}</p>
                      {subtitle && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">{subtitle}</p>
                      )}
                      {email && (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-faint)]">{email}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-4">
          <p className="text-xs text-[var(--text-muted)]">
            {filtered.length} sur {people.length}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-[var(--border-app)] px-4 py-2 text-sm font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface-hover)]">
              Fermer
            </button>
            <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MODAL : Formulaire entreprise
============================================ */
function CompanyFormModal({ company, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEditing = !!company;
  const [form, setForm] = useState(
    company ? {
      name: company.name || "", description: company.description || "",
      industry: company.industry || "", country: company.country || "Madagascar",
      city: company.city || "", website: company.website || "",
      address: company.address || "", phone: company.phone || "",
      size: company.size || "", latitude: company.latitude || "", longitude: company.longitude || "",
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined) payload[key] = null;
    });
    payload.name = form.name;

    try {
      if (isEditing) await api.patch(`/companies/${company.id}`, payload);
      else await api.post("/companies", payload);
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || "Erreur";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {isEditing ? "Modifier" : "Nouvelle entreprise"}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-[var(--text-app)]">
              {isEditing ? company.name : "Créer mon entreprise"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <Field icon={Building} label="Nom *">
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field icon={FileText} label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Briefcase} label="Secteur">
              <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls} />
            </Field>
            <Field icon={Users} label="Taille">
              <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputCls}>
                <option value="">Sélectionner</option>
                {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Globe} label="Pays">
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls}>
                {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field icon={MapPin} label="Ville">
              <input type="text" list="city-list" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
              <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
          </div>
          <Field icon={MapPin} label="Adresse">
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Link2} label="Site web">
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className={inputCls} />
            </Field>
            <Field icon={Phone} label="Téléphone">
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-[var(--border-app)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
            Annuler
          </button>
          <button type="button" onClick={submit} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "..." : isEditing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MODAL : Ajouter membre
============================================ */
function AddMemberModal({ companyId, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const e = email.trim();
    if (!e || !e.includes("@") || e.length < 5) {
      setSuggestedUser(null);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      api.get(`/users/search?email=${encodeURIComponent(e)}`)
        .then((res) => {
          const u = res.data;
          setSuggestedUser(u);
          if (u.avatar_path) {
            setAvatarPreview(`http://localhost:8000/storage/${u.avatar_path}`);
          }
        })
        .catch(() => setSuggestedUser(null))
        .finally(() => setSearching(false));
    }, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo trop lourde (2 Mo max)", "error");
      return;
    }
    setPhotoFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userRes = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
      const userId = userRes.data.id;

      const memberRes = await api.post(`/companies/${companyId}/members`, {
        user_id: userId,
        role,
      });
      const createdMember = memberRes.data.data;

      if (photoFile && createdMember?.id) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await api.post(
            `/companies/${companyId}/members/${createdMember.id}/photo`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("Membre ajouté ✅", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Utilisateur introuvable", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Ajouter un membre" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="group relative cursor-pointer"
            onClick={() => photoInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="preview"
                className="h-16 w-16 rounded-full border-2 border-[var(--border-app)] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                <Camera size={20} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
              <span className="text-[9px] font-bold text-white">Changer</span>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-app)]">Photo du membre</p>
            <p className="text-[10px] text-[var(--text-faint)]">Optionnel · max 2 Mo</p>
          </div>
        </div>

        <Field icon={Mail} label="Email *">
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className={inputCls}
            />
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-400"
              />
            )}
          </div>

          {suggestedUser && (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <CheckCircle size={16} className="shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-emerald-400">
                  Compte trouvé : {suggestedUser.name}
                </p>
              </div>
            </div>
          )}
        </Field>

        <Field icon={Users} label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
            <option value="viewer">Visualisateur</option>
          </select>
        </Field>

        <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ============================================
   MODAL : Ajouter salarié
============================================ */
function AddEmployeeModal({ companyId, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "", first_name: "", last_name: "", position: "", phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const email = form.email.trim();
    if (!email || !email.includes("@") || email.length < 5) {
      setSuggestedUser(null);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(() => {
      api.get(`/users/search?email=${encodeURIComponent(email)}`)
        .then((res) => {
          const u = res.data;
          setSuggestedUser(u);
          setForm((prev) => ({
            ...prev,
            first_name: prev.first_name || u.first_name || "",
            last_name: prev.last_name || u.last_name || "",
            phone: prev.phone || u.phone || "",
            position: prev.position || u.headline || "",
          }));
          if (u.avatar_path) {
            setAvatarPreview(`http://localhost:8000/storage/${u.avatar_path}`);
          }
        })
        .catch(() => setSuggestedUser(null))
        .finally(() => setSearching(false));
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.email]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo trop lourde (2 Mo max)", "error");
      return;
    }
    setPhotoFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      payload.email = form.email;
      payload.first_name = form.first_name;
      payload.last_name = form.last_name;

      const res = await api.post(`/companies/${companyId}/employees`, payload);
      const created = res.data.data;

      if (photoFile && created?.id) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await api.post(
            `/companies/${companyId}/employees/${created.id}/photo`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("✅ Salarié ajouté", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Ajouter un salarié" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="group relative cursor-pointer"
            onClick={() => photoInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" className="h-16 w-16 rounded-full border-2 border-[var(--border-app)] object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                <Camera size={20} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
              <span className="text-[9px] font-bold text-white">Changer</span>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-app)]">Photo du salarié</p>
            <p className="text-[10px] text-[var(--text-faint)]">Optionnel · max 2 Mo</p>
          </div>
        </div>

        <Field icon={Mail} label="Email *">
          <div className="relative">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemple.com"
              className={inputCls}
            />
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-400" />
            )}
          </div>

          {suggestedUser && (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <CheckCircle size={16} className="shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-emerald-400">
                  Compte trouvé : {suggestedUser.name}
                </p>
              </div>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Users} label="Prénom *">
            <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
          </Field>
          <Field icon={Users} label="Nom *">
            <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field icon={Briefcase} label="Poste">
          <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ex: Développeur" className={inputCls} />
        </Field>

        <Field icon={Phone} label="Téléphone">
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">Annuler</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ============================================
   UI HELPERS
============================================ */
const inputCls = "w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

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

/* ============================================
   MODAL : Créer une offre d'emploi
============================================ */
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
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Nouvelle offre
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--text-app)]">
              Publier une offre
            </h2>
            <p className="text-xs text-[var(--text-muted)]">pour {company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Field icon={Briefcase} label="Titre de l'offre *">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Développeur Web Junior"
              className={inputCls}
            />
          </Field>

          <Field icon={FileText} label="Type d'offre *">
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

          <Field icon={FileText} label="Description *">
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez la mission, les compétences recherchées, les conditions..."
              className={inputCls}
            />
            <p className={`mt-1 text-[10px] ${form.description.length < 20 ? "text-amber-400" : "text-[var(--text-faint)]"}`}>
              {form.description.length} / 20 caractères minimum
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={MapPin} label="Ville">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Antananarivo"
                className={inputCls}
              />
            </Field>
            <Field icon={MapPin} label="Pays">
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Madagascar"
                className={inputCls}
              />
            </Field>
          </div>

          <Field icon={Calendar} label="Date limite de candidature">
            <input
              type="date"
              value={form.application_deadline}
              onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-2.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 text-sm text-[var(--text-app)]">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
            <Home size={14} className="text-[var(--text-muted)]" />
            Poste en télétravail
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {saving ? "Publication..." : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================
   CARTE : Offre dans le feed
   4 boutons + commentaires inline
============================================ */
function OfferFeedCard({ offer, currentCompanyId, currentUser, onDeleted, onApply }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(offer.is_liked || false);
  const [likesCount, setLikesCount] = useState(offer.likes_count || 0);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const isMyOffer = offer.company_id === currentCompanyId;
  const company = offer.company;

  const OFFER_TYPES = {
    internship: "Stage",
    apprenticeship: "Alternance",
    junior_mission: "Mission junior",
    first_job: "Premier emploi",
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette offre ?")) return;
    setDeleting(true);
    try {
      await api.delete(`/job-offers/${offer.id}`);
      showToast("Offre supprimée", "success");
      onDeleted?.();
    } catch {
      showToast("Erreur suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`/job-offers/${offer.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      // Fallback visuel si la route n'existe pas encore
      setLiked((l) => {
        const next = !l;
        setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
        return next;
      });
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/actualite#offer-${offer.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien copié ✅", "success");
      api.post(`/job-offers/${offer.id}/share`).catch(() => {});
    } catch {
      showToast("Impossible de copier", "error");
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/job-offers/${offer.id}/comments`);
        setComments(res.data.data || []);
      } catch {
        setComments([]);
      }
      setLoadingComments(false);
    }
  };

 const submitComment = async (e) => {
  e.preventDefault();
  if (!commentText.trim()) return;
  setPostingComment(true);
  try {
    const res = await api.post(`/job-offers/${offer.id}/comment`, {
      content: commentText.trim(),
    });
    setComments([res.data.comment, ...comments]);
    setCommentText("");
    showToast("Commentaire ajouté ✅", "success");
  } catch (err) {
    // ❌ CE BLOC est le coupable
    const temp = {
      id: Date.now(),
      user: { name: currentUser?.name || "Vous" },
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    setComments([temp, ...comments]);
    setCommentText("");
    showToast("Commentaire enregistré en local", "info");
  } finally {
    setPostingComment(false);
  }
};

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  return (
    <div
      id={`offer-${offer.id}`}
      className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-emerald-500/30"
    >
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Avatar path={company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-[var(--text-app)]">
              {company?.name || "Entreprise"}
            </p>
            {company?.is_verified && (
              <BadgeCheck size={13} className="text-emerald-400" />
            )}
            {isMyOffer && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                Ma publication
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
            <Clock size={10} /> {timeAgo(offer.created_at)}
            {offer.city && (
              <>
                <span>·</span>
                <MapPin size={10} /> {offer.city}
              </>
            )}
            {offer.remote && (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                Télétravail
              </span>
            )}
          </p>
        </div>

        {isMyOffer && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="mt-3">
        <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          {OFFER_TYPES[offer.offer_type] || offer.offer_type}
        </span>
        <h3 className="mt-2 text-base font-bold text-[var(--text-app)]">
          {offer.title}
        </h3>
        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[var(--text-muted)]">
          {offer.description}
        </p>
      </div>

      {/* Compteur likes */}
      {likesCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
            <Heart size={9} fill="currentColor" />
          </span>
          {likesCount} {likesCount > 1 ? "personnes aiment" : "personne aime"}
        </div>
      )}

      {/* ✅ 4 boutons : J'aime · Commenter · Partager · Postuler */}
      <div className="mt-2 flex items-center gap-1 border-t border-[var(--border-app)] pt-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition ${
            liked
              ? "text-rose-400 hover:bg-rose-500/10"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          }`}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          J'aime
        </button>

        <button
          onClick={toggleComments}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
        >
          <MessageCircle size={14} />
          Commenter
        </button>

        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
        >
          <Send size={14} />
          Partager
        </button>

     {!isMyOffer && (
  <>
    {/* ✅ Si l'utilisateur est un TALENT/ÉTUDIANT → Postuler */}
    {(currentUser?.role === "employee" || currentUser?.role === "student") && (
      <button
        onClick={() => onApply?.(offer)}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
      >
        <Briefcase size={14} />
        Postuler
      </button>
    )}

    {/* ✅ Si l'utilisateur est une ENTREPRISE → Messenger */}
    {currentUser?.role === "company" && (
      <button
        onClick={() => {
          const ownerId = offer.company?.owner_user_id;
          if (ownerId) {
            navigate(`/messages?to=${ownerId}`);
          }
        }}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-500/10 py-2 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20"
      >
     <MessageCircle size={14} />
Contacter
      </button>
    )}
  </>
)}
      </div>

      {/* ✅ Zone commentaires inline */}
      {showComments && (
        <div className="mt-3 border-t border-[var(--border-app)] pt-3">
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <Avatar path={currentUser?.avatar_path} name={currentUser?.name || "?"} size="xs" />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrivez un commentaire..."
              className="flex-1 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="rounded-full bg-emerald-500 p-1.5 text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-40"
            >
              {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {loadingComments ? (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-emerald-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-[var(--text-faint)]">
                Aucun commentaire pour le moment
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar path={c.user?.avatar_path} name={c.user?.name || "?"} size="xs" />
                  <div className="flex-1 rounded-2xl bg-[var(--bg-surface-hover)] px-3 py-2">
                    <p className="text-[11px] font-bold text-[var(--text-app)]">
                      {c.user?.name || "Utilisateur"}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{c.content}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-faint)]">
                      {timeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
/* ============================================
   MODAL : Postuler à une offre
============================================ */
function ApplyOfferModal({ offer, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/profile/me").then(r => r.data).catch(() => null),
      api.get("/portfolio/my").then(r => r.data).catch(() => null),
    ]).then(([p, pf]) => {
      setProfile(p);
      setPortfolio(pf);
      setLoading(false);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!profile) {
      setError("Vous devez d'abord créer votre profil professionnel.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: coverLetter || null,
        portfolio_id: portfolio?.id || null,
        cv_path: profile?.cv_path || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la candidature.");
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
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Postuler
            </p>
            <h2 className="mt-0.5 text-base font-bold text-[var(--text-app)]">
              {offer.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              chez {offer.company?.name || "l'entreprise"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-emerald-400" size={24} />
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {!profile && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    Vous n'avez pas encore de profil professionnel.{" "}
                    <a href="/profile" className="font-semibold underline">Créez-le d'abord</a>.
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  <FileText size={11} /> Lettre de motivation
                </label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Expliquez pourquoi cette offre vous intéresse..."
                  className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              {portfolio && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle size={14} />
                    Votre portfolio sera joint automatiquement
                  </p>
                </div>
              )}

              {profile?.cv_path && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle size={14} />
                    Votre CV sera joint automatiquement
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !profile}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {saving ? "Envoi..." : "Envoyer ma candidature"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-app)]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}