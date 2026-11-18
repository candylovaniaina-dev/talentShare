import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Badge, Btn, Card, Field, Input, Modal, Select, errMsg, useDebounced, useToast, LABELS, verifTone } from "../../pages/university/ui";

/** Carte étudiant : demander le rattachement à son université et suivre le statut. À placer dans Profile.jsx ou le Dashboard étudiant. */
export default function StudentUniversityLink() {
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(""); const dq = useDebounced(q);
  const [unis, setUnis] = useState([]);
  const [uni, setUni] = useState(null);
  const [detail, setDetail] = useState(null);
  const [f, setF] = useState({ program_id: "", student_number: "", level: "", academic_year: "" });
  const [busy, setBusy] = useState(false);
  const [toast, notify] = useToast();

  const load = () => api.get("/student/university").then((r) => setLinks(r.data.links)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { if (open) api.get("/academic/directory", { params: { q: dq } }).then((r) => setUnis(r.data.universities)).catch(() => {}); }, [open, dq]);
  useEffect(() => { if (uni) api.get(`/academic/directory/${uni.id}`).then((r) => setDetail(r.data)).catch(() => setDetail(null)); }, [uni]);

  const send = async () => {
    setBusy(true);
    try { await api.post("/student/university/request", { university_id: uni.id, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }); setOpen(false); setUni(null); load(); notify("Demande envoyée à l'établissement"); }
    catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const cancel = (id) => api.delete(`/student/university/${id}`).then(load).catch((e) => notify(errMsg(e), "err"));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Mon établissement</h3><p className="text-[12px] text-slate-400">Faites certifier votre statut d'étudiant pour rassurer les recruteurs.</p></div>
        <Btn size="sm" onClick={() => setOpen(true)}>{links.length ? "Ajouter" : "Me rattacher"}</Btn>
      </div>
      {links.map((l) => (
        <div key={l.id} className="mt-3 flex items-center gap-3 rounded-xl bg-[#F3F6FC] px-3.5 py-3 dark:bg-white/5">
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{l.university?.name}</p><p className="truncate text-[11.5px] text-slate-400">{[l.program?.name, l.level].filter(Boolean).join(" · ") || "Filière non précisée"}</p></div>
          <Badge tone={verifTone[l.verification_status]}>{LABELS.verification[l.verification_status]}</Badge>
          {l.verification_status === "pending" && <Btn size="sm" variant="ghost" onClick={() => cancel(l.id)}>Annuler</Btn>}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} wide title="Me rattacher à mon établissement" subtitle="Le service des stages vérifiera votre demande."
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Annuler</Btn><Btn onClick={send} loading={busy} disabled={!uni}>Envoyer la demande</Btn></>}>
        {!uni ? (
          <>
            <Input autoFocus placeholder="Rechercher votre établissement" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-3 grid max-h-64 gap-1.5 overflow-y-auto">
              {unis.map((u) => <button key={u.id} onClick={() => setUni(u)} className="rounded-xl px-3 py-2.5 text-left ring-1 ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:ring-white/10 dark:hover:bg-white/5"><p className="text-[13px] font-semibold text-[#0B1F33] dark:text-white">{u.name}</p><p className="text-[11.5px] text-slate-400">{u.city}</p></button>)}
              {unis.length === 0 && <p className="py-6 text-center text-[12.5px] text-slate-400">Aucun établissement trouvé.</p>}
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between sm:col-span-2"><p className="text-[14px] font-bold text-[#0B1F33] dark:text-white">{uni.name}</p><Btn size="sm" variant="ghost" onClick={() => { setUni(null); setDetail(null); }}>Changer</Btn></div>
            <Field label="Filière"><Select value={f.program_id} onChange={(e) => setF({ ...f, program_id: e.target.value })}><option value="">—</option>{(detail?.programs || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Matricule"><Input value={f.student_number} onChange={(e) => setF({ ...f, student_number: e.target.value })} /></Field>
            <Field label="Niveau"><Input value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} placeholder="L3, M1…" /></Field>
            <Field label="Année universitaire"><Input value={f.academic_year} onChange={(e) => setF({ ...f, academic_year: e.target.value })} placeholder="2026-2027" /></Field>
          </div>
        )}
      </Modal>
      {toast}
    </Card>
  );
}
