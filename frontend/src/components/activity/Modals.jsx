import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Send, Inbox, Heart, Bookmark, Pencil, Plus, Rocket, Loader2, X, GraduationCap, RotateCcw,
} from "lucide-react";
import api from "../../services/api";
import { Avatar, Empty, ModalShell, fileUrl, formatShortDate, getAuthor, getMissionTitle, OFFER_TYPES } from "./shared";

const inputCls =
  "w-full rounded-xl border-0 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 outline-none ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-300 dark:bg-[#142B49] dark:text-white dark:ring-white/10";
const labelCls = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";

/* ---------- Historique ---------- */
export function HistoryModal({ type, sent, received, missions, onClose }) {
  const isSent = type === "sent";
  const isMissions = type === "missions";
  const data = isSent ? sent : type === "received" ? received : missions;
  const title = isSent ? "Candidatures envoyées" : type === "received" ? "Propositions reçues" : "Missions";
  const statusFr = { planned: "Acceptée", active: "En cours", trial: "Période d'essai", completed: "Terminée", cancelled: "Annulée", pending_employee: "En attente" };

  return (
    <ModalShell title={title} subtitle={`${data.length} élément(s)`} icon={isMissions ? Briefcase : isSent ? Send : Inbox} onClose={onClose}>
      <div className="space-y-3 p-5">
        {data.length === 0 ? <Empty text="Aucun élément pour le moment." /> : data.map((item) => {
          const date = formatShortDate(item.created_at || item.start_at);
          const rowCls = "rounded-2xl bg-slate-50/80 p-4 transition hover:bg-slate-50 dark:bg-white/5";
          if (isMissions) {
            return (
              <div key={item.id} className={rowCls}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{getMissionTitle(item)}</span>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">{statusFr[item.status] || item.status}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avec : {item.requesting_company?.name || item.requestingCompany?.name || item.supplying_company?.name || "N/A"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Début : {date}</p>
                <Link to={`/missions/${item.id}`} className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline dark:text-teal-300">Voir la mission →</Link>
              </div>
            );
          }
          const tone = item.status === "accepted" ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300" : item.status === "declined" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300";
          return (
            <div key={item.id} className={rowCls}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{item.title || item.resource_request?.title || "Sans titre"}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${tone}`}>{item.status_label || item.status}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isSent ? `À : ${item.to_company?.name || item.resource_request?.company?.name || "Entreprise"}` : `De : ${item.proposing_company?.name || item.profile?.user?.name || "Talent"}`}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Le {date}</p>
              <Link to={`/proposals/${item.id}`} className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline dark:text-teal-300">Voir le détail →</Link>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

/* ---------- Création d'un besoin ---------- */
export const CONTRACT_CHOICES = [
  { id: "stage", label: "Stage", hint: "Durée déterminée", icon: GraduationCap, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" },
  { id: "alternance", label: "Alternance", hint: "Durée déterminée", icon: RotateCcw, color: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" },
  { id: "emploi", label: "Emploi", hint: "CDI · essai d'1 mois", icon: Briefcase, color: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  { id: "mission", label: "Mission freelance", hint: "Ponctuelle", icon: Rocket, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
];

export function CreateRequestModal({ onClose, onPublish, user, isCompany, publishing, preset = "stage" }) {
  const [form, setForm] = useState({
    title: "", description: "", type: isCompany ? "Mission" : "Proposition", contract_type: preset,
    city: user?.city || user?.professional_profile?.city || "",
    budget_min: "", budget_max: "", remote: false,
    start_at: new Date().toISOString().split("T")[0], end_at: "",
  });
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isJob = form.contract_type === "emploi";

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const common = {
      title: form.title.trim(), description: form.description.trim(), status: "published",
      workload_percent: 100, remote: form.remote, urgency: "normal", positions_count: 1, city: form.city,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      start_at: form.start_at || today,
    };
    onPublish(isCompany
      ? { ...common, type: form.type.toLowerCase(), contract_type: form.contract_type, author_type: "company", company_id: user?.companies?.[0]?.id, end_at: isJob ? null : form.end_at }
      : { ...common, type: "Proposition", author_type: "talent", company_id: null, end_at: null });
  };

  return (
    <div className="ts-root fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="ts-pop flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A]">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-[#0B1F33] to-[#16324F] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-teal-300">{isCompany ? <Plus size={19} /> : <Rocket size={19} />}</span>
            <div>
              <h3 className="text-base font-semibold">{isCompany ? "Publier un besoin" : "Mettre en avant mes compétences"}</h3>
              <p className="text-[11px] text-white/65">{isCompany ? "Décrivez votre projet à la communauté." : "Décrivez ce que vous savez faire."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X size={17} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {isCompany && (
            <div>
              <label className={labelCls}>Type de contrat proposé *</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CONTRACT_CHOICES.map((c) => {
                  const on = form.contract_type === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => update("contract_type", c.id)}
                      className={`flex flex-col items-start rounded-2xl p-3.5 text-left transition ${on ? "bg-teal-50/70 ring-2 ring-teal-300 dark:bg-teal-500/10" : "bg-slate-50/80 hover:bg-slate-100/80 dark:bg-white/5"}`}>
                      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${c.color}`}><c.icon size={16} /></span>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{c.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{c.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>{isCompany ? "Titre du besoin *" : "Titre de votre profil *"}</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required maxLength={100} className={inputCls}
              placeholder={isCompany ? "Ex : Recherche stage en design UI/UX" : "Ex : Développeur React junior, disponible pour un stage"} />
          </div>
          <div>
            <label className={labelCls}>{isCompany ? "Description du besoin *" : "Présentez vos compétences *"}</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} required rows={4} className={`${inputCls} resize-y`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Ville</label><input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputCls} placeholder="Ex : Antananarivo" /></div>
            <div>
              <label className={labelCls}>Budget / Tarif (€ / jour)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} className={inputCls} placeholder="Min" />
                <input type="number" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} className={inputCls} placeholder="Max" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Disponible à partir du</label><input type="date" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className={inputCls} /></div>
            {isCompany && !isJob && <div><label className={labelCls}>Fin (optionnel)</label><input type="date" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputCls} /></div>}
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
            <input type="checkbox" checked={form.remote} onChange={(e) => update("remote", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            <span className="text-sm text-slate-700 dark:text-white">{isCompany ? "Télétravail possible" : "Ouvert au télétravail"}</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300">Annuler</button>
          <button type="submit" disabled={publishing || !form.title.trim() || !form.description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#16324F] disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
            {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} {publishing ? "Publication…" : isCompany ? "Publier le besoin" : "Publier mon profil"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Édition ---------- */
export function EditPostModal({ post, onClose, onSubmit }) {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDescription] = useState(post.description || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(post, { title: title.trim(), description: description.trim() });
    setSaving(false);
  };

  return (
    <ModalShell title="Modifier la publication" subtitle="Ajustez le titre et la description" icon={Pencil} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4 p-6">
        <div><label className={labelCls}>Titre</label><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} className={inputCls} /></div>
        <div><label className={labelCls}>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} className={`${inputCls} resize-y`} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300">Annuler</button>
          <button type="submit" disabled={saving || !title.trim() || !description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
            {saving && <Loader2 size={13} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- Favoris ---------- */
export function FavoritesModal({ allRequests, favorites, onClose, onToggleFavorite }) {
  const list = useMemo(() => allRequests.filter((r) => favorites.includes(r.id)), [allRequests, favorites]);
  return (
    <ModalShell title="Mes favoris" subtitle={`${list.length} élément(s) sauvegardé(s)`} icon={Heart} onClose={onClose}>
      <div className="space-y-3 p-5">
        {list.length === 0 ? <Empty text="Vous n'avez pas encore de favoris." /> : list.map((req) => {
          const a = getAuthor(req);
          return (
            <div key={req.id} className="flex gap-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
              <Avatar src={a.logo} name={a.name} size={46} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-slate-800 dark:text-white">{req.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.name}{req.city && ` · ${req.city}`}</p>
                  </div>
                  <button onClick={() => onToggleFavorite(req.id)} aria-label="Retirer" className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Heart size={16} fill="currentColor" /></button>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{req.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">{req.match_score ? `${req.match_score}% Match` : "Nouveau"}</span>
                  <Link to={req.is_job_offer ? `/job-offers/${req.real_id}` : `/resource-requests/${req.real_id || req.id}`} className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-300">Voir →</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

/* ---------- Offres sauvegardées ---------- */
export function SavedOffersModal({ savedOffers, onClose, onToggleSavedOffer, onSelectOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedOffers.length === 0) { setOffers([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(savedOffers.map((id) => api.get(`/job-offers/${id}`).then((r) => r.data?.data || r.data).catch(() => null)))
      .then((res) => setOffers(res.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [savedOffers]);

  return (
    <ModalShell title="Offres sauvegardées" subtitle={`${offers.length} offre(s) enregistrée(s)`} icon={Bookmark} onClose={onClose}>
      <div className="space-y-3 p-5">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal-500" size={28} /></div>
        ) : offers.length === 0 ? (
          <Empty text="Vous n'avez pas encore d'offres sauvegardées." />
        ) : offers.map((o) => (
          <div key={o.id} className="flex gap-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
            <Avatar src={fileUrl(o.company?.logo_path)} name={o.company?.name} size={46} rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium text-slate-800 dark:text-white">{o.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{o.company?.name}{o.city && ` · ${o.city}`}</p>
                </div>
                <button onClick={() => onToggleSavedOffer(o.id)} aria-label="Retirer" className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Heart size={16} fill="currentColor" /></button>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{o.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">{OFFER_TYPES[o.offer_type] || "Offre"}</span>
                <button onClick={() => onSelectOffer(o.id)} className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-300">Voir l'offre →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}