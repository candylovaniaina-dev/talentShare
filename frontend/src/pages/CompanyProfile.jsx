import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import SuggestedTalentsSection from "../components/talents/SuggestedTalentsSection";
import CompanyOnboarding from "./CreateCompanyPage";
import {
  Building2, MapPin, Globe, Phone, Users, Edit, Camera, X, Plus,
  Trash2, CheckCircle, AlertCircle, Loader2, Save, Building,
  Link2, Briefcase, ShieldCheck, TrendingUp, Search, Mail, ArrowRight, 
  Sparkles, Layers, Star, Calendar, FileText, Home, Clock, Heart, 
  MessageCircle, Send, Zap, Euro, Quote, UserPlus, BadgeCheck
} from "lucide-react";

/* ---------------------------------- CONFIG --------------------------------- */

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
  { id: "home",     label: "Accueil",   icon: Home,     color: "text-[#0F9691]" },
  { id: "team",     label: "Équipe",    icon: Users,    color: "text-[#0F9691]" },
  { id: "requests", label: "Demande",   icon: Layers,   color: "text-[#0F9691]" },
  { id: "feed",     label: "Actualité", icon: Sparkles, color: "text-[#0F9691]" },
];

const API_BASE = "http://localhost:8001";

const inputCls = "w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

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

function buildImageUrl(pathOrUrl, fallback = null) {
  if (!pathOrUrl) return fallback;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${API_BASE}/storage/${pathOrUrl}`;
}

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

  const [error, setError] = React.useState(false);

  if (!path || error) {
    return (
      <div className={`${sizes[size]} ${roundedCls} flex shrink-0 items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 font-bold text-white`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={buildImageUrl(path)}
      alt={name}
      onError={() => setError(true)}
      className={`${sizes[size]} shrink-0 ${roundedCls} border border-[var(--border-app)] object-cover`}
    />
  );
}

function TestimonialsSection({ companyId }) {
  const [testimonials, setTestimonials] = useState(() => {
    try {
      const saved = localStorage.getItem(`testimonials_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);

  const save = (list) => {
    setTestimonials(list);
    try { localStorage.setItem(`testimonials_${companyId}`, JSON.stringify(list)); } catch {}
  };

  const remove = (id) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    save(testimonials.filter((t) => t.id !== id));
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <Quote size={12} /> Témoignages
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
          >
            <Plus size={11} /> Ajouter
          </button>
        </div>

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

      {showModal && (
        <AddTestimonialModal
          onClose={() => setShowModal(false)}
          onSuccess={(entry) => {
            save([entry, ...testimonials]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function AddTestimonialModal({ onClose, onSuccess }) {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    setError(null);

    if (!author.trim()) return setError("Le nom est requis.");
    if (!text.trim()) return setError("Le témoignage est requis.");

    const entry = {
      id: Date.now(),
      author: author.trim(),
      role: role.trim(),
      text: text.trim(),
      rating,
      date: new Date().toISOString(),
    };

    onSuccess(entry);
  };

  return (
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F9691]">Nouveau témoignage</p>
            <h2 className="mt-0.5 text-xl font-bold text-[var(--text-app)]">Ajouter un témoignage</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Partagez votre expérience avec cette entreprise.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field icon={Users} label="Nom de la personne *">
              <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex: Jean Dupont" className={inputCls} />
            </Field>
            <Field icon={Briefcase} label="Poste / relation">
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Directeur RH" className={inputCls} />
            </Field>
          </div>

          <Field icon={Quote} label="Témoignage *">
            <textarea required rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Décrivez votre expérience avec cette entreprise..." className={inputCls} />
            <p className="mt-1 text-[10px] text-[var(--text-faint)]">{text.length} caractère{text.length > 1 ? "s" : ""}</p>
          </Field>

          <Field icon={Star} label="Note">
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="text-amber-400 transition hover:scale-110">
                  <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
              <span className="ml-2 text-xs text-[var(--text-muted)]">{rating}/5</span>
            </div>
          </Field>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-app)] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]">
            Annuler
          </button>
          <button type="button" onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79]">
            <CheckCircle size={14} />
            Publier le témoignage
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("profile");
  const [newsFilter, setNewsFilter] = useState("all");
  const [myOffers, setMyOffers] = useState([]);
  const [otherRequests, setOtherRequests] = useState([]);
  const [feedOffers, setFeedOffers] = useState([]);
  const [feedRequests, setFeedRequests] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  useEffect(() => { loadCompany(); }, []);
  useEffect(() => {
    if (!company) return;
    if (activeTab === "profile") loadHome();
    if (activeTab === "news") loadActualite();
  }, [company, activeTab]);

  const loadHome = async () => {
    try {
      setLoadingFeed(true);
      const offersRes = await api.get("/job-offers", { params: { only_mine: 1, per_page: 20 } }).catch(() => ({ data: { data: [] } }));
      setMyOffers(offersRes.data.data || []);
    } catch { setMyOffers([]); } finally { setLoadingFeed(false); }
  };

  const loadActualite = async () => {
    try {
      setLoadingFeed(true);
      const [offersRes, requestsRes] = await Promise.all([
        api.get("/job-offers", { params: { exclude_mine: 1, per_page: 30 } }).catch(() => ({ data: { data: [] } })),
        api.get("/resource-requests", { params: { per_page: 40 } }).catch(() => ({ data: { data: [] } })),
      ]);
      const offers = offersRes.data.data || offersRes.data || [];
      const requests = requestsRes.data.data || requestsRes.data || [];
      setFeedOffers(offers.filter((o) => o.company_id !== company?.id));
      setFeedRequests(requests.filter((r) => r.company_id !== company?.id));
    } catch { setFeedOffers([]); setFeedRequests([]); } finally { setLoadingFeed(false); }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const res = await api.get("/companies/me");
      const data = res.data;
      setCompany(data);
      try { const r = await api.get(`/companies/${data.id}/members`); setMembers(r.data.data || []); } catch { setMembers([]); }
      try { const r = await api.get(`/companies/${data.id}/employees`); setEmployees(r.data.data || []); } catch { setEmployees([]); }
    } catch (err) {
      if (err.response?.status === 404) setCompany(null);
      else showToast("Erreur de chargement", "error");
    } finally { setLoading(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) { showToast("Format non supporté", "error"); e.target.value = ""; return; }
    if (file.size > 2 * 1024 * 1024) { showToast("Image trop lourde (2 Mo max)", "error"); e.target.value = ""; return; }
    setUploadingLogo(true);
    const formData = new FormData(); formData.append("logo", file);
    try {
      const response = await api.post(`/companies/${company.id}/logo`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCompany(response.data.data || response.data); showToast("Logo mis à jour", "success");
    } catch (err) { showToast(err.response?.data?.message || "Erreur upload", "error"); }
    finally { setUploadingLogo(false); e.target.value = ""; }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Retirer ce membre ?")) return;
    try { await api.delete(`/companies/${company.id}/members/${memberId}`); showToast("Membre retiré", "success"); loadCompany(); }
    catch { showToast("Erreur", "error"); }
  };
  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm("Retirer ce salarié ?")) return;
    try { await api.delete(`/companies/${company.id}/employees/${employeeId}`); showToast("Salarié retiré", "success"); loadCompany(); }
    catch { showToast("Erreur", "error"); }
  };
  const handleRequestVerification = async () => {
    try { await api.post(`/companies/${company.id}/verify`); showToast("Demande envoyée", "success"); loadCompany(); }
    catch (err) { showToast(err.response?.data?.message || "Erreur", "error"); }
  };

  const sizeLabel = COMPANY_SIZES.find((s) => s.value === company?.size)?.label || company?.size || "Taille non renseignée";
  const completionItems = [
    ["Logo de l’entreprise", !!(company?.logo_url || company?.logo_path)],
    ["Présentation de l’activité", !!company?.description],
    ["Site web", !!company?.website],
    ["Coordonnées", !!(company?.phone || company?.address)],
    ["Entreprise vérifiée", !!company?.is_verified],
  ];
  const completion = Math.round((completionItems.filter((i) => i[1]).length / completionItems.length) * 100);

  if (loading) return <AppShell><div className="flex min-h-[55vh] items-center justify-center"><div className="flex flex-col items-center gap-3 text-slate-500"><Loader2 className="animate-spin text-teal-600" size={34} /><span className="text-sm font-medium">Préparation de votre espace entreprise…</span></div></div></AppShell>;
  if (!company) return <AppShell><CompanyOnboarding onCreated={loadCompany} /></AppShell>;

  return (
    <AppShell>
      <style>{`
        @keyframes tsCompanyEnter { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .ts-company-page {
          --bg-surface:#ffffff; --bg-surface-hover:#f7fafb; --border-app:#e4ebef;
          --text-app:#102a43; --text-muted:#5f7384; --text-faint:#91a0ad;
          animation:tsCompanyEnter .28s ease-out both; color:#102a43;
        }
        .ts-company-card { background:#fff; border:1px solid #e4ebef; border-radius:18px; box-shadow:0 5px 20px rgba(16,42,67,.045); transition:border-color .18s ease,box-shadow .18s ease; }
        .ts-company-card:hover { border-color:#d5e4e7; }
        .ts-company-muted { color:#64788c; }
        .ts-company-eyebrow { color:#0f8179; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
        .ts-company-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:11px; padding:10px 15px; font-size:12px; font-weight:700; transition:all .18s ease; }
        .ts-company-primary { color:#fff; background:#0f9691; box-shadow:0 4px 12px rgba(15,150,145,.16); }
        .ts-company-primary:hover { background:#0b7d79; box-shadow:0 7px 18px rgba(15,150,145,.22); transform:translateY(-1px); }
        .ts-company-secondary { background:#fff; border:1px solid #dce5e9; color:#334b63; }
        .ts-company-secondary:hover { background:#f2faf9; border-color:#b9ded9; color:#0b716b; }
        .ts-company-page button:focus-visible { outline:3px solid rgba(15,150,145,.24); outline-offset:2px; }
        .ts-company-page input, .ts-company-page textarea, .ts-company-page select { accent-color:#0f9691; }
        .ts-modal-overlay { background:rgba(8,29,45,.58)!important; backdrop-filter:blur(7px)!important; }
        .ts-modal-overlay > div { border-radius:18px!important; border:1px solid #dfe8ec!important; box-shadow:0 24px 70px rgba(8,29,45,.24)!important; }
        .ts-modal-overlay > div > div:first-child { background:#0b2638!important; border-bottom:1px solid rgba(255,255,255,.08)!important; padding:18px 22px!important; }
        .ts-modal-overlay > div > div:first-child h1, .ts-modal-overlay > div > div:first-child h2, .ts-modal-overlay > div > div:first-child h3 { color:#fff!important; letter-spacing:-.02em; }
        .ts-modal-overlay > div > div:first-child p { color:#a9c0ce!important; }
        .ts-modal-overlay > div > div:first-child button { color:#fff!important; background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.1)!important; border-radius:10px!important; }
        .ts-modal-overlay input:not([type=checkbox]):not([type=radio]), .ts-modal-overlay textarea, .ts-modal-overlay select { border-radius:10px!important; border-color:#dce6eb!important; background:#f8fbfc!important; color:#163244!important; }
        .ts-modal-overlay input:focus, .ts-modal-overlay textarea:focus, .ts-modal-overlay select:focus { border-color:#0f9691!important; box-shadow:0 0 0 3px rgba(15,150,145,.12)!important; outline:none!important; }
        .ts-modal-overlay form { scrollbar-width:thin; scrollbar-color:#bfd8d5 transparent; }
        @media(prefers-reduced-motion:reduce){.ts-company-page,*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      <div className="ts-company-page mx-auto max-w-[1500px] space-y-4 px-1 pb-8 sm:px-2">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
          
           <h1 className="text-2xl font-bold tracking-tight text-[#102A43] sm:text-3xl">Votre présence professionnelle</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Présentez votre entreprise, suivez vos publications et découvrez les opportunités du réseau TalentShare.</p>
          </div>
          <button onClick={() => setShowCreateOffer(true)} className="ts-company-btn ts-company-primary self-start sm:self-auto"><Plus size={16}/> Publier une offre </button>
        </header>

        <nav className="ts-company-card flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[{id:"profile",label:"Profil & activité",icon:Building2,sub:"Votre vitrine professionnelle"},{id:"news",label:"Actualités du réseau",icon:Sparkles,sub:"Offres et demandes externes"}].map((tab) => {
              const Icon = tab.icon; const active = activeTab === tab.id;
              return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-[16px] px-4 py-3 text-left sm:min-w-[230px] ${active ? "bg-[#e8f8f5] text-[#087f75]" : "text-slate-500 hover:bg-slate-50"}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white text-[#0F8179] shadow-sm" : "bg-slate-100 text-slate-500"}`}><Icon size={18}/></span>
                <span className="min-w-0"><span className="block text-sm font-bold">{tab.label}</span><span className={`mt-0.5 hidden text-[11px] sm:block ${active ? "text-[#0F8179]/75" : "text-slate-400"}`}>{tab.sub}</span></span>
                {active && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#0F9691]"/>}
              </button>;
            })}
          </div>
          <button onClick={() => setShowFormModal(true)} className="ts-company-btn ts-company-secondary mx-1"><Edit size={14}/> Modifier le profil</button>
        </nav>

        {activeTab === "profile" && <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
          <div className="min-w-0 space-y-5">
        <section className="ts-company-card overflow-hidden">
 {/* Un dégradé de vert profond mais lumineux, avec des halos de lumière pour un effet premium */}
<div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#0B2638] via-[#10384A] to-[#0F766E] sm:h-52">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.10),transparent_60%)]" />
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(22,184,177,0.18),transparent_50%)]" />
   <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white shadow-sm backdrop-blur-md">
  VITRINE ENTREPRISE
</span>

    {/* 👇 2. LE NOM DE L'ENTREPRISE EN GRAND SUR LA BANNIÈRE */}
    <div className="absolute bottom-6 left-6 sm:left-40">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-sm">
        {company.name}
      </h1>
    </div>
  </div>

  <div className="px-5 pb-5 sm:px-7">
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end">
      
      {/* 👇 3. LE LOGO (Qui chevauche la bannière) */}
      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()} 
        title="Modifier le logo" 
        className="group absolute -top-16 sm:-top-20 left-0 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border-4 border-white bg-white text-3xl font-extrabold text-[#0F8179] shadow-lg sm:h-32 sm:w-32"
      >
        {company.logo_url || company.logo_path ? (
          <img 
            src={buildImageUrl(company.logo_url || company.logo_path)} 
            alt={company.name} 
            className="h-full w-full object-contain p-2" 
            onError={(e)=>{e.currentTarget.style.display="none";}}
          />
        ) : company.name?.charAt(0)?.toUpperCase()}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-white opacity-0 transition group-hover:opacity-100">
          {uploadingLogo ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>}
        </span>
      </button>
      <input ref={fileInputRef} type="file" onChange={handleLogoUpload} accept="image/jpeg,image/png,image/webp" className="hidden"/>

      {/* 👇 4. LES INFOS DE L'ENTREPRISE (À côté du logo, en dessous du nom) */}
      <div className="min-w-0 flex-1 pt-14 sm:pl-36 sm:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {company.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-[#0F8179]">
              <BadgeCheck size={13}/> Vérifiée
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {company.industry || "Secteur d’activité à renseigner"}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <MapPin size={13} className="text-teal-600"/>
          {[company.city, company.country].filter(Boolean).join(", ") || "Localisation non renseignée"}
          <span className="text-slate-300">•</span>
          <Users size={13}/>
          {sizeLabel}
        </p>
      </div>

     <button onClick={() => setShowFormModal(true)} className="mb-1 inline-flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50/80 px-4 py-2.5 text-xs font-bold text-[#0F8179] transition hover:bg-teal-100 sm:mb-0">
  <Edit size={14}/> Éditer
</button>
    </div>

    {/* 👇 5. LES CARTES DE STATISTIQUES (En bas) */}
    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
      {[
        {label:"Offres publiées",value:myOffers.length,icon:Briefcase},
        {label:"Membres",value:members.length,icon:Users},
        {label:"Salariés",value:employees.length,icon:UserPlus},
        {label:"Profil complété",value:`${completion}%`,icon:TrendingUp}
      ].map((stat)=>{
        const Icon=stat.icon;
        return (
          <div key={stat.label} className="rounded-xl border border-slate-100 bg-[#F7FAFB] p-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#0F8179] shadow-sm">
              <Icon size={15}/>
            </span>
            <p className="mt-3 text-xl font-extrabold text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  </div>
</section>

            <section className="ts-company-card p-5 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-3"><div><p className="ts-company-eyebrow">L’entreprise en bref</p><h3 className="mt-1 text-lg font-extrabold text-slate-900">Notre identité & notre expertise</h3></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0F8179]"><Building size={18}/></span></div>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{company.description || "Présentez ici votre entreprise, vos domaines d’expertise, vos valeurs et ce qui vous distingue. Une description claire aide les talents et les partenaires à mieux vous connaître."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[{label:"Secteur d’activité",value:company.industry,icon:Layers},{label:"Taille de l’équipe",value:sizeLabel,icon:Users},{label:"Pays / ville",value:[company.city,company.country].filter(Boolean).join(", "),icon:MapPin},{label:"Téléphone professionnel",value:company.phone,icon:Phone},{label:"Adresse",value:company.address,icon:Building2},{label:"Site internet",value:company.website,icon:Globe}].map((item)=>{const Icon=item.icon;return <div key={item.label} className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 p-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#0F8179]"><Icon size={16}/></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>{item.label==="Site internet"&&item.value?<a href={item.value.startsWith("http")?item.value:`https://${item.value}`} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-semibold text-[#0F8179] hover:underline">{item.value}</a>:<p className="mt-1 break-words text-sm font-semibold text-slate-700">{item.value || "À compléter"}</p>}</div></div>;})}
              </div>
            </section>

            <section className="ts-company-card p-5 sm:p-7">

              {loadingFeed ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" size={25}/></div> : myOffers.length===0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0F8179] shadow-sm"><FileText size={22}/></span><h4 className="mt-3 text-sm font-bold text-slate-800">Votre première publication commence ici</h4><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">Publiez une offre pour présenter un besoin et entrer en contact avec des profils adaptés.</p><button onClick={() => setShowCreateOffer(true)} className="ts-company-btn ts-company-primary mt-4"><Plus size={14}/> Publier une offre</button></div> : <div className="space-y-3">{myOffers.map((offer)=><OfferFeedCard key={offer.id} offer={offer} currentCompanyId={company.id} currentUser={user} onDeleted={loadHome} onApply={(o)=>setApplyOffer(o)}/>)}</div>}
            </section>

            <TestimonialsSection companyId={company.id}/>
          </div>

          <aside className="space-y-5">
            <section className="ts-company-card p-5"><div className="flex items-start justify-between"><div><p className="ts-company-eyebrow">Votre progression</p><h3 className="mt-1 text-base font-extrabold text-slate-900">Un profil qui inspire confiance</h3></div><span className="text-2xl font-extrabold text-[#0F8179]">{completion}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#0F9691] to-[#16B8B1] transition-all" style={{width:`${completion}%`}}/></div><div className="mt-4 space-y-3">{completionItems.map(([label,done])=><div key={label} className="flex items-center gap-2.5 text-xs"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${done?"bg-teal-100 text-[#0F8179]":"bg-slate-100 text-slate-400"}`}>{done?<CheckCircle size={12}/>:<span className="h-1.5 w-1.5 rounded-full bg-current"/>}</span><span className={done?"text-slate-500 line-through":"font-semibold text-slate-700"}>{label}</span></div>)}</div>{!company.is_verified&&<button onClick={handleRequestVerification} className="ts-company-btn ts-company-secondary mt-5 w-full"><ShieldCheck size={14}/> Demander la vérification</button>}</section>

            <section className="ts-company-card p-5"><div className="mb-4 flex items-center justify-between"><div><p className="ts-company-eyebrow">Vie d’équipe</p><h3 className="mt-1 text-base font-extrabold text-slate-900">Collaborateurs</h3></div><Users className="text-[#0F8179]" size={19}/></div><div className="grid grid-cols-2 gap-3"><button onClick={()=>setShowAllMembers(true)} className="rounded-2xl bg-slate-50 p-4 text-left hover:bg-teal-50"><span className="text-2xl font-extrabold text-slate-900">{members.length}</span><span className="mt-1 block text-[11px] font-medium text-slate-500">Membres</span></button><button onClick={()=>setShowAllEmployees(true)} className="rounded-2xl bg-slate-50 p-4 text-left hover:bg-teal-50"><span className="text-2xl font-extrabold text-slate-900">{employees.length}</span><span className="mt-1 block text-[11px] font-medium text-slate-500">Salariés</span></button></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>setShowAddMember(true)} className="ts-company-btn ts-company-secondary flex-1"><Plus size={13}/> Ajouter un membre</button><button onClick={()=>setShowAddEmployee(true)} className="ts-company-btn ts-company-secondary flex-1"><Plus size={13}/> Ajouter un salarié</button></div><button onClick={()=>setShowAllMembers(true)} className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#0F8179]">Gérer les membres <ArrowRight size={14}/></button></section>

            <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B2638] to-[#0F766E] p-5 text-white shadow-lg shadow-teal-900/10"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Sparkles size={18}/></span><h3 className="mt-4 text-lg font-extrabold">Développez votre réseau</h3><p className="mt-2 text-xs leading-5 text-teal-50/80">Découvrez les demandes de ressources et les offres publiées par les autres acteurs de TalentShare.</p><button onClick={()=>setActiveTab("news")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-teal-800 hover:bg-teal-50">Explorer l’actualité <ArrowRight size={14}/></button></section>
            <SuggestedTalentsSection/>
          </aside>
        </div>}

        {activeTab === "news" && <div className="space-y-5">
          <div className="ts-company-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f6f2] text-[#087f75]"><Layers size={18}/></span><div><h2 className="text-base font-extrabold text-slate-900">Actualités du réseau</h2><p className="mt-0.5 text-xs text-slate-500">Les offres et les demandes des autres acteurs de TalentShare.</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="mr-1 hidden text-xs text-slate-400 sm:inline">{feedOffers.length} offres · {feedRequests.length} demandes</span><button onClick={loadActualite} className="ts-company-btn ts-company-secondary"><TrendingUp size={14}/> Actualiser</button></div></div>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="ts-company-eyebrow">Explorer</p><h3 className="mt-1 text-lg font-extrabold text-slate-900">Publications récentes</h3></div><div className="flex flex-wrap gap-2">{[{id:"all",label:"Tout voir"},{id:"offers",label:"Offres d’emploi"},{id:"requests",label:"Demandes de ressources"}].map((f)=><button key={f.id} onClick={()=>setNewsFilter(f.id)} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${newsFilter===f.id?"bg-[#0d9488] text-white shadow-md shadow-teal-700/15":"border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{f.label}</button>)}</div></div>
          {loadingFeed ? <div className="ts-company-card flex min-h-56 items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={28}/></div> : (newsFilter==="all"?feedOffers.length+feedRequests.length:newsFilter==="offers"?feedOffers.length:feedRequests.length)===0 ? <div className="ts-company-card px-5 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#0F8179]"><Search size={24}/></span><h4 className="mt-4 text-base font-extrabold text-slate-900">Rien à afficher pour le moment</h4><p className="mt-2 text-sm text-slate-500">Les nouvelles offres et demandes apparaîtront ici dès leur publication.</p><button onClick={loadActualite} className="ts-company-btn ts-company-secondary mt-5"><TrendingUp size={14}/> Actualiser</button></div> : <div className="grid items-start gap-5 xl:grid-cols-2">
            {(newsFilter==="all"||newsFilter==="offers")&&<section className="space-y-3"><div className="flex items-center gap-3 px-1"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Briefcase size={18}/></span><div><h4 className="text-sm font-extrabold text-slate-900">Offres d’emploi</h4><p className="text-xs text-slate-500">Des opportunités publiées par les autres entreprises</p></div><span className="ml-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{feedOffers.length}</span></div>{feedOffers.length?feedOffers.map((offer)=><OfferFeedCard key={`news-offer-${offer.id}`} offer={offer} currentCompanyId={company.id} currentUser={user} onDeleted={loadActualite} onApply={(o)=>setApplyOffer(o)}/>):<div className="ts-company-card p-7 text-center text-xs text-slate-500">Aucune offre à afficher.</div>}</section>}
            {(newsFilter==="all"||newsFilter==="requests")&&<section className="space-y-3"><div className="flex items-center gap-3 px-1"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Layers size={18}/></span><div><h4 className="text-sm font-extrabold text-slate-900">Demandes de ressources</h4><p className="text-xs text-slate-500">Besoins partagés par les entreprises et les talents</p></div><span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{feedRequests.length}</span></div>{feedRequests.length?feedRequests.map((request)=><RequestFeedCard key={`news-request-${request.id}`} request={request} currentUser={user}/>):<div className="ts-company-card p-7 text-center text-xs text-slate-500">Aucune demande à afficher.</div>}</section>}
          </div>}
        </div>}
      </div>

      {showAllMembers && <AllPeopleModal title="Tous les membres" subtitle={`${members.length} membre${members.length>1?"s":""}`} icon={Users} people={members} type="member" onClose={()=>setShowAllMembers(false)} onRemove={handleRemoveMember} onClick={(m)=>{setShowAllMembers(false);setSelectedMember(m);}} onAdd={()=>{setShowAllMembers(false);setShowAddMember(true);}}/>}
      {showAllEmployees && <AllPeopleModal title="Tous les salariés" subtitle={`${employees.length} salarié${employees.length>1?"s":""}`} icon={Briefcase} people={employees} type="employee" onClose={()=>setShowAllEmployees(false)} onRemove={handleRemoveEmployee} onAdd={()=>{setShowAllEmployees(false);setShowAddEmployee(true);}}/>}
      {showFormModal && <CompanyFormModal company={company} onClose={()=>setShowFormModal(false)} onSuccess={()=>{setShowFormModal(false);showToast("Entreprise mise à jour","success");loadCompany();}}/>}
      {showAddMember && <AddMemberModal companyId={company.id} onClose={()=>setShowAddMember(false)} onSuccess={()=>{setShowAddMember(false);loadCompany();}}/>}
      {showAddEmployee && <AddEmployeeModal companyId={company.id} onClose={()=>setShowAddEmployee(false)} onSuccess={()=>{setShowAddEmployee(false);loadCompany();}}/>}
      {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} onClose={()=>setSelectedEmployee(null)}/>}
      {selectedMember && <MemberDetailModal member={selectedMember} companyId={company.id} onClose={()=>setSelectedMember(null)} onPhotoUpdated={()=>{setSelectedMember(null);loadCompany();}}/>}
   {showCreateOffer && (
  <CreateOfferModal 
    company={company} 
    onClose={() => setShowCreateOffer(false)} 
    onSuccess={() => {
      setShowCreateOffer(false);
      setOfferSuccess(true); // 👈 Affiche l'écran de succès
      loadHome();
    }}
  />
)}

{/* 👇 AJOUTE L'ÉCRAN DE SUCCÈS ICI */}
{offerSuccess && (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 p-6 backdrop-blur-md">
    <div className="relative flex w-full max-w-md flex-col items-center text-center">
      <style>{`
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-success { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <div className="animate-success flex h-24 w-24 items-center justify-center rounded-full bg-[#0F9691] shadow-[0_0_50px_rgba(16,185,129,0.5)]">
        <CheckCircle size={48} className="text-white" />
      </div>
      
      <h2 className="mt-8 text-3xl font-black text-white">Offre publiée !</h2>
      <p className="mt-3 text-sm text-slate-300">
        Votre offre a bien été publiée. Elle est maintenant visible par tous les talents du réseau.
      </p>
      
      <button 
        onClick={() => setOfferSuccess(false)} 
        className="mt-8 rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
      >
        Fermer
      </button>
    </div>
  </div>
)}
      {applyOffer && <ApplyOfferModal offer={applyOffer} onClose={()=>setApplyOffer(null)} onSuccess={()=>{setApplyOffer(null);showToast("Candidature envoyée","success");}}/>}
    </AppShell>
  );
}

/* ------------------------------- COMPOSANTS -------------------------------- */

function RequestFeedCard({ request, currentUser }) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(request.is_liked || false);
  const [likesCount, setLikesCount] = useState(request.likes_count || 0);
  const [liking, setLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(request.comments_count || 0);

  const isOwner = currentUser?.id === request.created_by;
  const isTalent = request.author_type === "talent";
  const company = request.company;
  const author = request.author;
  const isUrgent = request.urgency === "urgent";
  const hasBudget = request.budget_min && request.budget_max;
  const hasSkills = request.skills?.length > 0;

  useEffect(() => {
    api.get(`/resource-requests/${request.id}/comments`)
      .then((res) => {
        const list = res.data.data || [];
        setCommentsCount(list.length);
      })
      .catch(() => {});
  }, [request.id]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`/resource-requests/${request.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
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
    const url = `${window.location.origin}/resource-requests/${request.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien copié", "success");
      api.post(`/resource-requests/${request.id}/share`).catch(() => {});
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
        const res = await api.get(`/resource-requests/${request.id}/comments`);
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
      const res = await api.post(`/resource-requests/${request.id}/comment`, {
        content: commentText.trim(),
      });
      setComments([res.data.comment, ...comments]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
      showToast("Commentaire ajouté", "success");
    } catch (err) {
      showToast(err.response?.data?.message || `Erreur ${err.response?.status || ""}`, "error");
    } finally {
      setPostingComment(false);
    }
  };

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
    <div
      id={`request-${request.id}`}
      className={`group relative overflow-hidden rounded-xl border bg-[var(--bg-surface)] transition hover:border-teal-500/30 ${
        isUrgent ? "border-teal-500/30" : "border-[var(--border-app)]"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${isUrgent ? "bg-[#0F9691]" : "bg-[#0F9691]"}`} />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-3">
          {isTalent ? (
            <>
              <Avatar
                path={
                  author?.professional_profile?.avatar_path ||
                  author?.professionalProfile?.avatar_path ||
                  author?.avatar_path
                }
                name={author?.name || "Talent"}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--text-app)]">
                    {author?.name || "Talent"}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0F9691]">
                    Talent
                  </span>
                  {isUrgent && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/40 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0F9691]">
                      <Zap size={9} /> Urgent
                    </span>
                  )}
                  {isOwner && (
                    <span className="rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0F9691]">
                      Ma publication
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-faint)]">
                  <Clock size={10} /> {timeAgo(request.created_at)}
                  {request.city && (
                    <>
                      <span>·</span>
                      <MapPin size={10} /> {request.city}
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <Avatar path={company?.logo_url || company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--text-app)]">
                    {company?.name || "Entreprise"}
                  </p>
                  {isUrgent && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/40 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0F9691]">
                      <Zap size={9} /> Urgent
                    </span>
                  )}
                  {isOwner && (
                    <span className="rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0F9691]">
                      Ma publication
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-faint)]">
                  <Clock size={10} /> {timeAgo(request.created_at)}
                  {request.city && (
                    <>
                      <span>·</span>
                      <MapPin size={10} /> {request.city}
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold leading-snug text-[var(--text-app)] transition group-hover:text-[#0F9691]">
            {request.title}
          </h3>
          {request.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {request.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {hasBudget && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-2.5 py-1 font-semibold text-[#0F9691]">
              <Euro size={11} /> {request.budget_min}–{request.budget_max} €/j
            </span>
          )}
          {request.start_at && request.end_at && (
            <span className="inline-flex items-center gap-1.5 text-[var(--text-faint)]">
              <Calendar size={11} />
              {new Date(request.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              {" → "}
              {new Date(request.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          )}
          {request.workload_percent && (
            <span className="text-[var(--text-faint)]">{request.workload_percent}%</span>
          )}
        </div>

        {hasSkills && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {request.skills.slice(0, 5).map((s) => (
              <span
                key={s.id}
                className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]"
              >
                {s.name}
              </span>
            ))}
            {request.skills.length > 5 && (
              <span className="self-center text-[11px] text-[var(--text-faint)]">
                +{request.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {likesCount > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
              <Heart size={9} fill="currentColor" />
            </span>
            {likesCount} {likesCount > 1 ? "personnes aiment" : "personne aime"}
          </div>
        )}

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
            {commentsCount > 0 ? commentsCount : "Commenter"}
          </button>

          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <Send size={14} />
            Partager
          </button>

          {!isOwner && (
            <>
              {(currentUser?.role === "employee" || currentUser?.role === "student") && (
                <Link
                  to={`/resource-requests/${request.id}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0F9691]/10 py-2 text-xs font-bold text-[#0F9691] transition hover:bg-[#0F9691]/20"
                >
                  <ArrowRight size={14} />
                  Proposer
                </Link>
              )}

              {currentUser?.role === "company" && (
                <button
                  onClick={() => {
                    const ownerId = request.author_type === "talent"
                      ? request.author?.id
                      : request.company?.owner_user_id;
                    if (ownerId) navigate(`/messages?to=${ownerId}`);
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0F9691]/10 py-2 text-xs font-bold text-[#0F9691] transition hover:bg-[#0F9691]/20"
                >
                  <MessageCircle size={14} />
                  Contacter
                </button>
              )}
            </>
          )}
        </div>

        {showComments && (
          <div className="mt-3 border-t border-[var(--border-app)] pt-3">
            <form onSubmit={submitComment} className="flex items-center gap-2">
              <Avatar path={currentUser?.avatar_path} name={currentUser?.name || "?"} size="xs" />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="flex-1 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-teal-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="rounded-full bg-[#0F9691] p-1.5 text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-40"
              >
                {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {loadingComments ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-[#0F9691]" />
                </div>
              ) : comments.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-[var(--text-faint)]">Aucun commentaire pour le moment</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar path={c.user?.avatar_path} name={c.user?.name || "?"} size="xs" />
                    <div className="flex-1 rounded-2xl bg-[var(--bg-surface-hover)] px-3 py-2">
                      <p className="text-[11px] font-bold text-[var(--text-app)]">{c.user?.name || "Utilisateur"}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{c.content}</p>
                      <p className="mt-1 text-[10px] text-[var(--text-faint)]">{timeAgo(c.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 transition hover:border-teal-500/40 hover:bg-[var(--bg-surface)]"
    >
      <Avatar path={avatar} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--text-app)]">{name}</p>
        {email && <p className="truncate text-[10px] text-[var(--text-faint)]">{email}</p>}
      </div>
      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
        member.role === "owner" ? "border-teal-500/30 bg-[#0F9691]/10 text-[#0F9691]"
        : member.role === "admin" ? "border-teal-500/30 bg-[#0F9691]/10 text-[#0F9691]"
        : "border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
      }`}>
        {member.role}
      </span>
      <ArrowRight size={14} className="shrink-0 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

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
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 transition hover:border-teal-500/40 hover:bg-[var(--bg-surface)]"
    >
      <Avatar path={avatar} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--text-app)]">{name}</p>
        <p className="truncate text-[10px] text-[var(--text-faint)]">{position}</p>
      </div>
      {employee.has_account && (
        <span className="shrink-0 rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0F9691]">
          Compte
        </span>
      )}
      <ArrowRight size={14} className="shrink-0 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

function EmployeeDetailModal({ employee, onClose }) {
  const name = employee.user?.name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Salarié";
  const email = employee.user?.email || employee.email;
  const phone = employee.user?.phone || employee.phone;
  const position = employee.position;

  const profile = employee.user?.professional_profile || employee.user?.professionalProfile;
  const bio = profile?.bio;
  const headline = profile?.headline;
  const displayPosition = position || headline;

  const avatar = employee.photo_path || profile?.avatar_path;

  return (
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--text-app)]">Détails du salarié</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar path={avatar} name={name} size="xl" />
            <h2 className="mt-3 text-lg font-bold text-[var(--text-app)]">{name}</h2>
            {position && <p className="text-xs text-[#0F9691]">{position}</p>}
            {headline && <p className="mt-1 text-xs text-[var(--text-muted)]">{headline}</p>}

            {employee.has_account ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F9691]">
                <CheckCircle size={10} /> Compte actif
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F9691]">
                <AlertCircle size={10} /> Sans compte
              </span>
            )}
          </div>

          {bio && (
            <div className="mt-5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">À propos</p>
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

function MemberDetailModal({ member, companyId, onClose, onPhotoUpdated }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const name = member.user?.name || "Utilisateur";
  const email = member.user?.email;
  const role = member.role;
  const profile = member.user?.professional_profile || member.user?.professionalProfile;
  const headline = profile?.headline;

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
      showToast("Photo mise à jour", "success");
      onPhotoUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--text-app)]">Détails du membre</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center text-center">
            <div className="group relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
              <Avatar path={avatar} name={name} size="xl" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                {uploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <h2 className="mt-3 text-lg font-bold text-[var(--text-app)]">{name}</h2>
            {headline && <p className="mt-1 text-xs text-[var(--text-muted)]">{headline}</p>}

            <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
              role === "owner" ? "border-teal-500/30 bg-[#0F9691]/10 text-[#0F9691]"
              : role === "admin" ? "border-teal-500/30 bg-[#0F9691]/10 text-[#0F9691]"
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

          <p className="mt-4 text-center text-[10px] text-[var(--text-faint)]">Cliquez sur la photo pour la modifier</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)]">
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-app)]">{value}</p>
      </div>
    </div>
  );
}

function AllPeopleModal({ title, subtitle, icon: Icon, people, type, onClose, onRemove, onAdd, onClick }) {
  const [search, setSearch] = useState("");

  const filtered = people.filter((p) => {
    const name = p.user?.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
    const email = p.user?.email || p.email || "";
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F9691]/15 text-[#0F9691]">
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
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 transition focus-within:border-teal-500/50">
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
                    className={`rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4 ${onClick ? "cursor-pointer transition hover:border-teal-500/40" : ""}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar path={avatar} name={name} size="lg" />
                      <p className="mt-3 line-clamp-1 text-sm font-bold text-[var(--text-app)]">{name}</p>
                      {subtitle && <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
                      {email && <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-faint)]">{email}</p>}
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
            <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F9691] px-4 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79]">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F9691]">
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "..." : isEditing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
          if (u.avatar_path) setAvatarPreview(`/storage/${u.avatar_path}`);
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
          await api.post(`/companies/${companyId}/members/${createdMember.id}/photo`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("Membre ajouté", "success");
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
          <div className="group relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
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
            <p className="text-xs font-semibold text-[var(--text-app)]">Photo du membre</p>
            <p className="text-[10px] text-[var(--text-faint)]">Optionnel · max 2 Mo</p>
          </div>
        </div>

        <Field icon={Mail} label="Email *">
          <div className="relative">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className={inputCls} />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#0F9691]" />}
          </div>

          {suggestedUser && (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-teal-500/30 bg-[#0F9691]/10 p-2.5">
              <CheckCircle size={16} className="shrink-0 text-[#0F9691]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#0F9691]">
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
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

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
          if (u.avatar_path) setAvatarPreview(`/storage/${u.avatar_path}`);
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
          await api.post(`/companies/${companyId}/employees/${created.id}/photo`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("Salarié ajouté", "success");
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
          <div className="group relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
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
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className={inputCls} />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#0F9691]" />}
          </div>

          {suggestedUser && (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-teal-500/30 bg-[#0F9691]/10 p-2.5">
              <CheckCircle size={16} className="shrink-0 text-[#0F9691]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#0F9691]">
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
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

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
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md" onClick={onClose}>
    {/* 👇 FOND BLANC OPAQUE ICI */}
    <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
      
      {/* HEADER VERT */}
      <div className="flex items-start justify-between gap-3 bg-[#103b2c] px-6 py-5 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#16A99F]">Nouvelle offre</p>
          <h2 className="mt-0.5 text-lg font-bold">Publier une offre</h2>
          <p className="text-xs text-teal-100/70">pour {company.name}</p>
        </div>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 transition hover:bg-white/20">
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
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Développeur Web Junior" className={inputCls} />
          </Field>

          <Field icon={FileText} label="Type d'offre *">
            <select value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value })} className={inputCls}>
              <option value="internship">Stage</option>
              <option value="apprenticeship">Alternance</option>
              <option value="junior_mission">Mission junior</option>
              <option value="first_job">Premier emploi</option>
            </select>
          </Field>

          <Field icon={FileText} label="Description *">
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez la mission..." className={inputCls} />
            <p className={`mt-1 text-[10px] ${form.description.length < 20 ? "text-amber-400" : "text-[var(--text-faint)]"}`}>
              {form.description.length} / 20 caractères minimum
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={MapPin} label="Ville">
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Antananarivo" className={inputCls} />
            </Field>
            <Field icon={MapPin} label="Pays">
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Madagascar" className={inputCls} />
            </Field>
          </div>

          <Field icon={Calendar} label="Date limite de candidature">
            <input type="date" value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} className={inputCls} />
          </Field>

          <label className="flex items-center gap-2.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3 text-sm text-[var(--text-app)]">
            <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} className="h-4 w-4 accent-teal-500" />
            <Home size={14} className="text-[var(--text-muted)]" />
            Poste en télétravail
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {saving ? "Publication..." : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [commentsCount, setCommentsCount] = useState(offer.comments_count || 0);

  useEffect(() => {
    api.get(`/job-offers/${offer.id}/comments`)
      .then((res) => {
        const list = res.data.data || [];
        setCommentsCount(list.length);
      })
      .catch(() => {});
  }, [offer.id]);

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
      showToast("Lien copié", "success");
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
      setCommentsCount((c) => c + 1);
      setCommentText("");
      showToast("Commentaire ajouté", "success");
    } catch (err) {
      console.error("Erreur comment:", err.response?.status, err.response?.data);
      showToast(err.response?.data?.message || `Erreur ${err.response?.status || ""}`, "error");
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
    <div id={`offer-${offer.id}`} className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-teal-500/30">
      <div className="flex items-start gap-3">
        <Avatar path={company?.logo_url || company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-[var(--text-app)]">
              {company?.name || "Entreprise"}
            </p>
            {company?.is_verified && <BadgeCheck size={13} className="text-[#0F9691]" />}
            {isMyOffer && (
              <span className="rounded-md border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0F9691]">
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
              <span className="rounded border border-teal-500/30 bg-[#0F9691]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#0F9691]">
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

      <div className="mt-3">
        <span className="inline-block rounded-full border border-teal-500/30 bg-[#0F9691]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0F9691]">
          {OFFER_TYPES[offer.offer_type] || offer.offer_type}
        </span>
        <h3 className="mt-2 text-base font-bold text-[var(--text-app)]">{offer.title}</h3>
        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[var(--text-muted)]">
          {offer.description}
        </p>
      </div>

      {likesCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
            <Heart size={9} fill="currentColor" />
          </span>
          {likesCount} {likesCount > 1 ? "personnes aiment" : "personne aime"}
        </div>
      )}

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
          {commentsCount > 0 ? commentsCount : "Commenter"}
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
            {(currentUser?.role === "employee" || currentUser?.role === "student") && (
              <button
                onClick={() => onApply?.(offer)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0F9691]/10 py-2 text-xs font-bold text-[#0F9691] transition hover:bg-[#0F9691]/20"
              >
                <Briefcase size={14} />
                Postuler
              </button>
            )}

            {currentUser?.role === "company" && (
              <button
                onClick={() => {
                  const ownerId = offer.company?.owner_user_id;
                  if (ownerId) navigate(`/messages?to=${ownerId}`);
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0F9691]/10 py-2 text-xs font-bold text-[#0F9691] transition hover:bg-[#0F9691]/20"
              >
                <MessageCircle size={14} />
                Contacter
              </button>
            )}
          </>
        )}
      </div>

      {showComments && (
        <div className="mt-3 border-t border-[var(--border-app)] pt-3">
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <Avatar path={currentUser?.avatar_path} name={currentUser?.name || "?"} size="xs" />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrivez un commentaire..."
              className="flex-1 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-teal-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="rounded-full bg-[#0F9691] p-1.5 text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-40"
            >
              {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {loadingComments ? (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-[#0F9691]" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-[var(--text-faint)]">Aucun commentaire pour le moment</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar path={c.user?.avatar_path} name={c.user?.name || "?"} size="xs" />
                  <div className="flex-1 rounded-2xl bg-[var(--bg-surface-hover)] px-3 py-2">
                    <p className="text-[11px] font-bold text-[var(--text-app)]">{c.user?.name || "Utilisateur"}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{c.content}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-faint)]">{timeAgo(c.created_at)}</p>
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
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F9691]">Postuler</p>
            <h2 className="mt-0.5 text-base font-bold text-[var(--text-app)]">{offer.title}</h2>
            <p className="text-xs text-[var(--text-muted)]">chez {offer.company?.name || "l'entreprise"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[#0F9691]" size={24} />
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
                  className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-teal-500/50 focus:outline-none"
                />
              </div>

              {portfolio && (
                <div className="rounded-lg border border-teal-500/30 bg-[#0F9691]/10 p-3">
                  <p className="flex items-center gap-2 text-xs text-[#0F9691]">
                    <CheckCircle size={14} />
                    Votre portfolio sera joint automatiquement
                  </p>
                </div>
              )}

              {profile?.cv_path && (
                <div className="rounded-lg border border-teal-500/30 bg-[#0F9691]/10 p-3">
                  <p className="flex items-center gap-2 text-xs text-[#0F9691]">
                    <CheckCircle size={14} />
                    Votre CV sera joint automatiquement
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
                <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button type="submit" disabled={saving || !profile} className="inline-flex items-center gap-2 rounded-lg bg-[#0F9691] px-5 py-2 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0B7D79] disabled:opacity-50">
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
    <div className="ts-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
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
