import React, { useMemo, useRef, useState } from "react";
import {
  Handshake, Loader2, Paperclip, Save, Send, Trash2, AlertTriangle, FileText, X,
  ChevronLeft, ChevronRight, Check, UploadCloud, Wifi, Building2, CalendarRange, MessageSquareText, FolderOpen,
} from "lucide-react";
import api from "../../services/api";
import {
  Field, inputCls, fmtDate, durationLabel, toInputDate, apiError,
} from "./shared";

const MAX_FILES = 5;
const MAX_MB = 10;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const STEPS = [
  { key: "context", label: "Besoin", icon: Building2 },
  { key: "period", label: "Période", icon: CalendarRange },
  { key: "message", label: "Message", icon: MessageSquareText },
  { key: "docs", label: "Finalisation", icon: FolderOpen },
];

const DESCRIPTION_STARTERS = ["Missions : ", "Livrables attendus : ", "Équipe d'accueil : "];
const CONDITION_STARTERS = ["Rémunération : ", "Facturation : ", "Matériel fourni : ", "Avantages : "];
const MESSAGE_STARTERS = [
  "Bonjour, nous avons découvert votre profil et pensons qu'il correspond à un besoin précis de notre équipe. ",
  "Notre entreprise souhaite vous accueillir pour renforcer un projet en cours. ",
];

const Chip = ({ children, onClick, active = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95 ${
      active
        ? "border-[#16B8B1] bg-[#16B8B1]/15 text-[#0F8F8A] dark:text-[#5EE0DA]"
        : "border-slate-200 bg-white/70 text-slate-600 hover:border-[#16B8B1]/60 hover:text-[#0F8F8A] dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
    }`}
  >
    {children}
  </button>
);

export default function ProposalFormModal({ offer, companies = [], proposal = null, onClose, onSaved }) {
  const editing = Boolean(proposal);
  const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // On garde uniquement la partie date pour éviter tout décalage UTC.
  const offerStart = offer.start_at ? offer.start_at.split("T")[0] : "";
  const offerEnd = offer.end_at ? offer.end_at.split("T")[0] : "";

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [form, setForm] = useState({
    description: proposal?.description || "",
    message: proposal?.message || "",
    conditions: proposal?.conditions || "",
    start_at: proposal?.start_at ? proposal.start_at.split("T")[0] : offerStart,
    end_at: proposal?.end_at ? proposal.end_at.split("T")[0] : offerEnd,
    workload_percent: proposal?.workload_percent ?? 100,
    remote: proposal?.remote ?? ["remote", "hybrid"].includes(offer.location_type),
    expires_at: toInputDate(proposal?.expires_at) || defaultExpiry,
  });
  const [files, setFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState(proposal?.documents || []);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const append = (k, text) => set(k, (form[k] ? form[k].trimEnd() + "\n" : "") + text);

  const outOfRange = form.start_at && form.end_at && (form.start_at < offerStart || form.end_at > offerEnd);
  const reversed = form.start_at && form.end_at && form.end_at < form.start_at;
  const periodOk = Boolean(form.start_at && form.end_at && !outOfRange && !reversed);
  const messageLen = form.message.trim().length;
  const messageOk = messageLen >= 20;
  const companyOk = editing || Boolean(companyId);
  const canSend = companyOk && messageOk && periodOk;

  const stepValid = [companyOk, periodOk, messageOk, true];

  // Complétion globale (barre de progression)
  const completion = useMemo(() => {
    const checks = [
      companyOk,
      form.description.trim().length > 0,
      periodOk,
      messageOk,
      form.conditions.trim().length > 0,
      files.length + existingDocs.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [companyOk, form.description, form.conditions, periodOk, messageOk, files.length, existingDocs.length]);

  // Position de la période choisie dans la fenêtre de l'offre
  const timeline = useMemo(() => {
    if (!offerStart || !offerEnd || !periodOk) return null;
    const total = Math.max(daysBetween(offerStart, offerEnd), 1);
    const left = (daysBetween(offerStart, form.start_at) / total) * 100;
    const width = Math.max((daysBetween(form.start_at, form.end_at) / total) * 100, 2);
    return { left, width };
  }, [offerStart, offerEnd, form.start_at, form.end_at, periodOk]);

  const applyDuration = (days) => {
    const start = form.start_at || offerStart;
    let end = addDays(start, days);
    if (offerEnd && end > offerEnd) end = offerEnd;
    setForm((f) => ({ ...f, start_at: start, end_at: end }));
  };

  const go = (n) => {
    setError("");
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const addFiles = (list) => {
    const next = [...files];
    for (const f of Array.from(list)) {
      if (f.size > MAX_MB * 1024 * 1024) { setError(`« ${f.name} » dépasse ${MAX_MB} Mo.`); continue; }
      if (next.length + existingDocs.length >= MAX_FILES) { setError(`Maximum ${MAX_FILES} documents.`); break; }
      next.push(f);
    }
    setFiles(next);
  };

  const removeExisting = async (doc) => {
    try {
      await api.delete(`/proposals/${proposal.id}/documents/${doc.id}`);
      setExistingDocs((d) => d.filter((x) => x.id !== doc.id));
    } catch (e) { setError(apiError(e)); }
  };

  const save = async (status) => {
    setError("");
    if (status === "sent" && !canSend) {
      setError(!messageOk ? "Le message d'accompagnement doit contenir au moins 20 caractères." : "Vérifiez la période (elle doit rester dans celle de l'offre).");
      return;
    }
    setBusy(status);
    const body = {
      description: form.description || null,
      message: form.message || null,
      conditions: form.conditions || null,
      start_at: form.start_at || null,
      end_at: form.end_at || null,
      workload_percent: Number(form.workload_percent) || 100,
      remote: !!form.remote,
      expires_at: form.expires_at || null,
    };

    try {
      let saved = proposal;
      if (editing) {
        await api.patch(`/proposals/${proposal.id}`, body);
      } else {
        const res = await api.post("/proposals/to-company", {
          ...body, resource_offer_id: offer.id, proposed_by_company_id: Number(companyId),
          status: files.length && status === "sent" ? "draft" : status,
        });
        saved = res.data;
      }

      let failed = 0;
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        try { await api.post(`/proposals/${saved.id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } }); }
        catch { failed += 1; }
      }

      const mustSubmit = status === "sent" && (editing || files.length > 0);
      if (mustSubmit) await api.post(`/proposals/${saved.id}/submit`);

      const msg = status === "sent" ? "✅ Proposition envoyée !" : "Brouillon enregistré";
      onSaved?.(failed ? `${msg} (${failed} document(s) non envoyé(s))` : msg, saved);
    } catch (e) {
      setError(apiError(e, "Erreur lors de l'enregistrement"));
    } finally { setBusy(null); }
  };

  const isLast = step === STEPS.length - 1;
  const messageHint = messageOk ? "Parfait, c'est assez détaillé." : `Encore ${20 - messageLen} caractère${20 - messageLen > 1 ? "s" : ""} pour pouvoir envoyer.`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <style>{`
        @keyframes pf-in-right { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
        @keyframes pf-in-left  { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
        @keyframes pf-pop { 0% { transform: scale(.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .pf-in-right { animation: pf-in-right .28s ease-out both; }
        .pf-in-left  { animation: pf-in-left .28s ease-out both; }
        .pf-pop { animation: pf-pop .3s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .pf-in-right, .pf-in-left, .pf-pop { animation: none; } }
      `}</style>

      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 dark:bg-[#131E47]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* EN-TÊTE DOUX + ÉTAPES */}
        <div className="bg-gradient-to-br from-[#E8F7F6] to-[#F3F8FB] px-6 pb-4 pt-5 dark:from-[#0B1F33] dark:to-[#131E47]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#16B8B1] shadow-sm dark:bg-[#16B8B1]/20">
              <Handshake size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-slate-800 dark:text-white">
                {editing ? "Modifier le brouillon" : "Proposer une collaboration"}
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                {offer.profile?.user?.name || "Salarié"} · {offer.company?.name || ""}
              </p>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-[#0F8F8A] dark:bg-white/10 dark:text-[#5EE0DA]">
              {completion}% complété
            </span>
            <button type="button" onClick={onClose} aria-label="Fermer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/80 dark:text-white dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
            <div className="h-full rounded-full bg-[#16B8B1] transition-all duration-500" style={{ width: `${completion}%` }} />
          </div>

          {/* Stepper cliquable */}
          <div className="mt-3 flex items-center justify-between gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step && stepValid[i];
              const current = i === step;
              const reachable = i <= step || stepValid.slice(0, i).every(Boolean);
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={!reachable}
                  onClick={() => go(i)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    current ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "pf-pop bg-[#16B8B1] text-white" : current ? "bg-[#16B8B1]/20 text-[#0F8F8A] dark:text-[#5EE0DA]" : "bg-slate-200/70 text-slate-500 dark:bg-white/10"}`}>
                    {done ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENU DE L'ÉTAPE */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div key={step} className={`space-y-5 ${dir > 0 ? "pf-in-right" : "pf-in-left"}`}>

            {/* ÉTAPE 1 : BESOIN */}
            {step === 0 && (
              <>
                {!editing && companies.length > 0 && (
                  <Field label="Votre entreprise (qui accueille le salarié)" required>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Contexte du besoin" hint="Ce que le salarié ferait chez vous.">
                  <textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls}
                    placeholder="Nous cherchons un renfort pour la refonte de notre plateforme..." />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">Pour démarrer :</span>
                  {DESCRIPTION_STARTERS.map((t) => <Chip key={t} onClick={() => append("description", t)}>+ {t.replace(" : ", "")}</Chip>)}
                </div>
              </>
            )}

            {/* ÉTAPE 2 : PÉRIODE */}
            {step === 1 && (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Durée rapide</p>
                  <div className="flex flex-wrap gap-2">
                    {[["2 semaines", 14], ["1 mois", 30], ["3 mois", 90], ["6 mois", 180]].map(([l, d]) => <Chip key={l} onClick={() => applyDuration(d)}>{l}</Chip>)}
                    <Chip onClick={() => setForm((f) => ({ ...f, start_at: offerStart, end_at: offerEnd }))}>Toute la disponibilité</Chip>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Début souhaité" required><input type="date" min={offerStart} max={offerEnd} value={form.start_at} onChange={(e) => set("start_at", e.target.value)} className={inputCls} /></Field>
                  <Field label="Fin souhaitée" required><input type="date" min={form.start_at || offerStart} max={offerEnd} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} className={inputCls} /></Field>
                </div>

                {/* Frise visuelle de la disponibilité */}
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <div className="relative h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                    {timeline && (
                      <div className="absolute top-0 h-full rounded-full bg-[#16B8B1] transition-all duration-500"
                        style={{ left: `${timeline.left}%`, width: `${timeline.width}%` }} />
                    )}
                  </div>
                  <p className={`mt-2.5 flex items-center gap-1.5 text-xs ${outOfRange || reversed ? "text-rose-600" : "text-slate-500 dark:text-slate-400"}`}>
                    {outOfRange || reversed
                      ? <><AlertTriangle size={13} /> {reversed ? "La fin précède le début." : `La période doit rester entre le ${fmtDate(offerStart)} et le ${fmtDate(offerEnd)}.`}</>
                      : <>Disponible du {fmtDate(offerStart)} au {fmtDate(offerEnd)}{periodOk ? ` — votre durée : ${durationLabel(form.start_at, form.end_at)}` : ""}</>}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Charge de travail</p>
                    <span className="text-2xl font-extrabold text-[#0F8F8A] dark:text-[#5EE0DA]">{form.workload_percent}%</span>
                  </div>
                  <input type="range" min={10} max={100} step={5} value={form.workload_percent} onChange={(e) => set("workload_percent", e.target.value)} className="w-full accent-[#16B8B1]" />
                  <div className="mt-2 flex gap-2">
                    {[25, 50, 75, 100].map((p) => <Chip key={p} active={Number(form.workload_percent) === p} onClick={() => set("workload_percent", p)}>{p}%</Chip>)}
                  </div>
                </div>

                <button type="button" onClick={() => set("remote", !form.remote)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${form.remote ? "border-[#16B8B1]/50 bg-[#16B8B1]/10" : "border-slate-200 dark:border-slate-700"}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${form.remote ? "bg-[#16B8B1] text-white" : "bg-slate-100 text-slate-400 dark:bg-white/10"}`}><Wifi size={16} /></span>
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Le salarié travaillera (en partie) à distance
                    <span className="block font-normal text-slate-500 dark:text-slate-400">{form.remote ? "Oui, télétravail possible" : "Non, sur site uniquement"}</span>
                  </span>
                  <span className={`relative h-6 w-11 rounded-full transition ${form.remote ? "bg-[#16B8B1]" : "bg-slate-300 dark:bg-slate-600"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.remote ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                </button>

                <Field label="Réponse attendue avant le" hint="Passé ce délai, la proposition expire.">
                  <input type="date" min={today} value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputCls} />
                </Field>
                <div className="-mt-3 flex gap-2">
                  {[["7 jours", 7], ["15 jours", 15], ["30 jours", 30]].map(([l, d]) => <Chip key={l} onClick={() => set("expires_at", addDays(today, d))}>{l}</Chip>)}
                </div>
              </>
            )}

            {/* ÉTAPE 3 : MESSAGE */}
            {step === 2 && (
              <>
                <Field label="Message d'accompagnement" required>
                  <textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} className={inputCls}
                    placeholder="Présentez votre entreprise et expliquez pourquoi ce profil correspond à votre besoin..." />
                </Field>
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className={`h-full rounded-full transition-all duration-300 ${messageOk ? "bg-[#16B8B1]" : "bg-amber-400"}`} style={{ width: `${Math.min(messageLen / 20, 1) * 100}%` }} />
                  </div>
                  <p className={`mt-1.5 text-xs ${messageOk ? "text-[#0F8F8A] dark:text-[#5EE0DA]" : "text-slate-500 dark:text-slate-400"}`}>{messageHint}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">Une idée d'ouverture :</span>
                  {MESSAGE_STARTERS.map((t, i) => <Chip key={i} onClick={() => set("message", (form.message ? form.message.trimEnd() + " " : "") + t)}>{i === 0 ? "Découverte du profil" : "Renfort projet"}</Chip>)}
                </div>

                <Field label="Conditions particulières (optionnel)" hint="Rémunération, facturation, matériel, avantages...">
                  <textarea rows={3} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputCls} />
                </Field>
                <div className="-mt-3 flex flex-wrap gap-2">
                  {CONDITION_STARTERS.map((t) => <Chip key={t} onClick={() => append("conditions", t)}>+ {t.replace(" : ", "")}</Chip>)}
                </div>
              </>
            )}

            {/* ÉTAPE 4 : DOCUMENTS + RÉCAP */}
            {step === 3 && (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Documents (optionnel)</p>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
                      dragOver ? "scale-[1.01] border-[#16B8B1] bg-[#16B8B1]/10" : "border-slate-200 hover:border-[#16B8B1]/60 hover:bg-[#16B8B1]/5 dark:border-slate-700"
                    }`}
                  >
                    <UploadCloud size={26} className="text-[#16B8B1]" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Glissez vos fichiers ici ou cliquez pour parcourir</p>
                    <p className="text-[11px] text-slate-400">PDF, Word, Excel, image — {MAX_MB} Mo max, {MAX_FILES} fichiers</p>
                  </div>
                  <input ref={inputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

                  <div className="mt-3 space-y-2">
                    {existingDocs.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
                        <FileText size={14} className="text-[#16B8B1]" />
                        <a href={`/storage/${d.file_path}`} target="_blank" rel="noreferrer" className="flex-1 truncate font-semibold text-slate-700 hover:underline dark:text-slate-200">
                          {d.original_name || d.name || d.file_path.split("/").pop()}
                        </a>
                        <button type="button" onClick={() => removeExisting(d)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {files.map((f, i) => (
                      <div key={i} className="pf-pop flex items-center gap-2 rounded-xl bg-[#16B8B1]/10 px-3 py-2 text-xs">
                        <Paperclip size={14} className="text-[#16B8B1]" />
                        <span className="flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{f.name}</span>
                        <span className="text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
                        <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif */}
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <p className="mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">Avant d'envoyer</p>
                  <ul className="space-y-2 text-xs">
                    {[
                      [companyOk, "Entreprise d'accueil choisie", 0],
                      [periodOk, periodOk ? `Période : ${fmtDate(form.start_at)} → ${fmtDate(form.end_at)} (${form.workload_percent}%)` : "Période valide à définir", 1],
                      [messageOk, messageOk ? "Message d'accompagnement rédigé" : "Message de 20 caractères minimum", 2],
                    ].map(([ok, label, target]) => (
                      <li key={label}>
                        <button type="button" onClick={() => go(target)} className="flex w-full items-center gap-2 text-left">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? "bg-[#16B8B1] text-white" : "bg-amber-100 text-amber-600"}`}>
                            {ok ? <Check size={12} strokeWidth={3} /> : <AlertTriangle size={11} />}
                          </span>
                          <span className={ok ? "text-slate-600 dark:text-slate-300" : "font-semibold text-amber-700 dark:text-amber-300"}>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {error && <p className="rounded-2xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
          </div>
        </div>

        {/* PIED DE MODALE */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-transparent">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} disabled={!!busy}
              className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronLeft size={16} /> Retour
            </button>
          ) : (
            <button type="button" onClick={onClose} disabled={!!busy}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              Annuler
            </button>
          )}

          <div className="flex-1" />

          <button type="button" onClick={() => save("draft")} disabled={!!busy}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800">
            {busy === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Brouillon
          </button>

          {isLast ? (
            <button type="button" onClick={() => save("sent")} disabled={!!busy || !canSend}
              className="flex items-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#16B8B1]/30 transition hover:bg-[#14A39C] active:scale-[.98] disabled:opacity-50">
              {busy === "sent" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer la proposition
            </button>
          ) : (
            <button type="button" onClick={() => go(step + 1)} disabled={!stepValid[step]}
              className="flex items-center gap-1 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#16B8B1]/30 transition hover:bg-[#14A39C] active:scale-[.98] disabled:opacity-40">
              Continuer <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}