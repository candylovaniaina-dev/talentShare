import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Loader2, Scale, X, FolderOpen, ArrowUpRight, CheckCircle2,
  Search, SlidersHorizontal, RefreshCw, Users, MapPin,
  CalendarDays, BriefcaseBusiness, ArrowUpDown, Heart,
  ChevronRight, Sparkles, Clock3, Building2, Euro,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import PoolTab from "../components/talent-market/PoolTab";
import api from "../services/api";
import {
  FONT, Avatar, StateBadge, SkillChips, Empty, Skeleton, SuccessScreen,
  WaiterRow, ModalFrame, Tabs, MISSION_TYPES, MISSION_FILTERS, LOCATIONS,
  fmtDate, workloadLabel, apiError, workingDays, workloadFactor,
  daysUntil, relDays, usePersisted, btnPrimary, btnGhost, inputCls, cardCls,
} from "../components/talent-market/ui";

/* ========================================================================== */
/*  DESIGN SYSTEM                                                             */
/* ========================================================================== */

const C = {
  navy: "#102B3F",
  teal: "#16B8B1",
  tealDark: "#0E918C",
};

const panel =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,35,55,0.035)] dark:border-white/10 dark:bg-[#101D35]";

const mutedText = "text-slate-500 dark:text-slate-400";
const headingText = "text-slate-900 dark:text-white";

const formatPrice = (amount, currency) => {
  if (amount == null) return null;
  const safeCurrency = currency || (amount > 1000 ? "MGA" : "EUR");
  return safeCurrency === "MGA"
    ? `${new Intl.NumberFormat("fr-FR").format(amount)} Ar`
    : `${new Intl.NumberFormat("fr-FR").format(amount)} €`;
};

const TABS = [
  { id: "market", label: "Marché des talents" },
  { id: "pool", label: "Mon vivier" },
  { id: "waiting", label: "Mes attentes" },
];

const INIT = {
  state: "",
  mission_type: "",
  location_type: "",
  city: "",
  available_by: "",
  sort: "availability",
};

const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/* ========================================================================== */
/*  PETITS COMPOSANTS                                                          */
/* ========================================================================== */

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
          <Icon size={14} />
        </span>
      )}
      <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-slate-700 dark:text-slate-200">
        {children}
      </p>
    </div>
  );
}

function Group({ title, children, icon: Icon }) {
  return (
    <div className="border-b border-slate-100 px-5 py-5 last:border-0 dark:border-white/[0.07]">
      <SectionTitle icon={Icon}>{title}</SectionTitle>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all duration-200 ${
        active
          ? "border-teal-300 bg-teal-50 text-teal-800 shadow-sm dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-white/10 dark:text-teal-300">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
        <p className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  FILTRES                                                                    */
/* ========================================================================== */

function FiltersPanel({
  f, set, reset, counts, activeCount, rateCap, rateMax,
  setRateMax, saved, onSave, onApply, onRemoveSaved,
}) {
  const availability = [
    ["", "Tous les talents", counts?.all, "bg-slate-300"],
    ["available", "Disponibles", counts?.available, "bg-emerald-400"],
    ["busy", "En mission", counts?.busy, "bg-amber-400"],
  ];

  return (
    <aside className={`${panel} h-fit overflow-hidden lg:sticky lg:top-[88px]`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102B3F] text-white">
            <SlidersHorizontal size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Filtres
            </p>
            <p className="text-[10px] text-slate-400">Affinez votre recherche</p>
          </div>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="text-[11px] font-bold text-teal-700 transition hover:text-teal-900 hover:underline dark:text-teal-300"
          >
            Effacer
          </button>
        )}
      </div>

      <Group title="Disponibilité" icon={Clock3}>
        <div className="space-y-1">
          {availability.map(([k, label, n, dot]) => {
            const active = f.state === k;
            return (
              <button
                key={k || "all"}
                onClick={() => set("state", k)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-semibold transition ${
                  active
                    ? "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {label}
                <span className="ml-auto rounded-lg bg-white px-2 py-1 text-[10px] font-bold tabular-nums text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
                  {n ?? "–"}
                </span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Mode de travail" icon={MapPin}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LOCATIONS).map(([k, label]) => (
            <Chip
              key={k}
              active={f.location_type === k}
              onClick={() => set("location_type", f.location_type === k ? "" : k)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Type de mission" icon={BriefcaseBusiness}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MISSION_FILTERS).map(([k, label]) => (
            <Chip
              key={k}
              active={f.mission_type === k}
              onClick={() => set("mission_type", f.mission_type === k ? "" : k)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Group>

      {rateCap > 0 && (
        <Group title="Tarif maximum" icon={Euro}>
          <input
            type="range"
            min="0"
            max={rateCap}
            step="5"
            value={rateMax ?? rateCap}
            onChange={(e) =>
              setRateMax(Number(e.target.value) >= rateCap ? null : Number(e.target.value))
            }
            className="w-full cursor-pointer accent-teal-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {rateMax == null ? "Sans limite" : `Jusqu'à ${rateMax} € / jour`}
            </span>
            <span className="text-[10px] text-slate-400">{rateCap} €</span>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">
            Les talents avec un tarif à discuter restent visibles.
          </p>
        </Group>
      )}

      <Group title="Localisation" icon={MapPin}>
        <input
          className={inputCls}
          value={f.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="Ex. Antananarivo"
        />
      </Group>

      <Group title="Disponible au plus tard le" icon={CalendarDays}>
        <input
          type="date"
          className={inputCls}
          value={f.available_by}
          onChange={(e) => set("available_by", e.target.value)}
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[["7 jours", 7], ["1 mois", 30], ["3 mois", 90]].map(([l, n]) => (
            <Chip
              key={l}
              active={f.available_by === inDays(n)}
              onClick={() => set("available_by", inDays(n))}
            >
              {l}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          Inclut les talents dont la mission aura pris fin.
        </p>
      </Group>

      <Group title="Recherches enregistrées" icon={Heart}>
        {saved.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {saved.map((sv) => (
              <span
                key={sv.id}
                className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                <button
                  onClick={() => onApply(sv)}
                  className="py-2 pl-3 pr-2 transition hover:text-teal-700"
                >
                  {sv.name}
                </button>
                <button
                  onClick={() => onRemoveSaved(sv.id)}
                  aria-label="Supprimer"
                  className="py-2 pl-1 pr-2.5 text-slate-400 transition hover:text-rose-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <button onClick={onSave} className={`${btnGhost} w-full justify-center`}>
          <span className="mr-1">+</span> Enregistrer cette recherche
        </button>
      </Group>
    </aside>
  );
}

/* ========================================================================== */
/*  CARTE TALENT                                                               */
/* ========================================================================== */

function TalentCard({
  o, onOpen, followed, onFollow, compared, onCompare,
  compareLocked, currentCompanyId,
}) {
  const free = o.state === "available";
  const accent = free
    ? "bg-emerald-400"
    : o.state === "reserved"
      ? "bg-sky-400"
      : "bg-amber-400";

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  const soon =
    !free &&
    o.available_from &&
    daysUntil(o.available_from) !== null &&
    daysUntil(o.available_from) <= 30;

  // Comportement temporaire conservé depuis ta version.
  const alreadyProposed = true;

  return (
    <article
      onClick={() => onOpen(o.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(o.id);
      }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[0_16px_36px_-18px_rgba(14,145,140,0.30)] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 dark:bg-[#101D35] ${
        compared
          ? "border-teal-300 ring-4 ring-teal-500/10 dark:border-teal-400/50"
          : "border-slate-200/80 dark:border-white/10"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />

      {alreadyProposed && (
        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200">
          <CheckCircle2 size={12} />
          Déjà proposé
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5 pl-6">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <Avatar name={o.talent.name} src={o.talent.avatar_url} size={54} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#101D35] ${
                free ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              {o.talent.name}
            </h3>
            {o.talent.headline && (
              <p className="mt-1 truncate text-[12px] font-semibold text-teal-700 dark:text-teal-300">
                {o.talent.headline}
              </p>
            )}
            <p className="mt-1 truncate text-[11px] text-slate-400">
              {o.company.name}
              {o.company.is_verified ? " · Vérifiée" : ""}
              {o.location_city ? ` · ${o.location_city}` : ""}
            </p>
          </div>

          <div className={`shrink-0 text-right ${alreadyProposed ? "pt-7" : ""}`}>
            {o.daily_rate ? (
              <>
                <p className="text-[17px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
                  {formatPrice(o.daily_rate, o.currency)}
                </p>
                <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                  par jour
                </p>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400">
                Tarif à discuter
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StateBadge state={o.state} availableFrom={o.available_from} indefinite={o.indefinite} />
          {soon && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Libre {relDays(o.available_from)}
            </span>
          )}
        </div>

        <div>
          <p className="line-clamp-1 text-[13px] font-bold text-slate-800 dark:text-slate-100">
            {o.title}
          </p>
          <div className="mt-2.5">
            <SkillChips skills={o.skills} max={4} />
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-slate-100 pt-3.5 dark:border-white/[0.07]">
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>{MISSION_TYPES[o.mission_type]}</span>
            <span className="text-slate-300">·</span>
            <span>{LOCATIONS[o.location_type]}</span>
            <span className="text-slate-300">·</span>
            <span>{workloadLabel(o.workload_value, o.workload_unit)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={stop(onFollow)}
                className={`rounded-lg px-2.5 py-2 text-[11px] font-bold transition ${
                  followed
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                {followed ? "♥ Suivi" : "♡ Suivre"}
              </button>
              <button
                onClick={stop(onCompare)}
                disabled={!compared && compareLocked}
                className={`rounded-lg px-2.5 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  compared
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                {compared ? "✓ Comparé" : "Comparer"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {o.waitlist_count > 0 && (
                <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  {o.waitlist_count} en attente
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-700 transition group-hover:gap-2 dark:text-teal-300">
                {free ? "Emprunter" : "Attendre"}
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================================================== */
/*  COMPARATEUR                                                                */
/* ========================================================================== */

function CompareModal({ list, onClose, onOpen, onRemove }) {
  const rows = [
    ["Entreprise", (o) => o.company.name],
    ["Poste", (o) => o.talent.headline || o.title],
    ["Tarif", (o) => (o.daily_rate ? `${formatPrice(o.daily_rate, o.currency)} / jour` : "À discuter")],
    ["Disponibilité", (o) =>
      o.state === "available"
        ? "Disponible"
        : o.available_from
          ? `Libre le ${fmtDate(o.available_from)}`
          : o.indefinite
            ? "Durée indéterminée"
            : "En mission"],
    ["Période", (o) => `${fmtDate(o.start_at)} au ${fmtDate(o.end_at)}`],
    ["Charge", (o) => workloadLabel(o.workload_value, o.workload_unit)],
    ["Type", (o) => MISSION_TYPES[o.mission_type] || "—"],
    ["Lieu", (o) => `${LOCATIONS[o.location_type] || "—"}${o.location_city ? `, ${o.location_city}` : ""}`],
  ];

  const cheapest = Math.min(
    ...list.filter((o) => o.daily_rate).map((o) => o.daily_rate),
    Infinity
  );

  return (
    <ModalFrame
      icon={Scale}
      title="Comparer les talents"
      subtitle={`${list.length} talent${list.length > 1 ? "s" : ""} sélectionné${list.length > 1 ? "s" : ""}`}
      size="max-w-5xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className={btnGhost}>Fermer</button>
        </div>
      }
    >
      <div className="overflow-x-auto px-5 py-6 sm:px-8">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-36" />
              {list.map((o) => (
                <th key={o.id} className="px-3 pb-5 text-left align-top">
                  <div className="flex items-start gap-3">
                    <Avatar name={o.talent.name} src={o.talent.avatar_url} size={44} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                        {o.talent.name}
                      </p>
                      <button
                        onClick={() => onOpen(o.id)}
                        className="mt-1 text-[11px] font-bold text-teal-700 hover:underline dark:text-teal-300"
                      >
                        Voir le détail
                      </button>
                      <button
                        onClick={() => onRemove(o.id)}
                        className="ml-3 text-[11px] text-slate-400 hover:text-rose-500"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <td className="border-t border-slate-100 py-3 pr-3 text-[11px] font-bold text-slate-400 dark:border-white/10">
                  {label}
                </td>
                {list.map((o) => {
                  const best =
                    label === "Tarif" &&
                    o.daily_rate &&
                    o.daily_rate === cheapest &&
                    list.length > 1;

                  return (
                    <td
                      key={o.id}
                      className="border-t border-slate-100 px-3 py-3 text-[12px] font-medium text-slate-700 dark:border-white/10 dark:text-slate-200"
                    >
                      {fn(o)}
                      {best && (
                        <span className="ml-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          Le moins cher
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="border-t border-slate-100 py-3 pr-3 align-top text-[11px] font-bold text-slate-400 dark:border-white/10">
                Compétences
              </td>
              {list.map((o) => (
                <td key={o.id} className="border-t border-slate-100 px-3 py-3 dark:border-white/10">
                  <SkillChips skills={o.skills} max={6} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </ModalFrame>
  );
}

/* ========================================================================== */
/*  MARCHÉ                                                                     */
/* ========================================================================== */

function MarketTab({ onOpen, refreshKey }) {
  const [f, setF] = useState(INIT);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [followed, setFollowed] = usePersisted("talentshare_followed_talents", []);
  const [saved, setSaved] = usePersisted("talentshare_saved_market_searches", []);
  const [onlyFollowed, setOnlyFollowed] = useState(false);
  const [rateMax, setRateMax] = useState(null);
  const [compare, setCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));
  const reset = () => {
    setF(INIT);
    setSearch("");
    setRateMax(null);
  };

  const activeCount =
    ["state", "mission_type", "location_type", "city", "available_by"].filter((k) => f[k]).length +
    (rateMax != null ? 1 : 0);

  const load = useCallback(async (p, silent = false) => {
    if (!silent) setLoading(true);

    try {
      const params = { page: p, per_page: 24 };
      if (q) params.search = q;
      Object.entries(f).forEach(([k, v]) => v && (params[k] = v));

      const r = await api.get("/talent-market", { params });

      setItems((prev) => (p === 1 ? r.data.data : [...prev, ...r.data.data]));
      setMeta(r.data.meta);
      setUpdatedAt(Date.now());
    } catch {
      if (p === 1 && !silent) {
        setItems([]);
        setMeta(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [q, f]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load, refreshKey]);

  useEffect(() => {
    const t = setInterval(() => {
      if (page === 1 && !document.hidden) load(1, true);
    }, 60000);

    return () => clearInterval(t);
  }, [load, page]);

  useEffect(() => {
    const k = (e) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        document.getElementById("market-search")?.focus();
      }
    };

    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const rateCap = useMemo(() => {
    const m = Math.max(0, ...items.map((o) => o.daily_rate || 0));
    return m ? Math.ceil(m / 10) * 10 : 0;
  }, [items]);

  const visible = useMemo(
    () =>
      items.filter(
        (o) =>
          (!onlyFollowed || followed.includes(o.id)) &&
          (rateMax == null || !o.daily_rate || o.daily_rate <= rateMax)
      ),
    [items, onlyFollowed, followed, rateMax]
  );

  const groups = useMemo(() => {
    const m = new Map();

    visible.forEach((o) => {
      const k = o.company.id;
      if (!m.has(k)) m.set(k, { company: o.company, list: [] });
      m.get(k).list.push(o);
    });

    return [...m.values()];
  }, [visible]);

  const toggleFollow = (id) =>
    setFollowed((l) =>
      l.includes(id) ? l.filter((x) => x !== id) : [...l, id]
    );

  const toggleCompare = (id) =>
    setCompare((l) =>
      l.includes(id) ? l.filter((x) => x !== id) : l.length < 3 ? [...l, id] : l
    );

  const compareList = compare.map((id) => items.find((o) => o.id === id)).filter(Boolean);

  const saveSearch = () => {
    const name = window.prompt("Nom de cette recherche :");
    if (!name?.trim()) return;
    setSaved((l) => [...l, { id: Date.now(), name: name.trim(), f, search }]);
  };

  const applySaved = (sv) => {
    setF(sv.f);
    setSearch(sv.search || "");
  };

  const ago = updatedAt
    ? Math.max(0, Math.round((Date.now() - updatedAt) / 60000))
    : null;

  const renderCard = (o) => (
    <TalentCard
      key={o.id}
      o={o}
      onOpen={onOpen}
      followed={followed.includes(o.id)}
      onFollow={() => toggleFollow(o.id)}
      compared={compare.includes(o.id)}
      onCompare={() => toggleCompare(o.id)}
      compareLocked={compare.length >= 3}
      currentCompanyId={f.company_id}
    />
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)] xl:gap-6">
      <FiltersPanel
        f={f}
        set={set}
        reset={reset}
        counts={meta?.counts}
        activeCount={activeCount}
        rateCap={rateCap}
        rateMax={rateMax}
        setRateMax={setRateMax}
        saved={saved}
        onSave={saveSearch}
        onApply={applySaved}
        onRemoveSaved={(id) => setSaved((l) => l.filter((x) => x.id !== id))}
      />

      <div className="min-w-0 space-y-4">
        {/* Barre de recherche */}
        <div className={`${panel} flex flex-col gap-3 p-3 sm:p-4`}>
          <div className="flex flex-col gap-2.5 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="market-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un talent, une compétence..."
                className={`${inputCls} pl-10`}
              />
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block dark:border-white/10 dark:bg-white/5">
                /
              </kbd>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-48">
                <ArrowUpDown
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  className={`${inputCls} pl-9`}
                  value={f.sort}
                  onChange={(e) => set("sort", e.target.value)}
                >
                  <option value="availability">Disponibles d'abord</option>
                  <option value="recent">Plus récents</option>
                  <option value="rate_asc">Tarif croissant</option>
                  <option value="rate_desc">Tarif décroissant</option>
                </select>
              </div>
              <Tabs
                value={group ? "co" : "list"}
                onChange={(v) => setGroup(v === "co")}
                tabs={[
                  { id: "list", label: "Liste" },
                  { id: "co", label: "Entreprise" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Résultats et commandes */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
              {meta
                ? `${visible.length} talent${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""}`
                : "Recherche des talents..."}
              {meta && (
                <span className="ml-1.5 font-medium text-slate-400">
                  sur {meta.total}
                </span>
              )}
            </p>
            {ago != null && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                Actualisé {ago < 1 ? "à l'instant" : `il y a ${ago} min`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyFollowed((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                onlyFollowed
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
              }`}
            >
              <Heart size={13} />
              Suivis ({followed.length})
            </button>
            <button
              onClick={() => load(1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:border-teal-200 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
            >
              <RefreshCw size={13} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Résultats */}
        {loading && items.length === 0 ? (
          <Skeleton />
        ) : visible.length === 0 ? (
          <div className={`${panel} p-6 sm:p-8`}>
            <Empty
              title="Aucun talent ne correspond"
              text="Élargissez vos critères ou réinitialisez les filtres pour découvrir d'autres profils."
            >
              {(activeCount > 0 || onlyFollowed) && (
                <button
                  onClick={() => {
                    reset();
                    setOnlyFollowed(false);
                  }}
                  className={btnGhost}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </Empty>
          </div>
        ) : group ? (
          <div className="space-y-7">
            {groups.map(({ company, list }) => (
              <section key={company.id} className="space-y-3">
                <div className={`${panel} flex items-center justify-between gap-3 p-4`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={company.name} src={company.logo_url} size={42} square />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                        {company.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {list.filter((o) => o.state === "available").length} disponible(s)
                        {" · "}
                        {list.filter((o) => o.state !== "available").length} en mission
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-300">
                    {list.length} profil(s)
                  </span>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {list.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visible.map(renderCard)}
          </div>
        )}

        {meta && page < meta.last_page && (
          <div className="flex justify-center pt-2">
            <button
              disabled={loading}
              onClick={() => {
                const n = page + 1;
                setPage(n);
                load(n);
              }}
              className={`${btnGhost} min-w-40 justify-center`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Afficher plus de talents
            </button>
          </div>
        )}
      </div>

      {/* Barre flottante du comparateur */}
      {compare.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-[#102B3F] px-4 py-3 text-white shadow-[0_18px_50px_-15px_rgba(15,35,55,0.65)] sm:bottom-7 sm:gap-4 sm:px-5">
          <div className="flex -space-x-2">
            {compareList.map((o) => (
              <span key={o.id} className="rounded-full ring-2 ring-[#102B3F]">
                <Avatar name={o.talent.name} src={o.talent.avatar_url} size={30} />
              </span>
            ))}
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold">{compare.length} talent(s)</p>
            <p className="text-[9px] text-white/50">Sélectionnés</p>
          </div>
          <span className="text-[11px] font-bold sm:hidden">{compare.length}/3</span>
          <button
            onClick={() => setCompare([])}
            className="text-[11px] font-semibold text-white/60 transition hover:text-white"
          >
            Vider
          </button>
          <button
            disabled={compare.length < 2}
            onClick={() => setShowCompare(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#0E918C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Scale size={14} />
            Comparer
          </button>
        </div>
      )}

      {showCompare && compareList.length > 0 && (
        <CompareModal
          list={compareList}
          onClose={() => setShowCompare(false)}
          onOpen={(id) => {
            setShowCompare(false);
            onOpen(id);
          }}
          onRemove={(id) => {
            toggleCompare(id);
            if (compare.length <= 2) setShowCompare(false);
          }}
        />
      )}
    </div>
  );
}

/* ========================================================================== */
/*  ESTIMATION DU COÛT                                                        */
/* ========================================================================== */

function CostEstimator({ o }) {
  const [range, setRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const from =
      o.available_from &&
      String(o.available_from).slice(0, 10) > String(o.start_at).slice(0, 10)
        ? String(o.available_from).slice(0, 10)
        : String(o.start_at).slice(0, 10);

    setRange({
      start: from,
      end: String(o.end_at).slice(0, 10),
    });
  }, [o.id]); // eslint-disable-line

  const days = workingDays(range.start, range.end);
  const factor = workloadFactor(o.workload_value, o.workload_unit);
  const total = o.daily_rate ? o.daily_rate * days * factor : null;

  return (
    <section className="space-y-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 dark:border-teal-500/20 dark:from-teal-500/[0.08] dark:to-white/[0.02]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-white/10 dark:text-teal-300">
          <Euro size={17} />
        </span>
        <div>
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            Estimer le coût de la mission
          </p>
          <p className="text-[10px] text-slate-500">Ajustez la période pour simuler votre budget</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">Début</label>
          <input
            type="date"
            className={inputCls}
            value={range.start}
            min={String(o.start_at).slice(0, 10)}
            max={range.end || undefined}
            onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">Fin</label>
          <input
            type="date"
            className={inputCls}
            value={range.end}
            min={range.start || undefined}
            max={String(o.end_at).slice(0, 10)}
            onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
          />
        </div>
      </div>

      {total != null ? (
        <div className="rounded-xl border border-teal-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-[10px] leading-5 text-slate-500">
            {days} jours ouvrés · {formatPrice(o.daily_rate, o.currency)} / jour · charge{" "}
            {workloadLabel(o.workload_value, o.workload_unit)}
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-500">Coût estimé</span>
            <p className="text-2xl font-extrabold tracking-tight text-[#102B3F] dark:text-white">
              ≈ {formatPrice(total, o.currency)}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-white/70 p-3 text-[11px] leading-5 text-slate-500 dark:bg-white/[0.04]">
          Le tarif est à discuter : l'estimation sera disponible après l'échange avec l'entreprise.
        </p>
      )}
    </section>
  );
}

/* ========================================================================== */
/*  TIROIR DE DÉTAIL                                                           */
/* ========================================================================== */

function OfferDrawer({ id, companies, onClose, onChanged, show, celebrate }) {
  const [data, setData] = useState(null);
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullOffer, setFullOffer] = useState(null);
  const [showPropose, setShowPropose] = useState(false);
  const [wl, setWl] = useState({ company_id: "", message: "", desired_start_at: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api.get(`/talent-market/${id}`).then((r) => setData(r.data)).catch(() => setData(null)), [id]
  );

  useEffect(() => { setLoading(true); setAlts([]); load().finally(() => setLoading(false)); }, [load]);

  const o = data?.offer;

  const myCompanyIds = companies.map((c) => Number(c.id));
  const alreadyProposed = !data?.is_owner && o?.proposed_company_ids?.some(id => myCompanyIds.includes(Number(id)));
  
  // ✅ NOUVEAU : On vérifie si on est déjà dans la liste d'attente
  const myWaitingEntry = data?.my_waiting?.[0];
  const isFirstInWaitlist = myWaitingEntry?.position === 1;

  useEffect(() => {
    if (o && o.state !== "available" && !data.is_owner) {
      api.get(`/talent-market/${id}/alternatives`).then((r) => setAlts(r.data.data || [])).catch(() => setAlts([]));
    }
  }, [o?.state, id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !showPropose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showPropose]);

  const eligible = useMemo(() => companies.filter((c) => data?.eligible_company_ids?.includes(Number(c.id))), [companies, data]);
  const waitable = useMemo(
    () => companies.filter((c) => o && Number(c.id) !== Number(o.company.id) && !o.waiting_company_ids.includes(Number(c.id))), [companies, o]
  );

  useEffect(() => {
    if (waitable.length && !waitable.some((c) => String(c.id) === String(wl.company_id))) {
      setWl((w) => ({ ...w, company_id: waitable[0].id }));
    }
  }, [waitable]);

  const waiters = data?.waiting_companies || o?.waiting_companies || [];

  const openPropose = async () => {
    try { const r = await api.get(`/resource-sharing/${id}`); setFullOffer(r.data); setShowPropose(true); }
    catch (e) { show(apiError(e), "error"); }
  };

  const join = async () => {
    if (!wl.company_id) return show("Vous devez avoir une entreprise pour faire une demande.", "error");
    setBusy(true);
    try {
      const r = await api.post(`/talent-market/${id}/waitlist`, {
        company_id: wl.company_id, message: wl.message || null, desired_start_at: wl.desired_start_at || null,
      });
      await load(); onChanged();
      celebrate("Vous êtes sur la liste d'attente", `Vous êtes n°${r.data.position}. Vous serez notifié dès que ${o.talent.name} se libère.`);
    } catch (e) { show(apiError(e), "error"); }
    finally { setBusy(false); }
  };

  const leave = async (companyId) => {
    setBusy(true);
    try {
      await api.delete(`/talent-market/${id}/waitlist`, { params: { company_id: companyId } });
      await load(); onChanged();
      celebrate("Attente annulée", "Votre entreprise a quitté la liste d'attente de ce talent.");
    } catch (e) { show(apiError(e), "error"); }
    finally { setBusy(false); }
  };

  if (showPropose && fullOffer) {
    return (
      <ProposalFormModal offer={fullOffer} companies={eligible}
        onClose={() => setShowPropose(false)}
        onSaved={(msg) => {
          setShowPropose(false); load(); onChanged();
          const sent = /envoy/i.test(msg);
          celebrate(msg.replace(/^✅\s*/, ""), sent ? "L'entreprise propriétaire du talent a été notifiée. Suivez la réponse dans Collaborations." : "Retrouvez votre brouillon dans Collaborations.");
        }} />
    );
  }

  return createPortal(
    <div className={`fixed inset-0 z-[9000] flex justify-end bg-[#102B3F]/45 ${FONT} backdrop-blur-[3px]`} onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        className="flex h-full w-full max-w-[600px] flex-col overflow-hidden border-l border-white/20 bg-[#F8FAFC] shadow-2xl dark:border-white/10 dark:bg-[#0D192D]">
        
        {/* EN-TÊTE */}
        <header className="relative shrink-0 overflow-hidden bg-[#102B3F] px-5 py-5 sm:px-7">
          <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            {o ? (
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="shrink-0 rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-lg">
                  <Avatar name={o.talent.name} src={o.talent.avatar_url} size={58} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Profil du talent</p>
                  <h2 className="truncate text-[19px] font-extrabold tracking-tight text-white">{o.talent.name}</h2>
                  <p className="mt-1 truncate text-[12px] font-semibold text-[#50D5CF]">{o.talent.headline || o.title}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                      <Building2 size={11} /> {o.company.name}
                    </span>
                  </div>
                </div>
              </div>
            ) : <span className="text-sm text-white/60">Chargement du profil…</span>}
            <button onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/70 transition hover:rotate-90 hover:bg-white/20 hover:text-white">
              <X size={17} />
            </button>
          </div>
        </header>

        {/* CONTENU */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {loading ? <Skeleton rows={3} /> : !o ? (
            <div className={`${panel} p-6`}><Empty title="Talent introuvable" text="Cette offre n'est plus disponible." /></div>
          ) : (
            <>
              {alreadyProposed && (
                <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-500/25 dark:bg-teal-500/[0.08]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
                    <CheckCircle2 size={21} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-teal-900 dark:text-teal-100">Proposition en cours</h3>
                    <p className="mt-1 text-[11px] leading-5 text-teal-700 dark:text-teal-300">
                      Vous avez déjà envoyé une proposition pour ce talent. Suivez son avancement dans la section « Collaborations ».
                    </p>
                  </div>
                </div>
              )}

              {!alreadyProposed && !data.is_owner && o.state === "available" && !data.can_propose && o.proposed_company_ids.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Une autre entreprise a déjà fait une proposition pour ce talent.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <StateBadge state={o.state} availableFrom={o.available_from} indefinite={o.indefinite} />
                {o.waitlist_count > 0 && <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">{o.waitlist_count} entreprise(s) en attente</span>}
              </div>

              <section className={`${panel} p-5`}>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Présentation</p>
                <h3 className="text-[16px] font-extrabold leading-snug text-slate-900 dark:text-white">{o.title}</h3>
                {o.description && <p className="mt-3 whitespace-pre-line text-[12px] leading-6 text-slate-600 dark:text-slate-300">{o.description}</p>}
              </section>

              {o.talent?.portfolio?.slug && (
                <a href={`/portfolio/${o.talent.portfolio.slug}`} target="_blank" rel="noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-4 transition hover:border-teal-300 hover:shadow-md dark:border-teal-500/20 dark:from-teal-500/[0.08] dark:to-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-white/10 dark:text-teal-300">
                      <FolderOpen size={19} />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold text-teal-900 dark:text-teal-200">Portfolio du talent</p>
                      <p className="mt-0.5 text-[10px] text-teal-700 dark:text-teal-400">Découvrez ses réalisations et projets.</p>
                    </div>
                  </div>
                  <ArrowUpRight size={17} className="text-teal-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-teal-400" />
                </a>
              )}

              <section className={`${panel} p-4`}>
                <SectionTitle icon={BriefcaseBusiness}>Informations de la mission</SectionTitle>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    ["Période d'offre", `${fmtDate(o.start_at)} au ${fmtDate(o.end_at)}`],
                    ["Type", MISSION_TYPES[o.mission_type]],
                    ["Charge", workloadLabel(o.workload_value, o.workload_unit)],
                    ["Lieu", `${LOCATIONS[o.location_type] || "—"}${o.location_city ? `, ${o.location_city}` : ""}`],
                    ["Tarif", o.daily_rate ? `${formatPrice(o.daily_rate, o.currency)} / jour` : "À discuter"],
                    ["Entreprise", o.company.name],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                      <dt className="text-[10px] font-medium text-slate-400">{k}</dt>
                      <dd className="mt-1 break-words text-[11px] font-bold text-slate-800 dark:text-slate-100">{v}</dd>
                    </div>
                  ))}
                </div>
              </section>

              {!data.is_owner && <CostEstimator o={o} />}

              {o.skills.length > 0 && (
                <section className={`${panel} p-4`}>
                  <SectionTitle>Compétences</SectionTitle>
                  <SkillChips skills={o.skills} max={20} />
                </section>
              )}

              {o.conditions && (
                <section className={`${panel} p-4`}>
                  <SectionTitle>Conditions particulières</SectionTitle>
                  <p className="whitespace-pre-line text-[12px] leading-6 text-slate-600 dark:text-slate-300">{o.conditions}</p>
                </section>
              )}

              {data.is_owner && (
                <section className={`${panel} space-y-3 p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">Entreprises en attente</p>
                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {waiters.length || o.waitlist_count || 0}
                    </span>
                  </div>
                  {waiters.length ? waiters.map((w, i) => <WaiterRow key={w.company_id || i} w={w} index={i} />)
                    : <p className="text-[11px] leading-5 text-slate-500">{o.waitlist_count > 0 ? "Le détail des entreprises n'est pas encore fourni par l'API." : "Aucune entreprise n'attend ce talent pour l'instant."}</p>}
                </section>
              )}

              {/* ✅ LOGIQUE CORRIGÉE POUR L'ACTION */}
              {!data.is_owner && (
                <section className={`${panel} space-y-4 p-4`}>
                  {o.state === "available" ? (
                    // ✅ Si je suis 1er sur la liste d'attente, je dois pouvoir emprunter !
                    (data.can_propose || isFirstInWaitlist) && !alreadyProposed ? (
                      <>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                            {isFirstInWaitlist ? "Vous êtes prioritaire !" : "Ce talent est disponible"}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                            {isFirstInWaitlist 
                              ? `Vous étiez n°1 sur la liste d'attente. Envoyez votre proposition à ${o.company.name} avant les autres.` 
                              : `Envoyez une proposition de collaboration à ${o.company.name}.`}
                          </p>
                        </div>
                        <button onClick={openPropose} className={`${btnPrimary} w-full justify-center`}>
                          Emprunter ce talent
                        </button>
                      </>
                    ) : alreadyProposed ? (
                      <p className="text-[11px] text-slate-500">Vous avez déjà envoyé une proposition pour ce talent.</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">Seule une entreprise peut emprunter un talent.</p>
                    )
                  ) : (
                    <>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                          {o.state === "reserved" ? "Talent actuellement réservé" : "Talent actuellement en mission"}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                          {o.indefinite ? "Sa date de libération n'est pas connue." : o.available_from ? `Il sera libre à partir du ${fmtDate(o.available_from)}.` : ""}
                        </p>
                      </div>

                      {o.state === "on_mission" && o.available_from && eligible.length > 0 && (
                        <div>
                          <button onClick={openPropose} className={`${btnGhost} w-full justify-center`}>
                            Proposer une mission après le {fmtDate(o.available_from)}
                          </button>
                          <p className="mt-2 text-[10px] leading-5 text-slate-400">Choisissez une date de début postérieure à sa libération : le système refuse les périodes qui chevauchent sa mission.</p>
                        </div>
                      )}

                      {data.my_waiting.map((w) => {
                        const co = companies.find((c) => Number(c.id) === w.company_id);
                        return (
                          <div key={w.company_id} className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50 px-3.5 py-3 text-[11px] dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
                            <span className="text-violet-800 dark:text-violet-200">
                              <strong>{co?.name || "Votre entreprise"}</strong>, n°{w.position} sur la liste
                            </span>
                            <button disabled={busy} onClick={() => leave(w.company_id)} className="shrink-0 text-[10px] font-bold text-violet-700 hover:underline dark:text-violet-300">Quitter</button>
                          </div>
                        );
                      })}

                      {waitable.length > 0 && (
                        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                          <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Rejoindre la liste d'attente</p>
                          {waitable.length > 1 && (
                            <select className={inputCls} value={wl.company_id} onChange={(e) => setWl((w) => ({ ...w, company_id: e.target.value }))}>
                              {waitable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          )}
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">Date de début souhaitée</label>
                            <input type="date" className={inputCls} value={wl.desired_start_at} min={o.available_from || undefined} onChange={(e) => setWl((w) => ({ ...w, desired_start_at: e.target.value }))} />
                          </div>
                          <textarea rows={3} className={`${inputCls} resize-y`} placeholder="Message pour l'entreprise (optionnel) : contexte du besoin..." value={wl.message} onChange={(e) => setWl((w) => ({ ...w, message: e.target.value }))} />
                          <button disabled={busy} onClick={join} className={`${btnPrimary} w-full justify-center`}>
                            {busy && <Loader2 size={14} className="animate-spin" />}
                            Attendre ce talent
                          </button>
                          <p className="text-[10px] leading-5 text-slate-400">Vous serez notifié dès que le talent sera libre. L'entreprise est informée de votre intérêt.</p>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {alts.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle>Talents similaires disponibles</SectionTitle>
                  <div className="space-y-2">
                    {alts.slice(0, 3).map((a) => (
                      <div key={a.id} className={`${panel} flex items-center gap-3 p-3`}>
                        <Avatar name={a.talent?.name} src={a.talent?.avatar_url} size={38} />
                        <p className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-100">{a.talent?.name}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}

/* ========================================================================== */
/*  MES ATTENTES                                                               */
/* ========================================================================== */

const WAIT_STATUS = {
  waiting: {
    label: "En attente",
    cls: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  notified: {
    label: "Disponible maintenant",
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  lost: {
    label: "Plus disponible",
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
  converted: {
    label: "Collaboration lancée",
    cls: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  },
};

const WAIT_FILTERS = [
  { id: "all", label: "Toutes", test: () => true },
  { id: "notified", label: "À saisir", test: (e) => e.status === "notified" },
  { id: "waiting", label: "En attente", test: (e) => e.status === "waiting" },
  { id: "done", label: "Terminées", test: (e) => ["lost", "converted"].includes(e.status) },
];

function WaitingTab({ onOpen, refreshKey, show, celebrate, onChanged }) {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    api
      .get("/talent-market/waitlist/mine")
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const leave = async (e) => {
    try {
      await api.delete(`/talent-market/${e.offer.id}/waitlist`, {
        params: { company_id: e.company.id },
      });

      load();
      onChanged();

      celebrate(
        "Attente annulée",
        `${e.company.name} a quitté la liste d'attente de ${e.offer.talent.name}.`
      );
    } catch (err) {
      show(apiError(err), "error");
    }
  };

  if (rows === null) return <Skeleton rows={3} />;

  if (!rows.length) {
    return (
      <div className={`${panel} p-6 sm:p-8`}>
        <Empty
          title="Aucune attente en cours"
          text="Quand un talent est en mission, ouvrez sa fiche et choisissez « Attendre ce talent » : vous serez prévenu dès qu'il se libère."
        />
      </div>
    );
  }

  const f = WAIT_FILTERS.find((x) => x.id === filter) || WAIT_FILTERS[0];
  const shown = rows
    .filter(f.test)
    .sort((a, b) => (b.status === "notified") - (a.status === "notified"));

  return (
    <div className="space-y-4">
      <div className={`${panel} p-3`}>
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={WAIT_FILTERS.map((x) => ({
            id: x.id,
            label: x.label,
            count: rows.filter(x.test).length,
          }))}
        />
      </div>

      {shown.length === 0 ? (
        <div className={`${panel} p-6`}>
          <Empty title="Rien dans cette catégorie" />
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((e) => {
            const st = WAIT_STATUS[e.status] || WAIT_STATUS.waiting;
            const o = e.offer;
            const n = o.state !== "available" ? daysUntil(o.available_from) : null;

            return (
              <article
                key={e.id}
                className={`${panel} flex flex-col gap-4 p-4 transition hover:border-teal-200 hover:shadow-md sm:flex-row sm:items-center ${
                  e.status === "notified"
                    ? "border-emerald-200 ring-4 ring-emerald-500/[0.04] dark:border-emerald-500/20"
                    : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar name={o.talent.name} src={o.talent.avatar_url} size={50} />
                    {e.status === "notified" && (
                      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-[#101D35]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                        {o.talent.name}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {o.company.name}, pour {e.company.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      {e.position ? <span>n°{e.position} sur la liste</span> : null}
                      {o.state !== "available" ? (
                        <>
                          <StateBadge
                            state={o.state}
                            availableFrom={o.available_from}
                            indefinite={o.indefinite}
                            compact
                          />
                          {n != null && n >= 0 && (
                            <span className="font-bold text-amber-600">
                              Libre {relDays(o.available_from)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-bold text-emerald-600">
                          Libre actuellement
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {e.status === "notified" && (
                    <button onClick={() => onOpen(o.id)} className={btnPrimary}>
                      Proposer maintenant
                    </button>
                  )}
                  {e.status === "lost" && (
                    <button onClick={() => onOpen(o.id)} className={btnGhost}>
                      Voir des alternatives
                    </button>
                  )}
                  {["waiting", "notified"].includes(e.status) && (
                    <>
                      <button onClick={() => onOpen(o.id)} className={btnGhost}>
                        Détails
                      </button>
                      <button
                        onClick={() => leave(e)}
                        className="rounded-xl px-3 py-2.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        Quitter
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  PAGE PRINCIPALE                                                            */
/* ========================================================================== */

export default function TalentMarket() {
  const [params, setParams] = useSearchParams();
  const { toast, show, close } = useToast();
  const [companies, setCompanies] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [done, setDone] = useState(null);

  const tab = TABS.some((t) => t.id === params.get("tab"))
    ? params.get("tab")
    : "market";

  const offerId = params.get("offer");

  useEffect(() => {
    api
      .get("/companies/my/all")
      .then((r) => setCompanies(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(() => setCompanies([]));
  }, []);

  const celebrate = useCallback(
    (title, text, extra = {}) => setDone({ title, text, ...extra }),
    []
  );

  const setTab = (t) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.set("tab", t);
        n.delete("offer");
        return n;
      },
      { replace: true }
    );

  const openOffer = (id) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("offer", id);
      return n;
    });

  const closeOffer = () =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete("offer");
        return n;
      },
      { replace: true }
    );

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <AppShell>
      <main className={`mx-auto max-w-[1500px] space-y-5 px-1 py-3 pb-20 ${FONT} sm:px-2`}>
        {/* Navigation des espaces */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_3px_14px_rgba(15,35,55,0.035)] dark:border-white/10 dark:bg-[#101D35]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden items-center gap-3 px-3 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102B3F] text-white shadow-sm">
                <Users size={18} />
              </span>
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                  Talent Market
                </p>
                <p className="text-[10px] text-slate-400">
                  Découvrez et mobilisez des talents
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1 sm:flex-initial">
              <Tabs value={tab} onChange={setTab} tabs={TABS} />
            </div>
          </div>
        </div>

        {tab === "market" && (
          <MarketTab onOpen={openOffer} refreshKey={refreshKey} />
        )}

        {tab === "pool" && (
          <PoolTab
            companies={companies}
            show={show}
            celebrate={celebrate}
          />
        )}

        {tab === "waiting" && (
          <WaitingTab
            onOpen={openOffer}
            refreshKey={refreshKey}
            show={show}
            celebrate={celebrate}
            onChanged={bump}
          />
        )}
      </main>

      {offerId && (
        <OfferDrawer
          key={offerId}
          id={offerId}
          companies={companies}
          onClose={closeOffer}
          onChanged={bump}
          show={show}
          celebrate={celebrate}
        />
      )}

      {done && (
        <SuccessScreen
          {...done}
          onClose={() => setDone(null)}
        />
      )}

      {toast &&
        createPortal(
          <div className="relative z-[10060]">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={close}
            />
          </div>,
          document.body
        )}
    </AppShell>
  );
}