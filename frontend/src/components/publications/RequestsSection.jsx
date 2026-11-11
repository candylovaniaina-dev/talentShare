import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Plus, MapPin, CalendarDays, Pencil, Trash2, FileText, Clock,
  Pause, Play, Send, Users, Building2, X,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceRequestModal from "./CreateResourceRequestModal";
import {
  asArray, fmtDate, Button, Segmented, SearchInput, ViewToggle,
  StatusBadge, MetaItem, Figure, ConfirmDialog, Notice, ListSkeleton, EmptyPanel,
} from "./PublicationsUI";

const MISSION_LABELS = {
  mission: "Mission ponctuelle",
  staffing: "Mise à disposition",
  freelance: "Prestation freelance",
};

const STATUS_CFG = {
  draft: { label: "Brouillon", style: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300", dot: "bg-slate-400" },
  published: { label: "Publiée", style: "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]", dot: "bg-[#16B8B1]" },
  paused: { label: "En pause", style: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
  closed: { label: "Fermée", style: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500" },
  filled: { label: "Pourvue", style: "bg-[#0F2340]/10 text-[#0F2340] dark:bg-white/10 dark:text-white", dot: "bg-[#0F2340]" },
  expired: { label: "Expirée", style: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400", dot: "bg-slate-400" },
};

export default function RequestsSection({ onStats }) {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [companyChecked, setCompanyChecked] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRequestId, setEditRequestId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState("");
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const closeNotice = useCallback(() => setNotice(""), []);

  useEffect(() => {
    if (!user?.id) return;
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id) || null);
    }).catch(() => setCompany(null)).finally(() => setCompanyChecked(true));
  }, [user?.id]);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/resource-requests", { params: { my: 1 } }).then((res) => setRequests(asArray(res.data))).catch((err) => { console.error("Erreur de chargement des demandes :", err); setRequests([]); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (company) load(); }, [company, load]);

  useEffect(() => {
    if (!onStats) return;
    onStats({
      total: requests.length,
      published: requests.filter((r) => r.display_status === "published").length,
      proposals: requests.reduce((s, r) => s + (Number(r.proposals_count) || 0), 0),
      views: requests.reduce((s, r) => s + (Number(r.views_count) || 0), 0),
    });
  }, [requests, onStats]);

  const doAction = async (id, action) => {
    try { await api.post(`/resource-requests/${id}/${action}`); load(); }
    catch (err) { setNotice(err.response?.data?.message || "Impossible d'effectuer cette action."); }
  };

  const confirmDelete = async () => {
    await api.delete(`/resource-requests/${pendingDelete.id}`);
    setPendingDelete(null); load();
  };

  const openCreate = () => { setEditRequestId(null); setShowCreateModal(true); };
  const openEdit = (id) => { setEditRequestId(id); setShowCreateModal(true); };
  const closeModal = () => { setShowCreateModal(false); setEditRequestId(null); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter === "published" && r.display_status !== "published") return false;
      if (filter === "urgent" && r.urgency !== "urgent") return false;
      if (filter === "expired" && r.display_status !== "expired") return false;
      if (!q) return true;
      return [r.title, r.description, r.city, ...(r.skills || []).map((s) => s.name)].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [requests, filter, query]);

  if (companyChecked && !company) {
    return (
      <EmptyPanel icon={FileText} title="Configurez votre entreprise" text="Créez votre profil entreprise pour publier une demande de ressource et recevoir des propositions de talents.">
        <Button to="/company" variant="primary" size="md">Créer mon entreprise</Button>
      </EmptyPanel>
    );
  }

  if (!companyChecked) return <ListSkeleton label="Chargement des demandes" />;

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <SearchInput value={query} onChange={setQuery} placeholder="Titre, ville, compétence…" />
        </div>
        <p className="text-xs text-slate-500 sm:ml-2">{filtered.length} sur {requests.length} demande{requests.length > 1 ? "s" : ""}</p>
        <Button variant="primary" size="md" icon={Plus} onClick={openCreate} className="sm:ml-auto">Nouvelle demande</Button>
      </div>

      {loading ? (
        <ListSkeleton label="Chargement des demandes" />
      ) : filtered.length === 0 ? (
        <EmptyPanel icon={FileText} title={requests.length === 0 ? "Vous n'avez pas encore publié de demande" : "Aucune demande ne correspond à ces critères"} text="Décrivez votre besoin pour recevoir des propositions de talents.">
          <Button variant="primary" size="md" icon={Plus} onClick={openCreate}>Créer une demande</Button>
        </EmptyPanel>
      ) : (
        <div className={view === "grid" ? "grid gap-3 md:grid-cols-2" : "space-y-2.5"}>
          {filtered.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              grid={view === "grid"} 
              onAction={doAction} 
              onDelete={() => setPendingDelete({ id: request.id, title: request.title })} 
              onEdit={openEdit}
              onOpen={() => setSelectedRequest(request)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateResourceRequestModal requestId={editRequestId} onClose={closeModal} onSuccess={() => { closeModal(); load(); }} />
      )}
      {pendingDelete && (
        <ConfirmDialog title="Supprimer cette demande ?" message={`« ${pendingDelete.title} » et les propositions associées ne seront plus accessibles.`} fallbackError="Impossible de supprimer cette demande." onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
      )}
      
      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
          onEdit={(id) => { setSelectedRequest(null); openEdit(id); }}
        />
      )}
      
      <Notice message={notice} onClose={closeNotice} />
    </div>
  );
}

function RequestCard({ request, grid, onAction, onDelete, onEdit, onOpen }) {
  const status = request.display_status;
  const daysLeft = request.days_until_expiry;
  const isExpiringSoon = daysLeft !== null && daysLeft !== undefined && daysLeft <= 7 && status === "published";
  const isUrgent = request.urgency === "urgent";
  const proposals = request.proposals_count || 0;
  
  // ✅ Utilisation du nombre de postes restants calculé par le Back-end
  const positions = request.remaining_positions !== undefined 
    ? request.remaining_positions 
    : (request.positions_count || 1);

  const stopClick = (e) => e.stopPropagation();
  const openOnKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } };

  return (
    <article onClick={onOpen} role="button" tabIndex={0} onKeyDown={openOnKey} className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#16B8B1]/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:border-white/10 dark:bg-[#131E47]">
      <div className={`flex flex-1 flex-col gap-4 p-4 ${grid ? "" : "lg:flex-row lg:items-start lg:justify-between lg:gap-8"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={status} config={STATUS_CFG} />
            
            {isUrgent && (
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                Urgente
              </span>
            )}

            {request.mission_type && MISSION_LABELS[request.mission_type] && (
              <span className="rounded-md bg-[#0B1F33]/5 px-2 py-0.5 text-[11px] font-medium text-[#0B1F33] dark:bg-white/10 dark:text-slate-200">
                {MISSION_LABELS[request.mission_type]}
              </span>
            )}

            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                <Clock size={11} /> Expire dans {daysLeft} j
              </span>
            )}
          </div>
          
          <h3 className="mt-2.5 text-[15px] font-bold text-[#0F2340] transition hover:text-[#16B8B1] dark:text-white">{request.title}</h3>

          {request.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-slate-500">{request.description}</p>}
          {(request.city || (request.start_at && request.end_at)) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {request.city && <MetaItem icon={MapPin}>{request.city}</MetaItem>}
              {request.start_at && request.end_at && <MetaItem icon={CalendarDays}>{fmtDate(request.start_at)} – {fmtDate(request.end_at)}</MetaItem>}
            </div>
          )}
          {request.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {request.skills.slice(0, 5).map((skill) => (
                <span key={skill.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">{skill.name}</span>
              ))}
              {request.skills.length > 5 && <span className="text-[11px] text-slate-400">+{request.skills.length - 5}</span>}
            </div>
          )}
        </div>
        
        <div className={`flex shrink-0 gap-6 ${grid ? "border-t border-slate-100 pt-3 dark:border-white/10" : "border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:border-white/10"}`} onClick={stopClick}>
          <Figure value={request.views_count || 0} label="Vues" />
          <Link to="/collaborations?tab=received" className="group/stat block cursor-pointer transition hover:-translate-y-0.5 text-left">
            <Figure value={proposals} label={`Proposition${proposals > 1 ? "s" : ""}`} accent={proposals > 0} />
          </Link>
          <Figure value={positions} label={positions > 1 ? "Postes restants" : "Poste restant"} accent={positions === 0} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 bg-[#F3F6FC]/50 px-3 py-2 dark:border-white/10 dark:bg-white/5" onClick={stopClick}>
        <Button onClick={() => onOpen()} variant="ghost" icon={FileText} className="mr-1">
          Voir les détails
        </Button>

        {["published", "paused"].includes(status) && (
          <Button to={`/resource-requests/${request.id}?candidates=1`} variant="soft" icon={Users}>Voir les candidats</Button>
        )}
        
        {status === "draft" && <Button variant="soft" icon={Send} onClick={() => onAction(request.id, "publish")}>Publier</Button>}
        {status === "published" && <Button variant="ghost" icon={Pause} onClick={() => onAction(request.id, "pause")}>Mettre en pause</Button>}
        {status === "paused" && <Button variant="ghost" icon={Play} onClick={() => onAction(request.id, "publish")}>Reprendre</Button>}
        
        <span className="flex-1" />
        
        <Button variant="ghost" icon={Pencil} onClick={() => onEdit(request.id)}>Modifier</Button>
        <Button variant="danger" icon={Trash2} onClick={onDelete}>Supprimer</Button>
      </div>
    </article>
  );
}

/* ✅ MODALE DE DÉTAILS (Avec en-tête bleu) */
function InfoCell({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F3F6FC]/60 px-3 py-2.5 dark:border-white/10 dark:bg-[#0A1230]">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-medium text-slate-800 dark:text-white">{children}</p>
    </div>
  );
}

function RequestDetailModal({ request, onClose, onEdit }) {
  const status = request.display_status;
  const typeLabel = MISSION_LABELS[request.mission_type] || request.mission_type;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06141F]/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#131E47]" onClick={(e) => e.stopPropagation()}>
        
        <div className="relative flex shrink-0 items-start justify-between gap-4 overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#142B49] px-5 py-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          
          <div className="relative min-w-0 z-10">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                status === 'published' ? 'bg-[#16B8B1] text-[#0B1F33]' : 'bg-white/20 text-white'
              }`}>
                {status === 'published' ? 'Publiée' : status}
              </span>
              <span className="text-xs text-white/70">{typeLabel && `${typeLabel}`}</span>
            </div>
            <h3 className="text-lg font-semibold leading-tight text-white">{request.title}</h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/80">
              <Building2 size={13} />{request.company?.name || "Votre entreprise"}
            </p>
          </div>
          
          <button type="button" onClick={onClose} aria-label="Fermer" className="relative z-10 shrink-0 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"><X size={17} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
            {request.city && <InfoCell label="Lieu">{request.city}</InfoCell>}
            {(request.start_at || request.end_at) && (
              <InfoCell label="Période">
                {fmtDate(request.start_at)} {request.end_at && `– ${fmtDate(request.end_at)}`}
              </InfoCell>
            )}
            <InfoCell label="Candidatures">{request.proposals_count || 0}</InfoCell>
            {request.budget_min && <InfoCell label="Budget">{request.budget_min} € - {request.budget_max || request.budget_min} € / jour</InfoCell>}
          </div>

          <h4 className="mb-2 text-[13px] font-bold text-[#0B1F33] dark:text-white">Description complète</h4>
          <div className="rounded-xl border border-slate-200 bg-[#F3F6FC]/60 p-4 dark:border-white/10 dark:bg-[#0A1230]">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{request.description || "Aucune description fournie."}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-white/10 sm:px-6">
          <Button variant="ghost" icon={Pencil} onClick={() => onEdit(request.id)}>Modifier</Button>
          <Button variant="secondary" size="md" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}