import React, { useEffect, useState } from "react";
import { Check, Loader2, Send, Save, UserPlus } from "lucide-react";
import api from "../../services/api";
import { Modal, Field, Avatar, inputCls, btnPrimary, btnGhost, toInputDate, apiError } from "./shared";

/**
 * Entreprise A propose UN DE SES SALARIÉS à l'entreprise B.
 *  - flux 1 (direct)  : <ProposeTalentModal targetCompany={{id,name}} />
 *  - flux 2 (demande) : <ProposeTalentModal targetCompany={request.company} resourceRequest={request} />
 * props : myCompanies, targetCompany, resourceRequest?, onClose, onSaved(message)
 */
export default function ProposeTalentModal({ myCompanies = [], targetCompany, resourceRequest = null, onClose, onSaved }) {
  const companies = myCompanies.filter((c) => c.id !== targetCompany?.id);
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [employees, setEmployees] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [form, setForm] = useState({
    message: "", description: "", conditions: "",
    start_at: toInputDate(resourceRequest?.start_at), end_at: toInputDate(resourceRequest?.end_at),
    workload_percent: 100,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

   useEffect(() => {
    if (!companyId) return;
    setLoadingEmp(true); setProfileId("");
    api.get("/resource-sharing/employees", { params: { company_id: companyId } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        // On garde ceux qui ont un ID de profil professionnel
        setEmployees(list.filter(e => e.professional_profile_id)); 
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmp(false));
  }, [companyId]);
  const ok = companyId && profileId && form.message.trim().length >= 20;

  const save = async (status) => {
    setError("");
    if (status === "sent" && !ok) { setError("Choisissez un salarié et rédigez un message d'au moins 20 caractères."); return; }
    if (!profileId) { setError("Choisissez un salarié."); return; }
    setBusy(status);
    try {
      await api.post("/proposals", {
        professional_profile_id: Number(profileId),
        proposed_by_company_id: Number(companyId),
        to_company_id: targetCompany?.id || null,
        resource_request_id: resourceRequest?.id || null,
        message: form.message || null,
        description: form.description || null,
        conditions: form.conditions || null,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        workload_percent: Number(form.workload_percent) || 100,
        expires_at: form.expires_at || null,
        remote: false,
        status,
      });
      onSaved?.(status === "sent" ? `✅ Proposition envoyée à ${targetCompany?.name || "l'entreprise"}` : "Brouillon enregistré");
    } catch (e) {
      setError(apiError(e));
    } finally { setBusy(null); }
  };

  return (
    <Modal wide icon={UserPlus} title="Proposer un talent"
      subtitle={resourceRequest ? `En réponse à « ${resourceRequest.title} » · ${targetCompany?.name}` : `À ${targetCompany?.name}`}
      onClose={onClose}
      footer={<>
        <button onClick={() => save("sent")} disabled={!!busy} className={`${btnPrimary} flex-1`}>
          {busy === "sent" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer la proposition
        </button>
        <button onClick={() => save("draft")} disabled={!!busy} className={btnGhost}><Save size={14} /> Brouillon</button>
        <button onClick={onClose} className={btnGhost}>Annuler</button>
      </>}>
      <div className="space-y-4">
        {companies.length > 1 && (
          <Field label="Votre entreprise" required>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <div>
          <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Salarié proposé <span className="text-emerald-600">*</span></p>
          {loadingEmp ? <p className="text-xs text-slate-500"><Loader2 size={14} className="mr-1 inline animate-spin" /> Chargement...</p>
            : employees.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900">Aucun salarié partageable (profil professionnel requis).</p>
            : (
              <div className="grid gap-2 sm:grid-cols-2">
                {employees.map((e) => {
                  const on = Number(profileId) === e.professional_profile_id;
                  return (
                    <button type="button" key={e.id} onClick={() => setProfileId(e.professional_profile_id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${on ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10" : "border-slate-200 hover:border-emerald-300 dark:border-slate-700"}`}>
                      <Avatar name={e.name} path={e.avatar_path} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.name}</p>
                        <p className="truncate text-xs text-slate-500">{e.headline || e.position || "—"}</p>
                      </div>
                      {on && <Check size={16} className="text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Début"><input type="date" value={form.start_at} onChange={(e) => set("start_at", e.target.value)} className={inputCls} /></Field>
          <Field label="Fin"><input type="date" min={form.start_at} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Charge : ${form.workload_percent}%`}>
            <input type="range" min={10} max={100} step={5} value={form.workload_percent} onChange={(e) => set("workload_percent", e.target.value)} className="w-full accent-emerald-600" />
          </Field>
          <Field label="Réponse attendue avant le"><input type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Conditions"><textarea rows={2} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputCls} /></Field>
        <Field label="Message d'accompagnement" required hint={`${form.message.trim().length}/20 caractères minimum`}>
          <textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} className={inputCls}
            placeholder="Présentez ce profil et expliquez en quoi il répond à leur besoin..." />
        </Field>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
      </div>
    </Modal>
  );
}