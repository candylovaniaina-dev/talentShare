import React, { useRef, useState } from "react";
import { Handshake, Loader2, Paperclip, Save, Send, Trash2, AlertTriangle, FileText } from "lucide-react";
import api from "../../services/api";
import {
  Modal, Field, inputCls, btnPrimary, btnGhost, fmtDate, durationLabel, toInputDate, apiError,
} from "./shared";

const MAX_FILES = 5;
const MAX_MB = 10;

/**
 * Création (proposal = null) ou édition d'un brouillon (proposal = {...}).
 * props : offer, companies (entreprises éligibles), proposal, onClose, onSaved(message)
 */
export default function ProposalFormModal({ offer, companies = [], proposal = null, onClose, onSaved }) {
  const editing = Boolean(proposal);
  const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const offerStart = toInputDate(offer.start_at);
  const offerEnd = toInputDate(offer.end_at);

  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [form, setForm] = useState({
    description: proposal?.description || "",
    message: proposal?.message || "",
    conditions: proposal?.conditions || "",
    start_at: toInputDate(proposal?.start_at) || offerStart,
    end_at: toInputDate(proposal?.end_at) || offerEnd,
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

  const outOfRange = form.start_at && form.end_at && (form.start_at < offerStart || form.end_at > offerEnd);
  const reversed = form.start_at && form.end_at && form.end_at < form.start_at;
  const messageOk = form.message.trim().length >= 20;
  const canSend = (editing || companyId) && messageOk && form.start_at && form.end_at && !outOfRange && !reversed;

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
          // l'envoi réel se fait après l'upload des documents
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

  return (
    <Modal wide icon={Handshake}
      title={editing ? "Modifier le brouillon" : "Proposer une collaboration"}
      subtitle={`${offer.profile?.user?.name || "Salarié"} · ${offer.company?.name || ""}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => save("sent")} disabled={!!busy} className={`${btnPrimary} flex-1`}>
            {busy === "sent" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer la proposition
          </button>
          <button onClick={() => save("draft")} disabled={!!busy} className={btnGhost}>
            {busy === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Brouillon
          </button>
          <button onClick={onClose} disabled={!!busy} className={btnGhost}>Annuler</button>
        </>
      }
    >
      <div className="space-y-4">
        {!editing && companies.length > 0 && (
          <Field label="Votre entreprise (qui accueille le salarié)" required>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Contexte du besoin" hint="Ce que le salarié ferait chez vous (missions, livrables, équipe).">
          <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls}
            placeholder="Nous cherchons un renfort pour la refonte de notre plateforme..." />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Début souhaité" required><input type="date" min={offerStart} max={offerEnd} value={form.start_at} onChange={(e) => set("start_at", e.target.value)} className={inputCls} /></Field>
          <Field label="Fin souhaitée" required><input type="date" min={form.start_at || offerStart} max={offerEnd} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} className={inputCls} /></Field>
        </div>
        <p className={`-mt-2 flex items-center gap-1.5 text-xs ${outOfRange || reversed ? "text-rose-600" : "text-slate-500 dark:text-slate-400"}`}>
          {outOfRange || reversed
            ? <><AlertTriangle size={13} /> {reversed ? "La fin précède le début." : `La période doit rester entre le ${fmtDate(offerStart)} et le ${fmtDate(offerEnd)}.`}</>
            : <>Disponibilité de l'offre : {fmtDate(offerStart)} → {fmtDate(offerEnd)}{form.start_at && form.end_at ? ` · votre durée : ${durationLabel(form.start_at, form.end_at)}` : ""}</>}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Charge de travail : ${form.workload_percent}%`}>
            <input type="range" min={10} max={100} step={5} value={form.workload_percent} onChange={(e) => set("workload_percent", e.target.value)} className="w-full accent-emerald-600" />
          </Field>
          <Field label="Réponse attendue avant le" hint="Passé ce délai, la proposition expire.">
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Le salarié travaillera (en partie) à distance</span>
        </label>

        <Field label="Conditions particulières" hint="Rémunération, facturation, matériel, avantages...">
          <textarea rows={2} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Message d'accompagnement" required hint={`${form.message.trim().length}/20 caractères minimum`}>
          <textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} className={inputCls}
            placeholder="Présentez votre entreprise et expliquez pourquoi ce profil correspond à votre besoin..." />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">Documents (optionnel)</p>
          <div className="space-y-2">
            {existingDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
                <FileText size={14} className="text-emerald-600" />
                <a href={`/storage/${d.file_path}`} target="_blank" rel="noreferrer" className="flex-1 truncate font-semibold text-slate-700 hover:underline dark:text-slate-200">
                  {d.original_name || d.name || d.file_path.split("/").pop()}
                </a>
                <button type="button" onClick={() => removeExisting(d)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-500/10">
                <Paperclip size={14} className="text-emerald-600" />
                <span className="flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{f.name}</span>
                <span className="text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700">
              <Paperclip size={14} /> Ajouter un document (PDF, Word, Excel, image — {MAX_MB} Mo max)
            </button>
            <input ref={inputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
      </div>
    </Modal>
  );
}