import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom"; // ✅ AJOUTÉ
import {
  Plus, BriefcaseBusiness, Users, MapPin, CalendarDays, Laptop,
  Pencil, Trash2, FileText, Building2, X, Clock, Banknote,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceOfferModal from "./CreateResourceOfferModal";
import CreateJobOfferModal from "./CreateJobOfferModal";
import {
  asArray, fmtDate, timestamp, Button, SearchInput, SelectField,
  ViewToggle, StatusBadge, MetaItem, Figure, Pipeline, ConfirmDialog,
  ListSkeleton, EmptyPanel,
} from "./PublicationsUI";

const OFFER_TYPES = {
  internship: "Stage", apprenticeship: "Alternance", fixed_term: "CDD",
  permanent: "Recrutement permanent", first_job: "Recrutement permanent",
  junior_mission: "Mission junior", freelance: "Freelance", student_project: "Projet étudiant",
};

const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel",
  freelance: "Freelance", mission: "Mission", loan: "Mise à disposition",
};

const JOB_STATUS = {
  draft: { label: "Brouillon", style: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300", dot: "bg-slate-400" },
  published: { label: "Publiée", style: "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]", dot: "bg-[#16B8B1]" },
  closed: { label: "Clôturée", style: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500" },
  expired: { label: "Expirée", style: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400", dot: "bg-slate-400" },
};

const RESOURCE_STATUS = {
  ...JOB_STATUS,
  mission_pending: { label: "Mission en attente", style: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
  mission_planned: { label: "Mission acceptée", style: "bg-[#0B1F33]/10 text-[#0B1F33] dark:bg-white/10 dark:text-white", dot: "bg-[#0B1F33]" },
  mission_active: { label: "Mission en cours", style: "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]", dot: "bg-[#16B8B1]" },
};

const LIFECYCLE = [
  { id: "draft", label: "Brouillon" }, { id: "published", label: "Publiée" },
  { id: "mission_pending", label: "En attente" }, { id: "mission_planned", label: "Acceptée" },
  { id: "mission_active", label: "En cours" },
];

const statusGroup = (o) => {
  const k = o.__type === "job" ? o.status : o.display_status || o.status;
  if (k === "published") return "published";
  if (k === "draft") return "draft";
  if (String(k).startsWith("mission_")) return "mission";
  return "closed";
};

const STATUS_FILTERS = [
  { id: "all", label: "Tous les statuts" }, { id: "published", label: "Publiées" },
  { id: "draft", label: "Brouillons" }, { id: "mission", label: "Missions" },
  { id: "closed", label: "Clôturées / expirées" },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Plus récentes" }, { id: "title", label: "Titre (A–Z)" },
];

export default function OffersSection({ mode = "jobs", onStats }) {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ AJOUTÉ
  const isCompany = user?.role === "company";
  const isJobs = mode === "jobs";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("list");
  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOfferId, setEditOfferId] = useState(null);
  const [pending, setPending] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    if (!isCompany) { setCompany(null); return; }
    api.get("/companies/me").then((r) => setCompany(r.data)).catch(() => setCompany(null));
  }, [isCompany]);

  const load = useCallback(() => {
    setLoading(true);
    let request;
    if (isJobs) request = api.get(isCompany ? "/job-offers/my" : "/job-offers");
    else if (isCompany) request = api.get("/resource-offers/my");
    else request = Promise.resolve({ data: [] });

    request
      .then((r) => asArray(r.data))
      .catch(() => [])
      .then((list) => setOffers(list.map((o) => ({ ...o, __type: isJobs ? "job" : "resource" }))))
      .finally(() => setLoading(false));
  }, [isCompany, isJobs]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!onStats) return;
    onStats({
      total: offers.length,
      published: offers.filter((o) => statusGroup(o) === "published").length,
      drafts: offers.filter((o) => statusGroup(o) === "draft").length,
      applications: offers.reduce((s, o) => s + (Number(o.applications_count) || 0), 0),
      missions: offers.filter((o) => statusGroup(o) === "mission").length,
    });
  }, [offers, onStats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = offers.filter((o) => {
      if (statusFilter !== "all" && statusGroup(o) !== statusFilter) return false;
      if (!q) return true;
      return [o.title, o.description, o.city, o.location_city, o.company?.name, o.profile?.user?.name]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
    return list.sort((a, b) =>
      sort === "title"
        ? String(a.title).localeCompare(String(b.title), "fr")
        : timestamp(b) - timestamp(a) || b.id - a.id
    );
  }, [offers, statusFilter, query, sort]);

  const confirmDelete = async () => {
    const { id } = pending;
    await api.delete(isJobs ? `/job-offers/${id}` : `/resource-offers/${id}`);
    setPending(null);
    load();
  };

  // ✅ MODIFICATION 1 : Redirection vers le vivier pour les ressources
  const openCreate = () => {
    if (!isJobs) { 
      navigate("/resource-offers/browse?tab=pool"); 
      return; 
    }
    setEditOfferId(null);
    setShowModal(true);
  };

  const openEdit = (id) => { setEditOfferId(id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditOfferId(null); };

  const hasActiveFilters = query || statusFilter !== "all";
  const resetFilters = () => { setQuery(""); setStatusFilter("all"); };
  const statusOptions = isJobs ? STATUS_FILTERS.filter((s) => s.id !== "mission") : STATUS_FILTERS;
  
  const canCreate = isCompany && (!isJobs || company); 
  // ✅ MODIFICATION 2 : Nouveau libellé
  const createLabel = isJobs ? "Publier une offre" : "Gérer mon vivier";

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2.5">
          <ViewToggle value={view} onChange={setView} />
          <SearchInput value={query} onChange={setQuery} placeholder={isJobs ? "Rechercher un recrutement…" : "Rechercher une ressource…"} />
        </div>
        <div className="flex items-center gap-2.5">
          <SelectField value={statusFilter} onChange={setStatusFilter} options={statusOptions} label="Filtrer par statut" />
          <SelectField value={sort} onChange={setSort} options={SORT_OPTIONS} label="Trier" />
        </div>
        <p className="text-sm font-medium text-slate-500 lg:ml-2">{filtered.length} sur {offers.length}</p>

        {canCreate && !isJobs && (
          <Button variant="primary" size="md" icon={Plus} onClick={openCreate} className="lg:ml-auto">
            {createLabel}
          </Button>
        )}
      </div>

      {loading ? (
        <ListSkeleton label="Chargement" />
      ) : filtered.length === 0 ? (
        hasActiveFilters ? (
          <EmptyPanel icon={FileText} title="Aucun résultat" text="Modifiez vos critères ou réinitialisez les filtres.">
            <Button variant="secondary" size="md" onClick={resetFilters}>Réinitialiser les filtres</Button>
          </EmptyPanel>
        ) : (
          <EmptyPanel
            icon={isJobs ? BriefcaseBusiness : Users}
            title={isJobs ? "Aucune offre de recrutement" : "Aucune ressource partagée"}
            text={isJobs
              ? "Publiez un stage, une alternance ou un recrutement permanent : les talents pourront postuler."
              : "Proposez un de vos salariés disponibles aux autres entreprises du réseau."}
          >
            {canCreate && !isJobs && (
              <Button variant="primary" size="md" icon={Plus} onClick={openCreate}>
                {createLabel}
              </Button>
            )}
          </EmptyPanel>
        )
      ) : (
        <div className={view === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
          {filtered.map((offer) =>
            isJobs ? (
              <JobOfferCard key={`job-${offer.id}`} offer={offer} grid={view === "grid"} isCompany={isCompany} onOpen={() => setSelectedOffer(offer)} onDelete={() => setPending({ id: offer.id, title: offer.title })} />
            ) : (
              <ResourceOfferCard key={`res-${offer.id}`} offer={offer} grid={view === "grid"} onOpen={() => setSelectedOffer(offer)} onDelete={() => setPending({ id: offer.id, title: offer.title })} onEdit={openEdit} />
            )
          )}
        </div>
      )}

      {showModal && isJobs && company && (
        <CreateJobOfferModal company={company} onClose={closeModal} onSuccess={() => { closeModal(); load(); }} />
      )}
      {showModal && !isJobs && (
        <CreateResourceOfferModal offerId={editOfferId} onClose={closeModal} onSuccess={() => { closeModal(); load(); }} />
      )}
      {pending && (
        <ConfirmDialog
          title="Supprimer cette publication ?"
          message={`« ${pending.title} » sera définitivement supprimée. Cette action est irréversible.`}
          fallbackError="Impossible de supprimer cette publication."
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
      {selectedOffer && <OfferDetailModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}
    </div>
  );
}

function InfoCell({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 dark:border-white/10 dark:bg-[#0A1230]">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#0B1F33] dark:text-white">{children}</p>
    </div>
  );
}

function OfferDetailModal({ offer, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isJob = offer.__type === "job";
  const statusKeyValue = isJob ? offer.status : offer.display_status || offer.status;
  const typeLabel = isJob ? OFFER_TYPES[offer.offer_type] || offer.offer_type : MISSION_TYPES[offer.mission_type] || offer.mission_type;

  const infoItems = [];
  
  if (isJob && offer.duration_text) {
    infoItems.push({ label: "Durée du contrat", value: offer.duration_text, icon: Clock });
  }
  if (offer.city || offer.location_city) {
    infoItems.push({ label: "Localisation", value: offer.city || offer.location_city, icon: MapPin });
  }
  if (isJob && offer.salary_min && offer.salary_max) {
    const min = parseInt(offer.salary_min, 10);
    const max = parseInt(offer.salary_max, 10);
    infoItems.push({ 
      label: "Rémunération", 
      value: `${isNaN(min) ? offer.salary_min : min.toLocaleString("fr-FR")} – ${isNaN(max) ? offer.salary_max : max.toLocaleString("fr-FR")} Ar/mois`, 
      icon: Banknote
    });
  } else if (!isJob && offer.daily_rate) {
    const rate = parseInt(offer.daily_rate, 10);
    infoItems.push({ label: "Tarif", value: `${isNaN(rate) ? offer.daily_rate : rate.toLocaleString("fr-FR")} € / jour`, icon: Banknote });
  }
  if (isJob && typeof offer.applications_count === "number") {
    infoItems.push({ label: "Candidatures", value: offer.applications_count, icon: Users });
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06141F]/70 p-4 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#131E47]" onClick={(e) => e.stopPropagation()}>
        
        <div className="relative flex shrink-0 items-start justify-between gap-4 overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#142B49] px-6 py-6 text-white">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          
          <div className="relative z-10 flex min-w-0 items-start gap-4">
         <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
   {offer.company?.logo_url || offer.company?.logo_path ? (
     <img 
       src={
         (offer.company.logo_url || offer.company.logo_path).startsWith('http')
           ? (offer.company.logo_url || offer.company.logo_path)
           : `http://localhost:8001/storage/${(offer.company.logo_url || offer.company.logo_path).replace(/^storage\//, '')}`
       } 
       alt={offer.company.name} 
       className="h-full w-full object-contain" 
     />
   ) : (
     <span className="text-lg font-bold text-[#0B1F33]">{offer.company?.name?.charAt(0) || "E"}</span>
   )}
</div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#16B8B1] mb-1">
                {offer.company?.name || "Entreprise"}
              </p>
              <h3 className="text-xl font-bold leading-tight text-white">{offer.title}</h3>
              
              <div className="mt-3 flex flex-wrap gap-2">
                 <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
                    statusKeyValue === 'published' ? 'bg-[#16B8B1] text-[#0B1F33]' : 'bg-white/20 text-white'
                  }`}>
                    {statusKeyValue === 'published' ? 'Publiée' : statusKeyValue}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white">
                    {typeLabel}
                  </span>
              </div>
            </div>
          </div>
          
          <button type="button" onClick={onClose} aria-label="Fermer" className="relative z-10 shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 font-['Plus_Jakarta_Sans',sans-serif]">
          
          {infoItems.length > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {infoItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-white/10 dark:bg-white/5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#0F9691] shadow-sm dark:bg-[#0A1230] dark:text-[#16B8B1]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h4 className="mb-3 text-sm font-bold text-[#0B1F33] dark:text-white">Description complète</h4>
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-[#0A1230]">
            <p className={`whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${isExpanded ? "" : "line-clamp-4"}`}>
              {offer.description || "Aucune description fournie."}
            </p>
            
            {offer.description && offer.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-sm font-semibold text-[#16B8B1] hover:underline"
              >
                {isExpanded ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-slate-200 px-6 py-4 dark:border-white/10">
          <Button variant="secondary" size="md" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
const stopClick = (e) => e.stopPropagation();
const openOnKey = (onOpen) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } };

function JobOfferCard({ offer, grid, isCompany, onDelete, onOpen }) {
  const count = offer.applications_count || 0;
  return (
    <article onClick={onOpen} role="button" tabIndex={0} onKeyDown={openOnKey(onOpen)} className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#16B8B1]/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:border-white/10 dark:bg-[#131E47]">
      <div className={`flex flex-1 flex-col gap-5 p-5 ${grid ? "" : "lg:flex-row lg:items-start lg:justify-between lg:gap-8"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={offer.status} config={JOB_STATUS} />
            <span className="rounded-md bg-[#0B1F33] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">Recrutement</span>
            <span className="text-xs font-medium text-slate-500">{OFFER_TYPES[offer.offer_type] || offer.offer_type}</span>
          </div>
          <h3 className="mt-3 text-base font-bold text-[#0B1F33] dark:text-white">{offer.title}</h3>
          {offer.company && <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-500"><Building2 size={14} className="text-slate-400" />{offer.company.name}</p>}
          {offer.description && <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{offer.description}</p>}
          {(offer.city || offer.remote) && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {offer.city && <MetaItem icon={MapPin}>{offer.city}</MetaItem>}
              {offer.remote && <MetaItem icon={Laptop}>Télétravail possible</MetaItem>}
            </div>
          )}
        </div>
        {isCompany && (
          <div className={`flex shrink-0 gap-6 ${grid ? "border-t border-slate-100 pt-4 dark:border-white/10" : "border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:border-white/10"}`}>
            <Figure value={count} label={`Candidature${count > 1 ? "s" : ""}`} accent={count > 0} />
          </div>
        )}
      </div>
      {isCompany && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#F8FAFC]/80 px-4 py-3 dark:border-white/10 dark:bg-white/5" onClick={stopClick}>
          <Button to={`/job-offers/${offer.id}/applications`} variant={count > 0 ? "soft" : "ghost"} icon={Users}>Voir les candidatures</Button>
          <Button variant="danger" icon={Trash2} onClick={onDelete} aria-label="Supprimer cette offre">Supprimer</Button>
        </div>
      )}
    </article>
  );
}

function ResourceOfferCard({ offer, grid, onDelete, onEdit, onOpen }) {
  const displayKey = offer.display_status || offer.status;
  const step = LIFECYCLE.findIndex((s) => s.id === displayKey);
  const name = offer.profile?.user?.name;
  return (
    <article onClick={onOpen} role="button" tabIndex={0} onKeyDown={openOnKey(onOpen)} className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#16B8B1]/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:border-white/10 dark:bg-[#131E47]">
      <div className={`flex flex-1 flex-col gap-5 p-5 ${grid ? "" : "lg:flex-row lg:items-start lg:justify-between lg:gap-8"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={displayKey} config={RESOURCE_STATUS} />
            <span className="rounded-md bg-[#16B8B1]/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#0F9691]">Ressource partagée</span>
            <span className="text-xs font-medium text-slate-500">{MISSION_TYPES[offer.mission_type] || offer.mission_type}</span>
          </div>
          <h3 className="mt-3 text-base font-bold text-[#0B1F33] dark:text-white">{offer.title}</h3>
          {name && <p className="mt-1.5 text-sm text-slate-500">{name}{offer.profile.headline && <span className="text-slate-400"> · {offer.profile.headline}</span>}</p>}
          {offer.description && <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{offer.description}</p>}
          {(offer.start_at || offer.location_city) && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {offer.start_at && offer.end_at && <MetaItem icon={CalendarDays}>{fmtDate(offer.start_at)} – {fmtDate(offer.end_at)}</MetaItem>}
              {offer.location_city && <MetaItem icon={MapPin}>{offer.location_city}</MetaItem>}
            </div>
          )}
        </div>
        {offer.daily_rate && (
          <div className={`shrink-0 ${grid ? "border-t border-slate-100 pt-4 dark:border-white/10" : "border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:border-white/10"}`}>
            <Figure value={`${offer.daily_rate} €`} label="par jour" accent />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#F8FAFC]/80 px-4 py-3 dark:border-white/10 dark:bg-white/5" onClick={stopClick}>
        <div className="min-w-0 flex-1" title="Progression">
          {step >= 0 ? <Pipeline steps={LIFECYCLE} current={step} /> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" icon={Pencil} onClick={() => onEdit(offer.id)}>Modifier</Button>
          <Button variant="danger" icon={Trash2} onClick={onDelete} aria-label="Supprimer cette ressource">Supprimer</Button>
        </div>
      </div>
    </article>
  );
}