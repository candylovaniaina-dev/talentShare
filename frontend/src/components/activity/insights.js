import { getMissionTitle } from "./shared";

export const DAY = 86400000;
export const MIN = 60000;
const THREE_HOURS = 3 * 3600000;

/* ---------- Dates ---------- */
export const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
// Date « jour » (missions, disponibilités) : on ignore l'heure/fuseau
export const toDay = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toDate(v);
};
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
export const weekId = (d = new Date()) => {
  const w = startOfWeek(d);
  return `${w.getFullYear()}-${w.getMonth() + 1}-${w.getDate()}`;
};
export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const inRange = (d, a, b) => !!d && d >= a && d < b;

export const countdown = (ms) => {
  const m = Math.max(0, Math.round(ms / MIN));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
  return `${Math.floor(h / 24)} j`;
};

/* ---------- Propositions ---------- */
const uniqueById = (list) => {
  const seen = new Set();
  return list.filter((x) => x?.id != null && !seen.has(x.id) && seen.add(x.id));
};

// Pour un étudiant, /proposals/received contient aussi SES propres candidatures :
// on sépare donc « mes candidatures » (sans entreprise émettrice) et « propositions reçues ».
export function splitProposals(sent = [], received = []) {
  const all = uniqueById([...sent, ...received]).filter((p) => !["draft", "cancelled"].includes(p.status));
  return {
    all,
    mine: all.filter((p) => !p.proposed_by_company_id),
    incoming: all.filter((p) => !!p.proposed_by_company_id),
  };
}

/* ============================================================
   AGENDA
============================================================ */
export const EVENT_META = {
  interview: { label: "Entretien", dot: "bg-rose-400", chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  mission_start: { label: "Début de mission", dot: "bg-teal-400", chip: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" },
  mission_end: { label: "Fin de mission", dot: "bg-amber-400", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  availability: { label: "Disponibilité", dot: "bg-sky-300", chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
};

export function buildAgenda({ applications = [], sent = [], received = [], missions = [], availability = [] }) {
  const events = [];

  applications.forEach((a) => {
    const at = toDate(a.interview_at);
    if (!at) return;
    const offer = a.job_offer || a.jobOffer;
    events.push({
      id: `app-${a.id}`, type: "interview", start: at, allDay: false, mode: "visio",
      title: offer?.title || "Entretien", subtitle: offer?.company?.name || "",
      link: a.interview_link || null, to: `/applications/${a.id}`,
    });
  });

  splitProposals(sent, received).all.forEach((p) => {
    const at = toDate(p.interview_at);
    if (!at) return;
    events.push({
      id: `prop-${p.id}`, type: "interview", start: at, allDay: false,
      mode: p.interview_mode || "visio", status: p.interview_status,
      title: p.resource_request?.title || p.resourceRequest?.title || p.title || "Entretien",
      subtitle: p.proposing_company?.name || p.proposingCompany?.name || p.to_company?.name || p.toCompany?.name || "",
      location: p.interview_mode === "onsite" ? p.interview_location : null,
      link: p.interview_link || null, to: `/proposals/${p.id}`,
    });
  });

  missions.forEach((m) => {
    if (["cancelled", "declined"].includes(m.status)) return;
    const s = toDay(m.start_at);
    const e = toDay(m.end_at);
    const title = getMissionTitle(m);
    const company = m.requesting_company?.name || m.requestingCompany?.name || "";
    if (s) events.push({ id: `ms-${m.id}`, type: "mission_start", start: s, allDay: true, title, subtitle: company, to: `/missions/${m.id}` });
    if (e) events.push({ id: `me-${m.id}`, type: "mission_end", start: e, allDay: true, title, subtitle: company, to: `/missions/${m.id}` });
  });

  availability.forEach((w) => {
    if (!["available", "partially_available"].includes(w.status)) return;
    const s = toDay(w.start_at);
    const e = toDay(w.end_at);
    if (!s || !e) return;
    events.push({
      id: `av-${w.id}`, type: "availability", start: s, end: e, allDay: true,
      title: w.status === "available" ? "Disponible" : "Partiellement disponible",
      subtitle: [w.location_city, w.workload_percent ? `${w.workload_percent} %` : null].filter(Boolean).join(" · "),
      to: "/profile",
    });
  });

  return events.sort((a, b) => a.start - b.start);
}

export function eventsOnDay(events, day) {
  const d0 = startOfDay(day).getTime();
  return events.filter((e) =>
    e.type === "availability"
      ? d0 >= startOfDay(e.start).getTime() && d0 <= startOfDay(e.end).getTime()
      : sameDay(e.start, day)
  );
}

export function upcomingEvents(events, now = new Date(), days = 30) {
  const from = now.getTime() - THREE_HOURS;
  const to = now.getTime() + days * DAY;
  const today = startOfDay(now).getTime();
  return events.filter(
    (e) =>
      e.type !== "availability" &&
      (e.allDay ? e.start.getTime() >= today : e.start.getTime() >= from) &&
      e.start.getTime() <= to
  );
}

export const nextInterviewOf = (events, now = new Date()) =>
  events.find((e) => e.type === "interview" && e.status !== "failed" && e.start.getTime() + THREE_HOURS >= now.getTime()) || null;

export const canJoin = (ev, now = new Date()) =>
  !!ev.link && now.getTime() >= ev.start.getTime() - 15 * MIN && now.getTime() <= ev.start.getTime() + THREE_HOURS;

export function joinInterview(link, navigate) {
  try {
    const u = new URL(link, window.location.origin);
    if (u.origin === window.location.origin) navigate(u.pathname + u.search);
    else window.open(u.href, "_blank", "noopener");
  } catch {
    window.open(link, "_blank", "noopener");
  }
}

/* ============================================================
   RAPPORT HEBDOMADAIRE
============================================================ */
export function buildWeeklyReport({
  applications = [], sent = [], received = [], missions = [], radar = [],
  now = new Date(), skillsAdded = 0, completion = 0,
}) {
  const w0 = startOfWeek(now);
  const w1 = new Date(w0.getTime() + 7 * DAY);
  const p0 = new Date(w0.getTime() - 7 * DAY);
  const { mine, incoming } = splitProposals(sent, received);

  const norm = (x, isApp) => ({
    status: x.status,
    created: toDate(isApp ? x.created_at : x.sent_at || x.created_at),
    viewed: toDate(x.viewed_at),
    interview: toDate(x.interview_at),
  });
  const pipeline = [...applications.map((a) => norm(a, true)), ...mine.map((p) => norm(p, false))];
  const interviewDates = [
    ...pipeline.map((x) => x.interview),
    ...incoming.map((p) => toDate(p.interview_at)),
  ].filter(Boolean);

  const metric = (key, label, dates) => {
    const value = dates.filter((d) => inRange(d, w0, w1)).length;
    const prev = dates.filter((d) => inRange(d, p0, w0)).length;
    return { key, label, value, prev, delta: value - prev };
  };

  const metrics = [
    metric("applications", "Candidatures envoyées", pipeline.map((x) => x.created)),
    metric("viewed", "Consultées par les recruteurs", pipeline.map((x) => x.viewed)),
    metric("interviews", "Entretiens", interviewDates),
    metric("incoming", "Propositions reçues", incoming.map((p) => toDate(p.sent_at || p.created_at))),
    metric("matches", "Nouveaux matchs (60 %+)", radar.filter((i) => i.score >= 60).map((i) => toDate(i.created_at))),
    metric("missions", "Missions démarrées", missions.map((m) => toDay(m.start_at))),
  ];

  // Entonnoir de candidature
  const flag = (x) => {
    const interview = !!x.interview || x.status === "interview";
    const accepted = x.status === "accepted";
    const shortlisted = interview || accepted || x.status === "shortlisted";
    const viewed = shortlisted || x.status === "viewed" || !!x.viewed || ["rejected", "declined"].includes(x.status);
    return { interview, accepted, shortlisted, viewed };
  };
  const flags = pipeline.map(flag);
  const total = pipeline.length;
  const funnel = [
    { key: "sent", label: "Envoyées", value: total },
    { key: "viewed", label: "Consultées ou traitées", value: flags.filter((f) => f.viewed).length },
    { key: "shortlisted", label: "Présélectionnées", value: flags.filter((f) => f.shortlisted).length },
    { key: "interview", label: "Entretiens", value: flags.filter((f) => f.interview).length },
    { key: "accepted", label: "Acceptées", value: flags.filter((f) => f.accepted).length },
  ];
  const responseRate = total ? Math.round((funnel[1].value / total) * 100) : null;

  // 8 dernières semaines
  const weeks = 8;
  const first = new Date(w0.getTime() - (weeks - 1) * 7 * DAY);
  const buckets = Array.from({ length: weeks }, (_, i) => new Date(first.getTime() + i * 7 * DAY));
  const countBy = (dates) =>
    buckets.map((b, i) => {
      const end = i < weeks - 1 ? buckets[i + 1] : w1;
      return dates.filter((d) => inRange(d, b, end)).length;
    });
  const series = {
    labels: buckets,
    applications: countBy(pipeline.map((x) => x.created)),
    interviews: countBy(interviewDates),
  };

  const apps = metrics[0].value;
  const interviewsThisWeek = metrics[2].value;
  const incomingThisWeek = metrics[3].value;
  const interviewsUpcoming = interviewDates.filter((d) => d >= now).length;
  const strong = radar.filter((i) => i.score >= 70).length;

  const parts = [];
  if (apps) parts.push(`${apps} candidature${apps > 1 ? "s" : ""} envoyée${apps > 1 ? "s" : ""}`);
  if (interviewsThisWeek) parts.push(`${interviewsThisWeek} entretien${interviewsThisWeek > 1 ? "s" : ""}`);
  if (incomingThisWeek) parts.push(`${incomingThisWeek} proposition${incomingThisWeek > 1 ? "s" : ""} reçue${incomingThisWeek > 1 ? "s" : ""}`);
  let summary = parts.length ? `Cette semaine : ${parts.join(", ")}.` : "Semaine calme pour l'instant : aucune candidature envoyée.";
  if (strong) summary += ` Le radar a repéré ${strong} opportunité${strong > 1 ? "s" : ""} très compatible${strong > 1 ? "s" : ""}.`;
  if (interviewsUpcoming) summary += ` ${interviewsUpcoming} entretien${interviewsUpcoming > 1 ? "s" : ""} à venir.`;

  return {
    weekStart: w0,
    weekEnd: new Date(w1.getTime() - DAY),
    metrics, funnel, responseRate, series, summary, interviewsUpcoming,
    totals: { applications: total },
    goals: [
      { key: "apps", label: "Envoyer 3 candidatures", value: Math.min(apps, 3), target: 3 },
      { key: "skills", label: "Ajouter 2 compétences", value: Math.min(skillsAdded, 2), target: 2 },
      { key: "profile", label: "Compléter mon profil", value: Math.min(Math.round(completion), 100), target: 100, unit: " %" },
    ],
  };
}

/* ============================================================
   COMPÉTENCES À DÉVELOPPER
============================================================ */
const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "expert"];

export function buildSkillGaps(radar = [], added = []) {
  const map = new Map();

  radar.forEach((it) => {
    const missing = it.missing_skills || [];
    missing.forEach((name) => {
      const sk = (it.skills || []).find((s) => s.name === name);
      if (!sk) return;
      const e = map.get(sk.id) || { id: sk.id, name: sk.name, offers: 0, unlocks: 0, levels: {}, samples: [] };
      e.offers += 1;
      if (missing.length === 1) e.unlocks += 1; // c'est la seule compétence manquante
      if (sk.min_level) e.levels[sk.min_level] = (e.levels[sk.min_level] || 0) + 1;
      if (e.samples.length < 3) e.samples.push(it.title);
      map.set(sk.id, e);
    });
  });

  const topLevel = (levels) =>
    LEVEL_ORDER.filter((l) => levels[l]).sort((a, b) => levels[b] - levels[a])[0] || "beginner";

  return [...map.values()]
    .filter((e) => !added.includes(e.id))
    .map((e) => ({ ...e, level: topLevel(e.levels) }))
    .sort((a, b) => b.unlocks - a.unlocks || b.offers - a.offers)
    .slice(0, 10);
}