import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  X, FileText, Calendar, Clock, MapPin, Eye, Inbox, Users, ArrowUpRight, Link2, Edit3,
  Globe, Building2, Lock,
} from "lucide-react";
import api from "../../services/api";
import {
  FONT, Avatar, StateBadge, SkillChips, WaiterRow, Skeleton, Empty, MISSION_TYPES, LOCATIONS,
  fmtDate, workloadLabel, money, toDate, workingDays, workloadFactor, relDays, daysUntil,
} from "./ui";

/* ───────────────────────── Libellés ───────────────────────── */
const OFFER_STATUS = {
  draft: ["Brouillon", "bg-white/10 text-white/80"],
  published: ["Publiée", "bg-[#16B8B1]/20 text-[#7FE8E3]"],
  closed: ["Clôturée", "bg-white/10 text-white/60"],
  expired: ["Expirée", "bg-rose-400/20 text-rose-200"],
  mission_pending: ["Mission en attente d'accord", "bg-amber-400/20 text-amber-200"],
  mission_planned: ["Mission planifiée", "bg-sky-400/20 text-sky-200"],
  mission_active: ["Mission en cours", "bg-violet-400/20 text-violet-200"],
};

const VISIBILITY = {
  public: ["Visible par tout le réseau", Globe],
  companies: ["Visible par les entreprises", Building2],
  private: ["Privée", Lock],
};

const storage = (p) => (p ? (p.startsWith("http") ? p : `/storage/${p.replace(/^\/?storage\//, "")}`) : null);

const durationText = (a, b) => {
  const s = toDate(a), e = toDate(b);
  if (!s || !e || e < s) return "";
  const days = Math.round((e - s) / 86400000) + 1;
  if (days < 60) return `${days} jour${days > 1 ? "s" : ""}`;
  const m = Math.round(days / 30.4);
  return m >= 12 && m % 12 === 0 ? `${m / 12} an${m > 12 ? "s" : ""}` : `${m} mois`;
};

/* ───────────────────────── Sous-composants ───────────────────────── */
function Label({ children, dot = "bg-[#16B8B1]" }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {children}
    </p>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
      <dt className="shrink-0 text-slate-400">{k}</dt>
      <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{v || "—"}</dd>
    </div>
  );
}

function Tile({ icon: Icon, label, value, hot }) {
  return (
    <div className={`rounded-xl px-3 py-3 ${hot ? "bg-amber-100 dark:bg-amber-500/15" : "bg-white dark:bg-white/5"}`}>
      <Icon size={14} className={hot ? "text-amber-600" : "text-slate-400"} />
      <p className={`mt-1.5 text-xl font-extrabold leading-none tabular-nums ${hot ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function PeriodBar({ start, end, freeFrom }) {
  const s = toDate(start), e = toDate(end);
  if (!s || !e || e <= s) return null;
  const pos = (d) => Math.max(0, Math.min(100, ((d - s) / (e - s)) * 100));
  const today = pos(new Date());
  const free = freeFrom ? pos(toDate(freeFrom)) : 0;
  return (
    <div>
      <div className="relative h-2 rounded-full bg-[#16B8B1]/20">
        {free > 0 && <div className="absolute inset-y-0 left-0 rounded-full bg-amber-300" style={{ width: `${free}%` }} />}
        {today > 0 && today < 100 && (
          <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3478E8] shadow dark:border-[#0B2235]" style={{ left: `${today}%` }} />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
        <span>{fmtDate(start)}</span>
        <span>{fmtDate(end)}</span>
      </div>
      {free > 0 && (
        <p className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" /> En mission</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#16B8B1]/50" /> Disponible</span>
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Modal ───────────────────────── */
export default function OfferDetailModal({ offerId, onClose, onEdit }) {
  const [offer, setOffer] = useState(null);
  const [avail, setAvail] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(false);
    Promise.all([
      api.get(`/resource-sharing/${offerId}`).then((r) => r.data),
      api.get(`/talent-market/${offerId}`).then((r) => r.data).catch(() => null),
      api.get(`/resource-sharing/${offerId}/proposals`).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ])
      .then(([o, a, p]) => { if (alive) { setOffer(o); setAvail(a); setProposals(p); } })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [offerId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resource-offers/${offerId}`);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  let content;
  let header = null;
  let footer = null;

  if (loading) {
    content = <div className="p-6"><Skeleton rows={3} /></div>;
  } else if (error || !offer) {
    content = <div className="p-10"><Empty title="Offre introuvable" text="Cette offre est indisponible ou vous n'y avez pas accès." /></div>;
  } else {
    const profile = offer.profile || {};
    const company = offer.company || {};
    const talent = profile.user || {};
    const ao = avail?.offer;
    const state = ao?.state;
    const key = offer.display_status || offer.status;
    const [statusLabel, statusCls] = OFFER_STATUS[key] || [key, OFFER_STATUS.draft[1]];
    const [visLabel, VisIcon] = VISIBILITY[offer.visibility || "public"] || VISIBILITY.public;
    const hasMission = String(key).startsWith("mission_");
    const isOwner = !!offer.is_owner;

    const avatarSrc = ao?.talent?.avatar_url || storage(profile.avatar_path);
    const portfolio = ao?.talent?.portfolio;
    const waiters = avail?.waiting_companies || [];
    const waitCount = ao?.waitlist_count || 0;
    const skills = ao?.skills?.length
      ? ao.skills
      : (offer.skills || []).map((s) => ({ ...s, level: (profile.skills || []).find((x) => x.id === s.id)?.pivot?.level }));

    const pending = proposals.filter((p) => ["sent", "viewed"].includes(p.display_status || p.status)).length;
    const dur = durationText(offer.start_at, offer.end_at);
    const days = workingDays(offer.start_at, offer.end_at);
    const potential = offer.daily_rate ? offer.daily_rate * days * workloadFactor(offer.workload_value, offer.workload_unit) : null;
    const left = daysUntil(offer.end_at);

    header = (
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B2235] via-[#0E2B42] to-[#163650] px-6 py-5 sm:px-8">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#16B8B1]/25 blur-3xl" />
        <div className="relative flex items-start gap-4">
          {/* 🔧 ICÔNE CHANGÉE ICI (FileText au lieu de Briefcase) */}
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#16B8B1]/15 text-[#5EE0DA] ring-1 ring-[#16B8B1]/30">
            <FileText size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusCls}`}>{statusLabel}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">{MISSION_TYPES[offer.mission_type] || offer.mission_type}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70"><VisIcon size={11} /> {visLabel}</span>
              {ao && <StateBadge state={state} availableFrom={ao.available_from} indefinite={ao.indefinite} compact />}
            </div>
            <h2 className="mt-2.5 break-words text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">{offer.title}</h2>
            <p className="mt-1.5 text-xs text-white/60">
              {fmtDate(offer.start_at)} au {fmtDate(offer.end_at)}
              {offer.location_city ? ` · ${offer.location_city}` : ""} · {LOCATIONS[offer.location_type] || "—"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:rotate-90 hover:bg-white/20 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </header>
    );

    content = (
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* ───── Bloc 1 : talent & mission ───── */}
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200/70 p-5 dark:border-white/10">
            <Label>Le talent</Label>
            <div className="flex items-center gap-4">
              <Avatar name={talent.name} src={avatarSrc} size={64} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{talent.name}</p>
                {profile.headline && profile.headline !== talent.name && (
                  <p className="truncate text-sm font-semibold text-[#0E8F8A] dark:text-[#5EE0DA]">{profile.headline}</p>
                )}
                <p className="mt-0.5 truncate text-xs text-slate-500">Salarié de {company.name}</p>
              </div>
              {portfolio?.slug && (
                <a href={`/portfolio/${portfolio.slug}`} target="_blank" rel="noreferrer"
                  className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-[#16B8B1]/10 px-3 py-2 text-xs font-bold text-[#0E8F8A] transition hover:bg-[#16B8B1]/20 dark:text-[#5EE0DA] sm:inline-flex">
                  Portfolio <ArrowUpRight size={13} />
                </a>
              )}
            </div>
            {profile.bio && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio}</p>}
          </section>

          <section className="rounded-2xl border border-slate-200/70 p-5 dark:border-white/10">
            <Label dot="bg-[#3478E8]">Description de la mission</Label>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{offer.description}</p>

            {skills.length > 0 ? (
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
                <p className="mb-2 text-xs font-bold text-slate-500">Compétences proposées</p>
                <SkillChips skills={skills} max={30} />
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Aucune compétence mise en avant. Ajoutez-en via « Personnaliser » pour recevoir plus de visites.
              </p>
            )}

            {offer.conditions && (
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
                <p className="mb-2 text-xs font-bold text-slate-500">Conditions particulières</p>
                <ul className="space-y-1.5">
                  {offer.conditions.split("\n").filter(Boolean).map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16B8B1]" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* ───── Bloc 2 : conditions & suivi ───── */}
        <aside className="min-w-0 space-y-5 rounded-2xl bg-slate-50 p-5 dark:bg-[#0B2235]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Label dot="bg-[#16B8B1]">Tarif journalier</Label>
              <p className="-mt-1 text-3xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
                {offer.daily_rate ? <>{offer.daily_rate} <span className="text-sm font-semibold text-slate-400">€ / jour</span></> : <span className="text-xl">À discuter</span>}
              </p>
            </div>
            {potential != null && (
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Budget maximal</p>
                <p className="text-lg font-extrabold tabular-nums text-[#0E8F8A] dark:text-[#5EE0DA]">≈ {money(potential)} €</p>
              </div>
            )}
          </div>

          <dl className="divide-y divide-slate-200/70 border-y border-slate-200/70 dark:divide-white/10 dark:border-white/10">
            <Row k="Période" v={`${fmtDate(offer.start_at)} au ${fmtDate(offer.end_at)}`} />
            <Row k="Durée" v={dur ? `${dur}${days ? ` · ${days} j ouvrés` : ""}` : null} />
            <Row k="Charge" v={workloadLabel(offer.workload_value, offer.workload_unit)} />
            <Row k="Lieu" v={`${LOCATIONS[offer.location_type] || "—"}${offer.location_city ? `, ${offer.location_city}` : ""}`} />
            <Row k="Type" v={MISSION_TYPES[offer.mission_type] || offer.mission_type} />
            {offer.published_at && <Row k="Publiée le" v={fmtDate(offer.published_at)} />}
          </dl>

          <div>
            <p className="mb-3 text-xs font-bold text-slate-500">Calendrier de disponibilité</p>
            <PeriodBar start={offer.start_at} end={offer.end_at} freeFrom={state && state !== "available" ? ao?.available_from : null} />
            {ao?.available_from && state !== "available" && (
              <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">Libre {relDays(ao.available_from)}, le {fmtDate(ao.available_from)}</p>
            )}
            {left != null && left >= 0 && <p className="mt-1.5 text-xs text-slate-500">Offre valable {relDays(offer.end_at)}</p>}
          </div>

          {isOwner && (
            <div>
              <p className="mb-3 text-xs font-bold text-slate-500">Suivi de l'offre</p>
              <div className="grid grid-cols-2 gap-2.5">
                <Tile icon={Eye} label="Vues" value={offer.views_count || 0} />
                <Tile icon={Inbox} label="Propositions" value={proposals.length} />
                <Tile icon={Inbox} label="À traiter" value={pending} hot={pending > 0} />
                <Tile icon={Users} label="En attente du talent" value={waitCount} />
              </div>
              {waiters.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500">Entreprises qui attendent ce talent</p>
                  {waiters.map((w, i) => <WaiterRow key={w.company_id || i} w={w} index={i} />)}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    );

    footer = (
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0F2A40] sm:px-6">
        <button onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#0E8F8A] dark:hover:bg-white/10">
          <Link2 size={14} /> {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:text-slate-300">
            Fermer
          </button>
       
          {isOwner && (
            <Link to={`/resource-offers/${offer.id}?tab=proposals`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-xs font-bold text-[#0B2235] transition hover:bg-[#2BD0C9]">
              Gérer les propositions{pending > 0 ? ` (${pending})` : ""}
            </Link>
          )}
        </div>
      </footer>
    );
  }

  return createPortal(
    <div className={`fixed inset-0 z-[9000] flex items-end justify-center bg-[#06141F]/60 backdrop-blur-sm sm:items-center sm:p-6 ${FONT}`} onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-[#0F2A40] sm:rounded-3xl">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
        {footer}
      </div>
    </div>,
    document.body
  );
}