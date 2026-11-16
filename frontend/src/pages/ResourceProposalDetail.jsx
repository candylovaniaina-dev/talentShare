import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import api from "../services/api";
import {
  Avatar, SkillChips, Skeleton, Empty, SuccessScreen, ConfirmDialog,
  fmtDate, apiError, btnPrimary, btnGhost, btnDanger, cardCls,
} from "../components/talent-market/ui";

const FONT = "font-['Plus_Jakarta_Sans',sans-serif]";

const STEPS = [["draft", "Brouillon"], ["sent", "Envoyée"], ["viewed", "Consultée"], ["accepted", "Acceptée"]];
const TERMINAL = { declined: "Refusée", expired: "Expirée", cancelled: "Annulée" };
const PILL = {
  draft: "bg-white/15 text-white", sent: "bg-amber-400 text-[#0B1F33]", viewed: "bg-sky-400 text-[#0B1F33]",
  accepted: "bg-[#16B8B1] text-[#0B1F33]", declined: "bg-rose-500 text-white",
  expired: "bg-slate-400 text-[#0B1F33]", cancelled: "bg-slate-400 text-[#0B1F33]",
};
const TABS = [["overview", "Aperçu"], ["message", "Message et conditions"], ["docs", "Documents"], ["history", "Historique"]];

const DAY = 86400000;
const toMs = (d) => (d ? new Date(d).getTime() : NaN);
const clamp = (n) => Math.max(0, Math.min(100, n));
const fmtDT = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const span = (a, b) => {
  const d = Math.round((toMs(b) - toMs(a)) / DAY) + 1;
  if (!(d > 0)) return "—";
  if (d < 60) return `${d} jour${d > 1 ? "s" : ""}`;
  const m = Math.round(d / 30.4);
  return m >= 12 && m % 12 === 0 ? `${m / 12} an${m > 12 ? "s" : ""}` : `${m} mois`;
};

function Collapsible({ text, limit = 280 }) {
  const [open, setOpen] = useState(false);
  if (!text) return <p className="text-sm text-slate-400">Non renseigné.</p>;
  const long = text.length > limit;
  return (
    <div>
      <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-700 dark:text-slate-300">{open || !long ? text : `${text.slice(0, limit)}…`}</p>
      {long && <button type="button" onClick={() => setOpen(!open)} className="mt-1.5 text-xs font-bold text-[#0F9691] hover:underline">{open ? "Voir moins" : "Voir plus"}</button>}
    </div>
  );
}

function Block({ title, hint, children }) {
  return (
    <section className={`${cardCls} rounded-2xl p-5`}>
      <h3 className="text-[15px] font-bold text-[#0B1F33] dark:text-white">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ResourceProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, show, close } = useToast();

  const [p, setP] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [done, setDone] = useState(null);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get(`/proposals/${id}`);
      setP(r.data?.data || r.data); setErr(null);
    } catch (e) { setErr(e.response?.status === 403 ? "forbidden" : "notfound"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/companies/my/all")
      .then((r) => setCompanies(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(() => setCompanies([]));
  }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const pending = p && ["sent", "viewed"].includes(p.status);
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => load(true), 30000); // synchro automatique
    return () => clearInterval(t);
  }, [pending, load]);

  if (loading) return <AppShell><main className={`mx-auto max-w-6xl p-6 ${FONT}`}><Skeleton rows={3} /></main></AppShell>;
  if (err || !p) {
    return (
      <AppShell>
        <main className={`mx-auto max-w-lg p-6 ${FONT}`}>
          <Empty title={err === "forbidden" ? "Accès refusé" : "Proposition introuvable"} text="Vous n'avez pas accès à cette proposition ou elle n'existe plus.">
            <Link to="/collaborations" className={btnPrimary}>Retour aux collaborations</Link>
          </Empty>
        </main>
      </AppShell>
    );
  }

  /* ---------- Données dérivées ---------- */
  const offer = p.resource_offer || p.resourceOffer || p.offer || {};
  const profile = offer.profile || {};
  const talentName = profile.user?.name || offer.talent?.name || "Salarié";
  const headline = profile.headline || offer.talent?.headline || offer.title;
  const avatar = profile.avatar_path ? `/storage/${profile.avatar_path}` : offer.talent?.avatar_url || null;
  const skills = (offer.skills || profile.skills || []).map((s) => ({ name: s.name, level: s.pivot?.level || s.level }));
  const offerCompany = offer.company || {};
  const proposing = p.proposing_company || p.proposingCompany || {};

  const myIds = companies.map((c) => Number(c.id));
  const isSender = myIds.includes(Number(p.proposed_by_company_id));
  const isReceiver = myIds.includes(Number(offer.company_id ?? offerCompany.id));
  const other = isSender ? offerCompany : proposing;
  const otherLabel = isSender ? "Envoyée à" : "Reçue de";

  const terminal = TERMINAL[p.status];
  const idx = terminal ? 2 : Math.max(0, STEPS.findIndex(([k]) => k === p.status));
  const stepDates = {
    draft: p.created_at, sent: p.sent_at, viewed: p.viewed_at,
    accepted: p.responded_at || p.accepted_at,
    end: p.responded_at || p.declined_at || p.cancelled_at || p.updated_at,
  };

  const expMs = toMs(p.expires_at);
  const daysLeft = Number.isNaN(expMs) ? null : Math.ceil((expMs - now) / DAY);
  const urgent = pending && daysLeft !== null && daysLeft <= 3;

  const oS = toMs(offer.start_at), oE = toMs(offer.end_at), pS = toMs(p.start_at), pE = toMs(p.end_at);
  const barOk = [oS, oE, pS, pE].every((n) => !Number.isNaN(n)) && oE > oS;
  const left = barOk ? clamp(((pS - oS) / (oE - oS)) * 100) : 0;
  const width = barOk ? clamp(((pE - pS) / (oE - oS)) * 100) : 0;

  const workload = p.workload_percent ?? 100;
  const docs = p.documents || [];
  const mission = p.mission;

  const facts = [
    ["Période", p.start_at ? `${fmtDate(p.start_at)} → ${fmtDate(p.end_at)}` : "À définir"],
    ["Durée", p.start_at && p.end_at ? span(p.start_at, p.end_at) : "—"],
    ["Charge", `${workload} %`],
    ["Réponse avant le", p.expires_at ? fmtDate(p.expires_at) : "—"],
  ];

  const nextStep = (() => {
    if (mission) return ["Collaboration lancée", "La mission a été créée. Retrouvez-la dans vos collaborations."];
    if (p.status === "draft") return ["Brouillon", "Votre proposition n'est pas encore envoyée. Complétez-la puis envoyez-la."];
    if (pending && isReceiver) return ["Votre réponse est attendue", `Acceptez pour lancer la mission de ${talentName}, ou refusez la proposition.`];
    if (pending && isSender) return ["En attente de réponse", `${offerCompany.name || "L'entreprise"} n'a pas encore répondu. Vous serez notifié dès sa décision.`];
    if (p.status === "declined") return ["Proposition refusée", "Le dossier est clôturé."];
    if (p.status === "expired") return ["Proposition expirée", "Le délai de réponse est dépassé."];
    if (p.status === "cancelled") return ["Proposition annulée", "Le dossier est clôturé."];
    return null;
  })();

  /* ---------- Actions ---------- */
  const act = async (path, title, text) => {
    setBusy(true);
    try {
      const r = await api.post(`/proposals/${id}/${path}`);
      setConfirm(null);
      await load(true);
      setDone({ title, text, missionId: r.data?.mission?.id });
    } catch (e) { setConfirm(null); show(apiError(e), "error"); }
    finally { setBusy(false); }
  };

  const ask = (kind) => {
    const cfg = {
      accept: { title: "Accepter la proposition ?", text: `${talentName} sera mis à disposition de ${proposing.name || "l'entreprise"} sur la période indiquée. Une mission sera créée.`, label: "Accepter", run: () => act("accept", "Proposition acceptée !", "La mission est créée. Les deux entreprises ont été notifiées.") },
      decline: { title: "Refuser la proposition ?", text: "Le processus s'arrêtera ici pour ce dossier.", label: "Refuser", danger: true, run: () => act("decline", "Proposition refusée", "L'entreprise a été informée de votre décision.") },
      cancel: { title: "Annuler la proposition ?", text: "Elle sera retirée définitivement.", label: "Annuler la proposition", danger: true, run: () => act("cancel", "Proposition annulée", "L'autre entreprise en a été informée.") },
    }[kind];
    setConfirm(cfg);
  };

  const history = [
    ["Brouillon créé", stepDates.draft],
    ["Proposition envoyée", stepDates.sent],
    ["Consultée par le destinataire", stepDates.viewed],
    [p.status === "accepted" ? "Proposition acceptée" : terminal ? `Proposition ${terminal.toLowerCase()}` : null, p.status === "accepted" ? stepDates.accepted : terminal ? stepDates.end : null],
  ].filter(([l, d]) => l && d);

  return (
    <AppShell>
      <main className={`mx-auto max-w-6xl space-y-5 px-1 py-1 pb-12 ${FONT} sm:px-2`}>
        {/* ---------- Bandeau ---------- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F33] via-[#0B2A40] to-[#0F3B4A] text-white shadow-lg">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#16B8B1]/25 blur-3xl" />
          <div className="relative px-6 pb-6 pt-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/collaborations" className="text-[13px] font-medium text-white/60 hover:text-white">← Collaborations · Propositions</Link>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Proposition #{p.id}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${PILL[p.status] || PILL.draft}`}>{terminal || STEPS[idx][1]}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center">
              <Avatar name={talentName} src={avatar} size={84} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-3xl font-bold tracking-tight">{talentName}</h1>
                <p className="mt-1 truncate text-[15px] text-white/75">{headline}</p>
                <p className="mt-2 text-sm text-white/60">
                  {otherLabel} <strong className="font-semibold text-white">{other.name || "—"}</strong>
                  {" · "}Talent de <strong className="font-semibold text-white">{offerCompany.name || "—"}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {mission && <Link to={`/missions/${mission.id}`} className="rounded-lg bg-[#16B8B1] px-5 py-2.5 text-[13px] font-bold text-[#0B1F33] transition hover:bg-white">Voir la mission</Link>}
                {offer.id && <Link to={`/resource-offers/${offer.id}`} className="rounded-lg border border-white/25 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10">Voir l'offre</Link>}
              </div>
            </div>
          </div>
          <dl className="relative grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 lg:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-[#0B1F33]/80 px-6 py-4 sm:px-8">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-white/50">{k}</dt>
                <dd className="mt-1 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Suivi ---------- */}
        <section className={`${cardCls} rounded-2xl px-5 py-5 sm:px-8`}>
          <ol className="flex items-start">
            {STEPS.map(([key, label], i) => {
              const last = i === STEPS.length - 1;
              const failed = last && terminal;
              const reached = failed || i <= idx;
              const current = !failed && i === idx && !["accepted"].includes(p.status);
              const date = failed ? stepDates.end : stepDates[key];
              return (
                <li key={key} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-all duration-700 ${reached ? (failed ? "bg-rose-400" : "bg-[#16B8B1]") : "bg-slate-200 dark:bg-white/10"}`} />}
                  <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    failed ? "bg-rose-500 text-white" : reached ? "bg-[#16B8B1] text-[#0B1F33]" : "bg-slate-200 text-slate-500 dark:bg-white/10"} ${current ? "ring-4 ring-[#16B8B1]/30" : ""}`}>
                    {failed ? "✕" : reached && !current ? "✓" : i + 1}
                  </span>
                  <span className={`mt-2 text-xs font-bold ${reached ? "text-[#0B1F33] dark:text-white" : "text-slate-400"}`}>{failed ? terminal : label}</span>
                  <span className="mt-0.5 h-4 text-[10px] text-slate-400">{date ? fmtDate(date) : ""}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ================= Colonne principale ================= */}
          <div className="min-w-0 space-y-5">
            <div className={`${cardCls} rounded-2xl`}>
              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 dark:border-white/10" role="tablist">
                {TABS.map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                    className={`relative whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold transition ${tab === k ? "text-[#0F9691]" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
                    {l}{k === "docs" && docs.length > 0 ? ` (${docs.length})` : ""}
                    {tab === k && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#16B8B1]" />}
                  </button>
                ))}
              </div>

              <div className="space-y-5 p-5">
                {tab === "overview" && (
                  <>
                    <Block title="Période proposée" hint="Positionnée dans la période de disponibilité de l'offre.">
                      {barOk ? (
                        <>
                          <div className="relative h-10 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                            <div className="absolute inset-y-1 rounded-lg bg-gradient-to-r from-[#16B8B1] to-[#0F9691] shadow transition-all duration-700"
                              style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }} />
                          </div>
                          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                            <span>Offre : {fmtDate(offer.start_at)}</span>
                            <span className="font-semibold text-[#0F9691]">Proposition : {fmtDate(p.start_at)} → {fmtDate(p.end_at)}</span>
                            <span>{fmtDate(offer.end_at)}</span>
                          </div>
                        </>
                      ) : <p className="text-sm text-slate-500">Période non précisée.</p>}
                    </Block>

                    <Block title="Modalités">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0A1230]">
                          <p className="text-[11px] text-slate-400">Charge de travail</p>
                          <p className="mt-1 text-xl font-bold text-[#0B1F33] dark:text-white">{workload} %</p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-[#16B8B1] transition-all duration-700" style={{ width: `${workload}%` }} /></div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0A1230]">
                          <p className="text-[11px] text-slate-400">Lieu de travail</p>
                          <p className="mt-1 text-sm font-bold text-[#0B1F33] dark:text-white">{p.remote ? "Télétravail possible" : "Sur site"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{offer.location_city || offer.city || "—"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0A1230]">
                          <p className="text-[11px] text-slate-400">Tarif de l'offre</p>
                          <p className="mt-1 text-sm font-bold text-[#0B1F33] dark:text-white">{offer.daily_rate ? `${offer.daily_rate} € / jour` : "À discuter"}</p>
                        </div>
                      </div>
                    </Block>

                    {p.description && <Block title="Contexte du besoin"><Collapsible text={p.description} /></Block>}
                  </>
                )}

                {tab === "message" && (
                  <>
                    <Block title="Message d'accompagnement" hint={`Rédigé par ${proposing.name || "l'entreprise"}`}>
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0A1230]"><Collapsible text={p.message} /></div>
                    </Block>
                    <Block title="Conditions particulières"><Collapsible text={p.conditions} /></Block>
                    {offer.conditions && <Block title="Conditions de l'offre d'origine"><Collapsible text={offer.conditions} /></Block>}
                  </>
                )}

                {tab === "docs" && (
                  docs.length === 0 ? <Empty title="Aucun document" text="Aucun fichier n'a été joint à cette proposition." /> : (
                    <div className="space-y-2">
                      {docs.map((d) => (
                        <a key={d.id} href={`/storage/${d.file_path}`} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-[#16B8B1] dark:border-white/10">
                          <span className="min-w-0 truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{d.original_name || d.name || d.file_path?.split("/").pop()}</span>
                          <span className="shrink-0 text-xs font-bold text-[#0F9691]">Ouvrir</span>
                        </a>
                      ))}
                    </div>
                  )
                )}

                {tab === "history" && (
                  history.length === 0 ? <Empty title="Pas encore d'historique" /> : (
                    <ol className="relative space-y-5 pl-6">
                      <span className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200 dark:bg-white/10" />
                      {history.map(([l, d], i) => (
                        <li key={l} className="relative">
                          <span className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#131E47] ${i === history.length - 1 ? "bg-[#16B8B1]" : "bg-slate-300"}`} />
                          <p className="text-sm font-semibold text-[#0B1F33] dark:text-white">{l}</p>
                          <p className="text-xs text-slate-500">{fmtDT(d)}</p>
                        </li>
                      ))}
                    </ol>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ================= Colonne latérale ================= */}
          <aside className="space-y-5">
            {nextStep && (
              <section className={`rounded-2xl border p-5 ${urgent ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10" : "border-[#16B8B1]/30 bg-[#16B8B1]/5"}`}>
                <h3 className="text-sm font-bold text-[#0B1F33] dark:text-white">{nextStep[0]}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{nextStep[1]}</p>

                {pending && daysLeft !== null && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Délai de réponse</span>
                      <span className={`text-sm font-bold ${urgent ? "text-amber-700" : "text-[#0F9691]"}`}>{daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}` : "Expire aujourd'hui"}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                      <div className={`h-full rounded-full transition-all duration-700 ${urgent ? "bg-amber-500" : "bg-[#16B8B1]"}`} style={{ width: `${clamp((daysLeft / 30) * 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {pending && isReceiver && (
                    <>
                      <button disabled={busy} onClick={() => ask("accept")} className={btnPrimary}>Accepter la proposition</button>
                      <button disabled={busy} onClick={() => ask("decline")} className={btnGhost}>Refuser</button>
                    </>
                  )}
                  {pending && isSender && <button disabled={busy} onClick={() => ask("cancel")} className={btnGhost}>Annuler la proposition</button>}
                  {p.status === "draft" && isSender && (
                    <>
                      <button disabled={busy} onClick={() => act("submit", "Proposition envoyée !", `${offerCompany.name || "L'entreprise"} a été notifiée.`)} className={btnPrimary}>Envoyer la proposition</button>
                      <button onClick={() => setEditing(true)} className={btnGhost}>Modifier le brouillon</button>
                    </>
                  )}
                  {mission && <Link to={`/missions/${mission.id}`} className={`${btnPrimary} w-full`}>Voir la mission</Link>}
                </div>
              </section>
            )}

            <section className={`${cardCls} rounded-2xl p-5`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Talent</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={talentName} src={avatar} size={52} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{talentName}</p>
                  <p className="truncate text-xs text-slate-500">{headline}</p>
                </div>
              </div>
              {skills.length > 0 && <div className="mt-4"><SkillChips skills={skills} max={8} /></div>}
              {profile.id && <Link to={`/talents/${profile.id}`} className="mt-4 block text-xs font-bold text-[#0F9691] hover:underline">Voir le profil complet</Link>}
            </section>

            <section className={`${cardCls} rounded-2xl p-5`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{isSender ? "Entreprise prêteuse" : "Entreprise demandeuse"}</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={other.name} src={other.logo_url} size={52} square />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{other.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">{[other.city, other.country].filter(Boolean).join(", ")}{other.is_verified ? " · vérifiée" : ""}</p>
                </div>
              </div>
              {other.owner_user_id && (
                <Link to={{ pathname: "/messages", search: `?to=${other.owner_user_id}&name=${encodeURIComponent(other.name || "")}` }} className={`${btnGhost} mt-4 w-full`}>Envoyer un message</Link>
              )}
            </section>
          </aside>
        </div>
      </main>

      {editing && (
        <ProposalFormModal offer={offer} companies={[]} proposal={p} onClose={() => setEditing(false)}
          onSaved={(msg) => { setEditing(false); load(true); setDone({ title: msg.replace(/^✅\s*/, ""), text: "Vos modifications sont enregistrées." }); }} />
      )}
      {confirm && (
        <ConfirmDialog title={confirm.title} text={confirm.text} confirmLabel={confirm.label} danger={confirm.danger} busy={busy} onConfirm={confirm.run} onCancel={() => setConfirm(null)} />
      )}
      {done && (
        <SuccessScreen title={done.title} text={done.text}
          actionLabel={done.missionId ? "Voir la mission" : "Continuer"}
          onClose={() => { const m = done.missionId; setDone(null); if (m) navigate(`/missions/${m}`); }} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </AppShell>
  );
}