import React, { useState } from "react";
import api from "../../services/api";
import { Avatar, Badge, Btn, Card, Empty, Input, Modal, errMsg, partnerTone, LABELS, useDebounced, useFetch, useToast } from "../../pages/university/ui";

/** Panneau entreprise : accepter / demander un partenariat avec un établissement. À placer dans CompanyProfile.jsx ou Collaborations.jsx. */
export default function CompanyUniversityRequests() {
  const { data, reload } = useFetch("/company/university-partnerships");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(""); const dq = useDebounced(q);
  const { data: dir } = useFetch(open ? "/academic/directory" : null, { q: dq }, [open]);
  const [toast, notify] = useToast();

  const respond = (id, action) => api.put(`/company/university-partnerships/${id}`, { action }).then(() => { reload(); notify("Mis à jour"); }).catch((e) => notify(errMsg(e), "err"));
  const request = (university_id) => api.post("/company/university-partnerships", { university_id }).then(() => { setOpen(false); reload(); notify("Demande envoyée"); }).catch((e) => notify(errMsg(e), "err"));
  const rows = data?.partnerships || [];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Universités partenaires</h3><p className="text-[12px] text-slate-400">Accueillez des stagiaires et recrutez des jeunes diplômés.</p></div>
        <Btn size="sm" variant="ghost" onClick={() => setOpen(true)}>Trouver un établissement</Btn>
      </div>
      {rows.length === 0 ? <Empty title="Aucun partenariat" text="Les établissements peuvent vous inviter, ou vous pouvez les solliciter." /> : rows.map((p) => (
        <div key={p.id} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#F3F6FC] px-3.5 py-3 dark:bg-white/5">
          <Avatar name={p.university?.name} src={p.university?.logo_path} />
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{p.university?.name}</p><p className="text-[11.5px] text-slate-400">{p.university?.city}</p></div>
          <Badge tone={partnerTone[p.status]}>{LABELS.partnership[p.status]}</Badge>
          {p.status === "pending" && p.initiated_by === "university" && <><Btn size="sm" onClick={() => respond(p.id, "accept")}>Accepter</Btn><Btn size="sm" variant="danger" onClick={() => respond(p.id, "decline")}>Refuser</Btn></>}
          {p.status === "active" && <Btn size="sm" variant="ghost" onClick={() => window.confirm("Mettre fin à ce partenariat ?") && respond(p.id, "end")}>Mettre fin</Btn>}
        </div>
      ))}
      <Modal open={open} onClose={() => setOpen(false)} title="Trouver un établissement" subtitle="Envoyez une demande de partenariat.">
        <Input autoFocus placeholder="Nom ou ville" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 grid gap-1.5">
          {(dir?.universities || []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-[#E4EBF1] dark:ring-white/10"><Avatar name={u.name} src={u.logo_path} /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{u.name}</p><p className="text-[11.5px] text-slate-400">{u.city}</p></div><Btn size="sm" onClick={() => request(u.id)}>Demander</Btn></div>
          ))}
        </div>
      </Modal>
      {toast}
    </Card>
  );
}
