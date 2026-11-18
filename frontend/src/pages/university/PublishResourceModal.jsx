import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Check, Search, Send, X } from "lucide-react";
import api from "../../services/api";
import { Avatar, Btn, Field, Input, LABELS, Modal, Select, SuccessModal, Textarea, cx, errMsg, useDebounced, useFetch, useToast } from "./ui";

const TYPES = ["stage", "alternance", "premier_emploi", "mission"];

/**
 * Publication d'une ressource : un groupe d'étudiants vérifiés + compétences, visible des entreprises.
 * preset: { type, title, description, skills, target_company_id, target_company_name, resource_request_id }
 */
export default function PublishResourceModal({ open, onClose, preset, onPublished }) {
  const empty = { type: "stage", title: "", description: "", skills: [], available_from: "", duration_months: "", deadline: "", target_company_id: "" };
  const [f, setF] = useState(empty);
  const [skillInput, setSkillInput] = useState("");
  const [picked, setPicked] = useState({});           // id -> étudiant
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [toast, notify] = useToast();

  const { data: students, loading } = useFetch(open ? "/university/students" : null, { verification_status: "verified", per_page: 100, search: q || undefined });
  const { data: acad } = useFetch(open ? "/university/academic" : null);
  const { data: partners } = useFetch(open ? "/university/partnerships" : null, { status: "active" });

  useEffect(() => {
    if (open) { setF({ ...empty, ...(preset || {}), target_company_id: preset?.target_company_id || "", skills: preset?.skills || [] }); setPicked({}); setSearch(""); setSkillInput(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = students?.data || [];
  const suggestions = useMemo(() => {
    const all = (acad?.programs || []).flatMap((p) => p.skills || []);
    return [...new Set(all)].filter((s) => !f.skills.includes(s)).slice(0, 10);
  }, [acad, f.skills]);
  const pickedList = Object.values(picked);
  const activePartners = (partners?.partnerships || []).filter((p) => p.status === "active");

  const toggle = (s) => setPicked((p) => { const n = { ...p }; if (n[s.id]) delete n[s.id]; else n[s.id] = s; return n; });
  const allOn = rows.length > 0 && rows.every((s) => picked[s.id]);
  const toggleAll = () => setPicked((p) => { const n = { ...p }; rows.forEach((s) => { if (allOn) delete n[s.id]; else n[s.id] = s; }); return n; });
  const addSkill = (v) => { const t = v.trim().replace(/,$/, ""); if (t && !f.skills.includes(t) && f.skills.length < 20) setF((s) => ({ ...s, skills: [...s.skills, t] })); setSkillInput(""); };

  const submit = async () => {
    setBusy(true);
    try {
      const body = {
        title: f.title, type: f.type, description: f.description || null, skills: f.skills,
        available_from: f.available_from || null, duration_months: f.duration_months || null, deadline: f.deadline || null,
        target_company_id: f.target_company_id || null, resource_request_id: preset?.resource_request_id || null,
        student_ids: pickedList.map((s) => s.id),
      };
      const { data } = await api.post("/university/resources", body);
      setDone({ count: pickedList.length, notified: data.notified_companies });
      onClose();
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };

  const valid = f.title.trim().length > 2 && pickedList.length > 0;

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl" icon={Briefcase} title="Publier une ressource"
        subtitle="Proposez un groupe d'étudiants vérifiés avec leurs compétences : les entreprises concernées sont notifiées automatiquement."
        footer={<><span className="mr-auto hidden self-center text-[12px] text-slate-400 sm:block">{pickedList.length} étudiant{pickedList.length > 1 ? "s" : ""} sélectionné{pickedList.length > 1 ? "s" : ""}</span><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn onClick={submit} loading={busy} disabled={!valid}><Send size={14} className="mr-2" />Publier la ressource</Btn></>}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-[#526B83] dark:text-slate-400">Type de ressource</span>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setF({ ...f, type: t })}
                    className={cx("rounded-xl px-3 py-2.5 text-[13px] font-semibold ring-1 transition", f.type === t ? "bg-[#16B8B1]/10 text-[#0F9691] ring-[#16B8B1]" : "text-[#526B83] ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5")}>
                    {LABELS.resType[t]}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Intitulé"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="5 étudiants en développement web, stage de 3 mois" /></Field>

            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-[#526B83] dark:text-slate-400">Compétences proposées</span>
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#E4EBF1] p-2 focus-within:border-[#16B8B1] focus-within:ring-2 focus-within:ring-[#16B8B1]/20 dark:border-white/10">
                {f.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#16B8B1]/12 px-2.5 py-1 text-[12px] font-semibold text-[#0F9691]">
                    {s}<button type="button" aria-label={`Retirer ${s}`} onClick={() => setF({ ...f, skills: f.skills.filter((x) => x !== s) })}><X size={12} /></button>
                  </span>
                ))}
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder={f.skills.length ? "" : "Laravel, React, Gestion de projet…"}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); } else if (e.key === "Backspace" && !skillInput) setF((s) => ({ ...s, skills: s.skills.slice(0, -1) })); }}
                  onBlur={() => skillInput && addSkill(skillInput)}
                  className="min-w-[120px] flex-1 bg-transparent px-1.5 py-1 text-[13px] text-[#102A43] outline-none placeholder:text-slate-400 dark:text-white" />
              </div>
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-[#526B83] transition hover:bg-[#16B8B1]/12 hover:text-[#0F9691] dark:bg-white/10 dark:text-slate-300">+ {s}</button>)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Disponible dès"><Input type="date" value={f.available_from} onChange={(e) => setF({ ...f, available_from: e.target.value })} /></Field>
              <Field label="Durée (mois)"><Input type="number" min="1" max="60" value={f.duration_months} onChange={(e) => setF({ ...f, duration_months: e.target.value })} /></Field>
              <Field label="Réponse avant"><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
            </div>

            {preset?.target_company_id ? (
              <div className="rounded-xl bg-[#16B8B1]/10 px-3.5 py-2.5 text-[12.5px] text-[#0F9691]">Réponse destinée à <strong>{preset.target_company_name || "l'entreprise"}</strong>.</div>
            ) : (
              <Field label="Destinataires">
                <Select value={f.target_company_id} onChange={(e) => setF({ ...f, target_company_id: e.target.value })}>
                  <option value="">Toutes mes entreprises partenaires ({activePartners.length})</option>
                  {activePartners.map((p) => <option key={p.company?.id} value={p.company?.id}>{p.company?.name}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Contexte, niveau des étudiants, modalités d'accueil…" /></Field>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#526B83] dark:text-slate-400">Étudiants vérifiés</span>
              <button type="button" onClick={toggleAll} className="text-[12px] font-semibold text-[#0F9691] hover:underline">{allOn ? "Tout désélectionner" : "Tout sélectionner"}</button>
            </div>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un étudiant" className="!pl-9" />
            </div>
            <div className="mt-3 max-h-[380px] flex-1 space-y-1.5 overflow-y-auto pr-1">
              {loading && !students ? <p className="py-8 text-center text-[12.5px] text-slate-400">Chargement…</p>
                : rows.length === 0 ? <p className="rounded-xl bg-[#F3F6FC] px-4 py-8 text-center text-[12.5px] text-slate-400 dark:bg-white/5">Aucun étudiant vérifié. Certifiez d'abord vos étudiants depuis l'onglet Profil.</p>
                : rows.map((s) => {
                  const on = !!picked[s.id];
                  return (
                    <button key={s.id} type="button" onClick={() => toggle(s)} aria-pressed={on}
                      className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition", on ? "bg-[#16B8B1]/10 ring-[#16B8B1]" : "ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:ring-white/10 dark:hover:bg-white/5")}>
                      <Avatar name={s.full_name} size={34} />
                      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{s.full_name}</p><p className="truncate text-[11.5px] text-slate-400">{[s.program?.name, s.level].filter(Boolean).join(" · ") || "—"}</p></div>
                      <span className={cx("flex h-5 w-5 items-center justify-center rounded-full", on ? "bg-[#16B8B1] text-white" : "ring-1 ring-slate-300 dark:ring-white/20")}>{on && <Check size={12} strokeWidth={3} />}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </Modal>

      <SuccessModal open={!!done} title="Ressource publiée"
        text={done ? `${done.count} étudiant${done.count > 1 ? "s" : ""} proposé${done.count > 1 ? "s" : ""}. ${done.notified > 0 ? `${done.notified} entreprise${done.notified > 1 ? "s" : ""} notifiée${done.notified > 1 ? "s" : ""} automatiquement.` : "Elle est visible des entreprises dans « Ressources disponibles »."}` : ""}
        onClose={() => { setDone(null); onPublished?.(); }} />
      {toast}
    </>
  );
}
