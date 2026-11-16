import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

/* ───────────────────────── Police + animations ───────────────────────── */
export const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ts-font,.ts-font *{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
@keyframes ts-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ts-rise{animation:ts-rise .35s ease both}
@keyframes ts-grow{from{width:0}}
.ts-grow{animation:ts-grow .8s ease both}
@keyframes tsPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes tsUp{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
`;
export const Style = () => <style>{FONT_CSS}</style>;

/* ───────────────────────── Jetons de style ───────────────────────── */
export const T = {
  card: "rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0F2A40]",
  well: "rounded-lg bg-slate-50 dark:bg-[#0B2235]",
  input:
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0B2235] dark:text-white",
  inputSm:
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0F2A40] dark:text-white",
  title: "text-[#0B2235] dark:text-white",
  teal: "text-[#0E8F8A] dark:text-[#5EE0DA]",
  divide: "divide-y divide-slate-100 dark:divide-white/10",
};

export const fmtD = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return isNaN(x) ? "—" : x.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

/* ───────────────────────── Boutons ───────────────────────── */
const BTN = {
  primary: "bg-[#16B8B1] text-[#0B2235] hover:bg-[#2BD0C9]",
  dark: "bg-[#0B2235] text-white hover:bg-[#163650] dark:bg-[#16B8B1] dark:text-[#0B2235] dark:hover:bg-[#2BD0C9]",
  soft: "bg-[#16B8B1]/10 text-[#0E8F8A] hover:bg-[#16B8B1]/20 dark:text-[#5EE0DA]",
  ghost: "border border-slate-200 text-slate-700 hover:border-[#16B8B1] hover:text-[#0E8F8A] dark:border-white/10 dark:text-slate-200 dark:hover:text-[#5EE0DA]",
  plain: "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
  danger: "border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10",
  dangerPlain: "text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10",
};

export function Btn({ to, href, variant = "ghost", size = "sm", icon: Icon, iconOnly, loading, className = "", children, ...rest }) {
  const sz = iconOnly ? "h-8 w-8" : size === "xs" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs";
  const cls = `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sz} ${BTN[variant]} ${className}`;
  const I = loading ? Loader2 : Icon;
  const content = (<>{I && <I size={13} className={loading ? "animate-spin" : ""} />}{children}</>);
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  return <button type="button" className={cls} {...rest}>{content}</button>;
}

/* ───────────────────────── Pastilles ───────────────────────── */
export const TONES = {
  teal: "bg-[#16B8B1]/12 text-[#0E8F8A] dark:text-[#5EE0DA]",
  blue: "bg-[#3478E8]/12 text-[#2A62C4] dark:text-[#8DB4F5]",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};
const DOTS = { teal: "bg-[#16B8B1]", blue: "bg-[#3478E8]", amber: "bg-amber-500", rose: "bg-rose-500", violet: "bg-violet-500", green: "bg-emerald-500", slate: "bg-slate-400" };

export function Chip({ tone = "slate", icon: Icon, dot, className = "", children }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

/* ───────────────────────── Blocs ───────────────────────── */
export function Panel({ title, icon: Icon, right, children, className = "", flush = false }) {
  return (
    <section className={`${T.card} ts-rise ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-white/10">
          <h2 className="flex items-center gap-2 text-[12px] font-bold text-[#0B2235] dark:text-white">
            {Icon && <Icon size={14} className="text-[#16B8B1]" />} {title}
          </h2>
          {right}
        </header>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function Prop({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-xs">
      <dt className="flex shrink-0 items-center gap-2 text-slate-400">{Icon && <Icon size={13} />} {label}</dt>
      <dd className="min-w-0 text-right font-semibold text-slate-800 dark:text-slate-100">{children || "—"}</dd>
    </div>
  );
}

export function Stat({ icon: Icon, label, value, sub, tone = "teal", pulse, visual, className = "" }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${className}`}>
      {visual || (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>{Icon && <Icon size={16} />}</span>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
          {pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
          )}
        </p>
        <p className="truncate text-[15px] font-extrabold leading-tight tabular-nums text-[#0B2235] dark:text-white">{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export function Meter({ value, tone = "teal", className = "" }) {
  const bg = tone === "amber" ? "bg-amber-400" : tone === "blue" ? "bg-[#3478E8]" : "bg-gradient-to-r from-[#16B8B1] to-[#3478E8]";
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10 ${className}`}>
      <div className={`ts-grow h-full rounded-full ${bg}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Ring({ pct, size = 40, label }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-white/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" stroke="#16B8B1" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * p) / 100} className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[#0B2235] dark:text-white">{label ?? `${Math.round(p)}%`}</span>
    </div>
  );
}

export function CountUp({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    let raf; let t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / 600);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

/** Frise de période : progression, marqueur du jour, libération éventuelle */
export function Timeline({ start, end, freeFrom, showDates = true }) {
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  const now = new Date(), DAY = 864e5;
  const pos = (d) => Math.max(0, Math.min(100, ((d - s) / (e - s)) * 100));
  const today = pos(now);
  const free = freeFrom ? pos(new Date(freeFrom)) : 0;
  const phase = now < s ? "upcoming" : now > e ? "past" : "live";
  const label = phase === "upcoming" ? `Débute dans ${Math.ceil((s - now) / DAY)} j`
    : phase === "live" ? `${Math.max(0, Math.ceil((e - now) / DAY))} j restants` : "Période terminée";
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
        {free > 0
          ? <div className="ts-grow absolute inset-y-0 left-0 rounded-full bg-amber-300" style={{ width: `${free}%` }} />
          : <div className="ts-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#16B8B1] to-[#3478E8]" style={{ width: `${today}%` }} />}
        {phase === "live" && (
          <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3478E8] shadow dark:border-[#0F2A40]" style={{ left: `${today}%` }} />
        )}
      </div>
      {showDates && (
        <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400"><span>{fmtD(start)}</span><span>{fmtD(end)}</span></div>
      )}
      <p className={`mt-1 text-[11px] font-semibold ${T.teal}`}>{label}</p>
      {free > 0 && (
        <p className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> En mission</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Disponible</span>
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Onglets ───────────────────────── */
export function UTabs({ tabs, value, onChange, className = "" }) {
  return (
    <div className={`flex gap-0.5 overflow-x-auto ${className}`} role="tablist">
      {tabs.map((t) => {
        const on = value === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            className={`relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs font-semibold transition ${on ? "text-[#0E8F8A] dark:text-[#5EE0DA]" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
            {Icon && <Icon size={13} />}
            {t.label}
            {t.count != null && (
              <span className={`rounded-md px-1.5 text-[10px] font-bold tabular-nums ${on ? "bg-[#16B8B1]/15" : "bg-slate-100 dark:bg-white/10"}`}>{t.count}</span>
            )}
            {on && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#16B8B1]" />}
          </button>
        );
      })}
    </div>
  );
}

export function Seg({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-white/5 ${className}`}>
      {options.map((o) => {
        const on = value === o.id;
        const Icon = o.icon;
        return (
          <button key={o.id} type="button" title={o.title || o.label} onClick={() => onChange(o.id)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition ${on ? "bg-white text-[#0B2235] shadow-sm dark:bg-[#163650] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"}`}>
            {Icon && <Icon size={13} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, required, hint, right, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{label}{required && <span className="text-[#16B8B1]"> *</span>}</span>
        {right}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}