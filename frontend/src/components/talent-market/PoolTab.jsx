
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Building2, MapPin, Globe, Users, ArrowUpRight,
  Search, SlidersHorizontal, UserRound, BriefcaseBusiness,
  CheckCircle2, Clock3, AlertCircle, Sparkles, CalendarDays,
  TrendingUp, X, ChevronRight, PackageCheck, Handshake,
} from "lucide-react";
import api from "../../services/api";
import PublishModal from "./PublishModal";
import OfferDetailModal from "./OfferDetailModal";
import CreateResourceOfferModal from "../publications/CreateResourceOfferModal";
import {
  Avatar, StateBadge, SkillChips, Empty, Skeleton, TempBadge,
  WaiterRow, ConfirmDialog, Tabs, Meter, fmtDate, apiError,
  daysUntil, toDate, relDays, btnPrimary, btnGhost, inputCls,
  cardCls, ModalFrame,
} from "./ui";

const CONTRACT = {
  permanent: "CDI",
  fixed_term: "CDD",
  internship: "Stage",
  apprenticeship: "Alternance",
};

const FILTERS = [
  { id: "all", label: "Tous", test: () => true },
  { id: "listed", label: "Sur le marché", test: (e) => e.listing === "published" },
  { id: "unlisted", label: "Non publiés", test: (e) => e.listing !== "published" },
  { id: "available", label: "Disponibles", test: (e) => e.state === "available" && e.lendable && !e.inactive },
  { id: "busy", label: "En mission", test: (e) => e.state !== "available" },
];

const LISTING = {
  published: {
    label: "Sur le marché",
    cls: "bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20",
  },
  draft: {
    label: "Brouillon",
    cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
  },
  expired: {
    label: "Offre expirée",
    cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
  },
  none: {
    label: "Non publié",
    cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10",
  },
};

const SORTS = {
  smart: "Priorité intelligente",
  name: "Nom",
  free: "Libres en premier",
};

const progress = (m) => {
  const s = toDate(m?.start_at);
  const en = toDate(m?.end_at);
  if (!s || !en || en <= s) return null;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - s) / (en - s)) * 100)));
};

const act = "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const actDark = `${act} bg-[#0B2235] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#173B53] hover:shadow-md dark:bg-[#16B8B1] dark:text-[#082B31] dark:hover:bg-[#35D0C8]`;
const actLine = `${act} border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300`;
const actSoft = `${act} bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20`;

const sectionTitle = "text-sm font-bold tracking-tight text-slate-800 dark:text-white";
const mutedText = "text-xs leading-5 text-slate-500 dark:text-slate-400";

/* ========================================================================== */
/*  PROFIL ENTREPRISE                                                         */
/* ========================================================================== */

function CompanyProfileModal({ id, onClose }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/companies/${id}`)
      .then((r) => setCompany(r.data))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ModalFrame icon={Building2} title="Chargement..." onClose={onClose}>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-teal-500" size={26} />
        </div>
      </ModalFrame>
    );
  }

  if (!company) {
    return (
      <ModalFrame icon={Building2} title="Erreur" onClose={onClose}>
        <div className="p-10 text-center text-sm text-slate-500">
          Entreprise introuvable.
        </div>
      </ModalFrame>
    );
  }

  const logo = company.logo_url || company.logo_path;
  const location = [company.city, company.country].filter(Boolean).join(", ");

  return (
    <ModalFrame
      icon={Building2}
      title={company.name}
      subtitle={company.industry || "Entreprise"}
      size="max-w-xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className={actLine}>Fermer</button>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Avatar name={company.name} src={logo} size={68} square />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {company.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {company.description ? "Présentation de l'entreprise" : "Aucune description disponible"}
            </p>
          </div>
        </div>

        {company.description && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              À propos
            </p>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
              {company.description}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {location && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
                <MapPin size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Localisation</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{location}</p>
              </div>
            </div>
          )}

          {company.website && (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-teal-200 hover:bg-teal-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-teal-500/30 dark:hover:bg-teal-500/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
                <Globe size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Site web</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-teal-700 dark:text-teal-300">{company.website}</p>
              </div>
              <ArrowUpRight size={14} className="ml-auto shrink-0 text-slate-400" />
            </a>
          )}

          {company.size && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
                <Users size={17} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taille</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{company.size} employés</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}

/* ========================================================================== */
/*  COMPOSANT PRINCIPAL                                                       */
/* ========================================================================== */

export default function PoolTab({ companies, show, celebrate }) {
  const [companyId, setCompanyId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("smart");
  const [selected, setSelected] = useState(new Set());
  const [publishing, setPublishing] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [open, setOpen] = useState(null);
  const [waiters, setWaiters] = useState({});
  const [companyProfileId, setCompanyProfileId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/talent-market/pool", {
      params: companyId ? { company_id: companyId } : {},
    })
      .then((r) => setData(r.data))
      .catch((e) => {
        setData({ has_company: true, employees: [], summary: {} });
        show(apiError(e), "error");
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
    setSelected(new Set());
    setWaiters({});
    setOpen(null);
  }, [load]);

  const employees = data?.employees || [];

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, employees.filter(f.test).length])),
    [employees]
  );

  const insights = useMemo(() => {
    const ready = employees.filter(
      (e) => e.publishable && e.listing !== "published" && e.state === "available"
    );

    const soon = employees.filter((e) => {
      if (e.state === "available" || !e.available_from) return false;
      const n = daysUntil(e.available_from);
      return n !== null && n >= 0 && n <= 30;
    });

    const pending = employees.reduce((a, e) => a + (e.pending_proposals || 0), 0);
    const waiting = employees.reduce((a, e) => a + (e.waitlist_count || 0), 0);
    const noSkills = employees.filter((e) => e.publishable && !(e.skills || []).length);

    return { ready, soon, pending, waiting, noSkills };
  }, [employees]);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const s = q.trim().toLowerCase();

    const list = employees.filter((e) =>
      f.test(e) &&
      (!s || `${e.name} ${e.position || ""} ${e.email || ""} ${(e.skills || [])
        .map((k) => (typeof k === "string" ? k : k.name)).join(" ")}`
        .toLowerCase().includes(s))
    );

    const score = (e) =>
      (e.pending_proposals ? 100 : 0) +
      (e.waitlist_count ? 50 : 0) +
      (e.state === "available" && e.listing !== "published" && e.publishable ? 30 : 0) +
      (e.listing === "published" ? 10 : 0);

    return [...list].sort((a, b) => {
      if (sort === "name") return (a.name || "").localeCompare(b.name || "", "fr");
      if (sort === "free") return (a.state === "available" ? 0 : 1) - (b.state === "available" ? 0 : 1);
      return score(b) - score(a);
    });
  }, [employees, q, filter, sort]);

  const selectable = rows.filter((e) => e.publishable);
  const selectedEmployees = employees.filter((e) => selected.has(e.employee_id));
  const allChecked = selectable.length > 0 && selectable.every((e) => selected.has(e.employee_id));

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => setSelected(
    allChecked ? new Set() : new Set(selectable.map((e) => e.employee_id))
  );

  const unpublishIds = selectedEmployees
    .filter((e) => e.offer && e.listing !== "none")
    .map((e) => e.offer.id);

  const askUnpublish = () => {
    if (!unpublishIds.length) {
      return show("Aucun des talents sélectionnés n'est sur le marché.", "error");
    }
    setConfirm(true);
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      await api.post("/talent-market/unpublish", { offer_ids: unpublishIds });
      setConfirm(false);
      setSelected(new Set());
      load();
      celebrate(
        "Talents retirés du marché",
        `${unpublishIds.length} talent(s) ne sont plus visibles. Les entreprises en attente ont été prévenues.`
      );
    } catch (e) {
      setConfirm(false);
      show(apiError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const onPublished = (res, status) => {
    setPublishing(null);
    setSelected(new Set());
    load();

    if (res.skipped?.length) {
      celebrate(
        "Certains talents n'ont pas été publiés",
        `${res.created + res.updated} talent(s) traité(s), ${res.skipped.length} ignoré(s) :`,
        {
          tone: "warning",
          details: res.skipped.map((s) => `${s.name} : ${s.reason}`),
        }
      );
    }
  };

  const toggleWaiters = async (e) => {
    if (open === e.employee_id) return setOpen(null);

    setOpen(e.employee_id);

    if (waiters[e.employee_id] && waiters[e.employee_id] !== "loading") return;
    if (e.waiting_companies) {
      return setWaiters((w) => ({ ...w, [e.employee_id]: e.waiting_companies }));
    }
    if (!e.offer) return;

    setWaiters((w) => ({ ...w, [e.employee_id]: "loading" }));

    try {
      const r = await api.get(`/talent-market/${e.offer.id}`);
      setWaiters((w) => ({
        ...w,
        [e.employee_id]: r.data.waiting_companies || r.data.offer?.waiting_companies || [],
      }));
    } catch {
      setWaiters((w) => ({ ...w, [e.employee_id]: [] }));
    }
  };

  if (loading && !data) return <Skeleton />;

  if (data && !data.has_company) {
    return (
      <Empty
        title="Créez d'abord votre entreprise"
        text="Pour mettre vos salariés sur le marché, votre entreprise doit exister sur la plateforme."
      >
        <Link to="/company" className={btnPrimary}>Créer mon entreprise</Link>
      </Empty>
    );
  }

  const s = data?.summary || {};
  const company = data?.company;
  const borrowed = data?.borrowed || [];
  const publishableTotal = employees.filter((e) => e.publishable).length;
  const valuation = publishableTotal
    ? Math.round(((s.listed || 0) / publishableTotal) * 100)
    : 0;

  const stats = [
    {
      label: "Salariés",
      value: s.total,
      icon: Users,
      accent: "slate",
      description: "Effectif de l'entreprise",
    },
    {
      label: "Sur le marché",
      value: s.listed,
      icon: TrendingUp,
      accent: "teal",
      meter: valuation,
      hint: `${valuation}% des CDI valorisés`,
    },
    {
      label: "Disponibles à prêter",
      value: s.available,
      icon: CheckCircle2,
      accent: "green",
      description: "Prêts pour une mission",
    },
    {
      label: "Prêtés en ce moment",
      value: s.lent,
      icon: Handshake,
      accent: "blue",
      description: "En mission externe",
    },
  ];

  const insightCards = [
    insights.ready.length > 0 && {
      key: "ready",
      tone: "teal",
     
      value: insights.ready.length,
      title: insights.ready.length > 1 ? "talents prêts à être publiés" : "talent prêt à être publié",
      text: "Libres et sans offre active. L'annonce, la durée et le tarif sont préremplis avec vos réglages habituels.",
      action: (
        <button
          className={actDark}
          onClick={() => setPublishing({ list: insights.ready, startStep: 2 })}
        >
         Publication express
        </button>
      ),
    },
    insights.soon.length > 0 && {
      key: "soon",
      tone: "amber",
      icon: CalendarDays,
      value: insights.soon.length,
      title: insights.soon.length > 1 ? "se libèrent d'ici 30 jours" : "se libère d'ici 30 jours",
      text: "Publiez à l'avance pour que les entreprises les réservent avant la fin de leur mission.",
      action: (
        <button className={actLine} onClick={() => setFilter("busy")}>
          Voir les talents <ChevronRight size={13} />
        </button>
      ),
    },
    insights.pending > 0 && {
      key: "pending",
      tone: "rose",
      icon: AlertCircle,
      value: insights.pending,
      title: insights.pending > 1 ? "propositions à traiter" : "proposition à traiter",
      text: "Des entreprises attendent votre réponse. Répondre vite améliore votre réputation sur le marché.",
      action: (() => {
        const target = employees.find((e) => e.pending_proposals > 0 && e.offer);
        return target ? (
          <Link
            to={`/resource-offers/${target.offer.id}?tab=proposals`}
            className={`${actLine} inline-flex`}
          >
            Ouvrir <ArrowUpRight size={13} />
          </Link>
        ) : null;
      })(),
    },
    insights.waiting > 0 && {
      key: "waiting",
      tone: "blue",
      icon: Users,
      value: insights.waiting,
      title: insights.waiting > 1 ? "entreprises en attente" : "entreprise en attente",
      text: "Elles seront prévenues automatiquement dès qu'un de vos talents se libère.",
      action: null,
    },
    insights.noSkills.length > 0 && {
      key: "skills",
      tone: "slate",
      icon: AlertCircle,
      value: insights.noSkills.length,
      title: insights.noSkills.length > 1 ? "talents sans compétences" : "talent sans compétences",
      text: "Les profils avec compétences reçoivent davantage de visites. Elles se renseignent à l'étape 2 de la publication.",
      action: null,
    },
  ].filter(Boolean);

  const toneCls = {
    teal: {
      icon: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
      number: "text-teal-700 dark:text-teal-300",
      border: "hover:border-teal-200 dark:hover:border-teal-500/30",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      number: "text-amber-700 dark:text-amber-300",
      border: "hover:border-amber-200 dark:hover:border-amber-500/30",
    },
    rose: {
      icon: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
      number: "text-rose-700 dark:text-rose-300",
      border: "hover:border-rose-200 dark:hover:border-rose-500/30",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      number: "text-blue-700 dark:text-blue-300",
      border: "hover:border-blue-200 dark:hover:border-blue-500/30",
    },
    slate: {
      icon: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
      number: "text-slate-700 dark:text-slate-200",
      border: "hover:border-slate-300 dark:hover:border-white/20",
    },
  };

  const statAccent = {
    slate: {
      icon: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
      line: "bg-slate-400",
    },
    teal: {
      icon: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
      line: "bg-[#16B8B1]",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      line: "bg-emerald-400",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      line: "bg-blue-500",
    },
  };

  return (
    <div className="space-y-6 pb-4">

      {/* Sélecteur d'entreprise */}
      {companies.length > 1 && (
        <div className="flex justify-end">
          <label className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:w-auto dark:border-white/10 dark:bg-[#102A3C]">
            <Building2 size={15} className="shrink-0 text-teal-600 dark:text-teal-300" />
            <select
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none sm:w-52 dark:text-slate-200"
              value={companyId || company?.id || ""}
              onChange={(e) => setCompanyId(Number(e.target.value))}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Indicateurs */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((st) => {
          const Icon = st.icon;
          const accent = statAccent[st.accent];

          return (
            <article
              key={st.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5 dark:border-white/[0.08] dark:bg-[#102A3C] dark:hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.icon}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <span className={`h-1.5 w-8 rounded-full ${accent.line}`} />
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                {st.label}
              </p>
              <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-[#0B2235] tabular-nums dark:text-white">
                {st.value ?? "–"}
              </p>

              {st.meter != null ? (
                <div className="mt-3">
                  <Meter value={st.meter} />
                  <p className="mt-1.5 text-[10px] font-medium text-slate-400">{st.hint}</p>
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  {st.description}
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* À faire maintenant */}
      {insightCards.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={sectionTitle}>À faire maintenant</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Les actions qui méritent votre attention
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {insightCards.length} signal{insightCards.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {insightCards.map((c) => {
              const Icon = c.icon;
              const tone = toneCls[c.tone];

              return (
                <article
                  key={c.key}
                  className={`group flex gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.08] dark:bg-[#102A3C] ${tone.border}`}
                >
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                      <Icon size={17} />
                    </span>
                    <span className={`text-xl font-extrabold tabular-nums ${tone.number}`}>
                      {c.value}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold leading-5 text-slate-900 dark:text-white">
                      {c.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-[1.65] text-slate-500 dark:text-slate-400">
                      {c.text}
                    </p>
                    {c.action && <div className="mt-3">{c.action}</div>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Barre de recherche et filtres */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-4 dark:border-white/[0.08] dark:bg-[#102A3C]">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-teal-600 dark:text-teal-300" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Gérer les talents
          </h3>
          <span className="ml-auto text-[10px] font-medium text-slate-400">
            {rows.length} résultat{rows.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={FILTERS.map((f) => ({
                id: f.id,
                label: f.label,
                count: counts[f.id],
              }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
            <div className="relative min-w-0 sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un talent..."
                className={`${inputCls} w-full pl-10`}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                  aria-label="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              className={`${inputCls} sm:w-52`}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {Object.entries(SORTS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Liste des salariés */}
      {rows.length === 0 ? (
        <Empty
          title={employees.length ? "Aucun résultat" : "Aucun salarié dans votre entreprise"}
          text={employees.length
            ? "Aucun talent ne correspond à votre recherche. Essayez de modifier vos filtres."
            : "Ajoutez vos salariés depuis « Mon entreprise » pour pouvoir les proposer."}
        >
          {!employees.length && (
            <Link to="/company" className={btnGhost}>Mon entreprise</Link>
          )}
        </Empty>
      ) : (
        <div className="space-y-3">

          {/* Sélection globale */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-4 w-4 rounded accent-[#16B8B1]"
              />
              Tout sélectionner
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {selectable.length}
              </span>
            </label>

            <span className="text-[10px] text-slate-400">
              {selectable.length} talent{selectable.length > 1 ? "s" : ""} publiable{selectable.length > 1 ? "s" : ""}
            </span>
          </div>

          {rows.map((e) => {
            const lst = LISTING[e.listing] || LISTING.none;
            const checked = selected.has(e.employee_id);
            const noSkills = e.publishable && !(e.skills || []).length;

            return (
              <div key={e.employee_id}>
                <article
                  className={`group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-200 sm:p-5 dark:bg-[#102A3C] ${
                    checked
                      ? "border-teal-300 shadow-[0_0_0_3px_rgba(22,184,177,0.10)] dark:border-teal-500/50"
                      : "border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.055)] dark:border-white/[0.08] dark:hover:border-white/15"
                  } ${e.inactive ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Identité */}
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <input
                        type="checkbox"
                        disabled={!e.publishable}
                        checked={checked}
                        onChange={() => toggle(e.employee_id)}
                        title={e.publishable
                          ? ""
                          : e.inactive
                            ? "Salarié inactif"
                            : "Seuls les salariés en CDI peuvent être mis sur le marché"}
                        className="mt-4 h-4 w-4 shrink-0 rounded accent-[#16B8B1] disabled:cursor-not-allowed"
                      />

                      <div className="relative shrink-0">
                        <Avatar name={e.name} src={e.photo_url} size={48} />
                        {e.state === "available" && e.has_account && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#102A3C]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {e.name}
                          </p>

                          {e.contract_type && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-slate-400">
                              {CONTRACT[e.contract_type] || e.contract_type}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {e.position || "Poste non défini"}
                        </p>

                        <div className="mt-2">
                          {noSkills ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              <AlertCircle size={11} />
                              Aucune compétence renseignée
                            </span>
                          ) : (
                            <SkillChips skills={e.skills} max={3} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statuts et actions */}
                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${lst.cls}`}>
                          {lst.label}
                        </span>

                        {e.has_account ? (
                          e.state === "reserved" && e.reserved_by ? (
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (e.reserved_by_id) setCompanyProfileId(e.reserved_by_id);
                              }}
                              className="inline-flex max-w-[210px] items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                              title={`Voir le profil de ${e.reserved_by}`}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              <span className="truncate">Réservé par {e.reserved_by}</span>
                              <ArrowUpRight size={11} className="shrink-0" />
                            </button>
                          ) : (
                            <StateBadge
                              state={e.state}
                              availableFrom={e.available_from}
                              indefinite={e.indefinite}
                              compact
                            />
                          )
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            Sans compte
                          </span>
                        )}

                        {e.waitlist_count > 0 && (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              toggleWaiters(e);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                          >
                            <Users size={11} />
                            {e.waitlist_count} en attente
                          </button>
                        )}

                        {e.pending_proposals > 0 && e.offer && (
                          <Link
                            to={`/resource-offers/${e.offer.id}?tab=proposals`}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                          >
                            <AlertCircle size={11} />
                            {e.pending_proposals} proposition{e.pending_proposals > 1 ? "s" : ""} à traiter
                          </Link>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {e.offer && (
                          <button
                            onClick={() => setViewer(e.offer.id)}
                            className={actDark}
                          >
                            Voir l'offre
                          </button>
                        )}
                        {e.offer && (
                          <button
                            onClick={() => setEditor({ offerId: e.offer.id })}
                            className={actLine}
                          >
                            Personnaliser
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>

                {/* Entreprises en attente */}
                {open === e.employee_id && (
                  <div className="mx-3 -mt-1 rounded-b-2xl border border-t-0 border-violet-200/70 bg-violet-50/40 p-4 dark:border-violet-500/20 dark:bg-violet-500/[0.04]">
                    <div className="mb-3 flex items-center gap-2">
                      <Users size={14} className="text-violet-600 dark:text-violet-300" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Entreprises qui attendent {e.name}
                      </p>
                    </div>

                    {waiters[e.employee_id] === "loading" || waiters[e.employee_id] === undefined ? (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 size={13} className="animate-spin" /> Chargement…
                      </p>
                    ) : waiters[e.employee_id].length ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        {waiters[e.employee_id].map((w, i) => (
                          <WaiterRow key={w.company_id || i} w={w} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Aucun détail disponible.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Talents empruntés */}
      {borrowed.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Handshake size={17} />
            </div>
            <div>
              <h3 className={sectionTitle}>Talents que vous empruntez</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Des collaborateurs accueillis temporairement dans votre entreprise
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {borrowed.map((b) => {
              const p = progress(b);

              return (
                <article
                  key={b.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:border-white/[0.08] dark:bg-[#102A3C] dark:hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar name={b.talent?.name} src={b.talent?.avatar_url} size={46} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {b.talent?.name}
                        </p>
                        <TempBadge />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {b.talent?.headline || b.title}
                      </p>
                    </div>
                  </div>

                  {p != null && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">Progression de la mission</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300">{p}%</span>
                      </div>
                      <Meter value={p} tone="violet" />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-white/[0.07]">
                    <span>{b.lender ? `Venant de ${b.lender}` : "Talent partagé"}</span>
                    {b.end_at && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock3 size={11} />
                        Retour {relDays(b.end_at) || fmtDate(b.end_at)}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Barre d'actions groupées */}
      {selected.size > 0 && (
        <div className="sticky bottom-5 z-20 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 shadow-[0_16px_50px_-15px_rgba(11,34,53,0.25)] backdrop-blur-xl sm:gap-3 sm:px-4 dark:border-white/10 dark:bg-[#102A3C]/95">
          <span className="flex items-center gap-2 px-1 text-xs font-bold text-slate-800 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-[10px] text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {selected.size}
            </span>
            sélectionné{selected.size > 1 ? "s" : ""}
          </span>

          <span className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-white/10" />

          <button
            onClick={() => setSelected(new Set())}
            className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Annuler
          </button>

          <button
            disabled={busy}
            onClick={askUnpublish}
            className={`${actLine} !py-2`}
          >
            Retirer du marché
          </button>

          <button
            onClick={() => setPublishing({ list: selectedEmployees, startStep: 0 })}
            className={`${btnPrimary} !rounded-xl`}
          >
            <PackageCheck size={14} />
            Mettre sur le marché
          </button>
        </div>
      )}

      {/* Modale de publication */}
      {publishing && company && (
        <PublishModal
          company={company}
          employees={publishing.list}
          startStep={publishing.startStep}
          onClose={() => setPublishing(null)}
          onDone={onPublished}
        />
      )}

      {/* Détail de l'offre */}
      {viewer && (
        <OfferDetailModal
          offerId={viewer}
          onClose={() => setViewer(null)}
          onEdit={() => {
            setEditor({ offerId: viewer });
            setViewer(null);
          }}
        />
      )}

      {/* Modification de l'offre */}
      {editor && (
        <CreateResourceOfferModal
          offerId={editor.offerId}
          onClose={() => setEditor(null)}
          onSuccess={() => {
            setEditor(null);
            load();
            celebrate(
              "Offre enregistrée",
              "Vos modifications sont en ligne sur le marché des talents."
            );
          }}
        />
      )}

      {/* Confirmation de retrait */}
      {confirm && (
        <ConfirmDialog
          danger
          busy={busy}
          title="Retirer du marché ?"
          text={`${unpublishIds.length} talent(s) seront retirés. Les entreprises en attente seront prévenues.`}
          confirmLabel="Retirer"
          onConfirm={unpublish}
          onCancel={() => setConfirm(false)}
        />
      )}

      {/* Profil de l'entreprise réservataire */}
      {companyProfileId && (
        <CompanyProfileModal
          id={companyProfileId}
          onClose={() => setCompanyProfileId(null)}
        />
      )}
    </div>
  );
}
