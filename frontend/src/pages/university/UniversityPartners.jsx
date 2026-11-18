import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Avatar, Badge, Btn, Card, Empty, Field, Modal, PageHead, Spinner, SuccessModal, Tabs, Textarea, Input, errMsg, fmtDate, partnerTone, LABELS, useDebounced, useFetch, useToast } from "./ui";
import ContextMessageButton from "../../components/messaging/ContextMessageButton";
function InviteModal({ open, onClose, onDone }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [list, setList] = useState([]);
  const [pick, setPick] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => { if (open) api.get("/university/partnerships/companies", { params: { q: dq } }).then((r) => setList(r.data.companies)).catch(() => {}); }, [open, dq]);
  useEffect(() => { if (!open) { setPick(null); setQ(""); setMessage(""); } }, [open]);

  const send = async () => {
    setBusy(true);
    try { await api.post("/university/partnerships", { company_id: pick.id, message }); onDone(); }
    catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Inviter une entreprise" subtitle="Elle recevra une demande de partenariat à accepter." wide
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn onClick={send} loading={busy} disabled={!pick}>Envoyer l'invitation</Btn></>}>
      <Input autoFocus placeholder="Rechercher une entreprise" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 grid max-h-56 gap-1.5 overflow-y-auto">
        {list.length === 0 && <p className="py-6 text-center text-[12.5px] text-slate-400">Aucune entreprise disponible.</p>}
        {list.map((c) => (
          <button key={c.id} onClick={() => setPick(c)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition ${pick?.id === c.id ? "bg-[#16B8B1]/10 ring-[#16B8B1]" : "ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:ring-white/10 dark:hover:bg-white/5"}`}>
            <Avatar name={c.name} src={c.logo_url} />
            <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{c.name}</p><p className="truncate text-[11.5px] text-slate-400">{[c.sector, c.city].filter(Boolean).join(" · ") || "—"}</p></div>
          </button>
        ))}
      </div>
      <Field label="Message (optionnel)" className="mt-4"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nous aimerions accueillir vos stagiaires et diffuser vos offres auprès de nos étudiants." /></Field>
      {toast}
    </Modal>
  );
}

export default function UniversityPartners() {
  const nav = useNavigate();
  const { data, loading, reload } = useFetch("/university/partnerships");
  const { data: me } = useFetch("/university/me");
  const canWrite = ["owner", "admin", "internship_office"].includes(me?.role);
  const [tab, setTab] = useState("active");
  const [invite, setInvite] = useState(false);
  const [done, setDone] = useState(null);
  const [toast, notify] = useToast();

  const all = data?.partnerships || [];
  const groups = { active: all.filter((p) => p.status === "active"), pending: all.filter((p) => p.status === "pending"), closed: all.filter((p) => ["declined", "ended"].includes(p.status)) };
  const act = (id, action) => api.put(`/university/partnerships/${id}`, { action }).then(() => { reload(); if (action === "accept") setDone("Partenariat confirmé"); }).catch((e) => notify(errMsg(e), "err"));

  if (loading) return <Spinner />;
  const rows = groups[tab];

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Entreprises partenaires" subtitle="Votre réseau d'entreprises qui accueillent vos étudiants et recrutent vos diplômés."
        actions={canWrite && <Btn onClick={() => setInvite(true)}>Inviter une entreprise</Btn>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "active", label: "Partenaires", count: groups.active.length }, { id: "pending", label: "Invitations", count: groups.pending.length }, { id: "closed", label: "Archivées", count: groups.closed.length }]} />

      <div className="mt-5">
        {rows.length === 0 ? (
          <Card><Empty title={tab === "active" ? "Aucun partenaire pour l'instant" : "Rien à afficher"} text={tab === "active" ? "Invitez les entreprises avec lesquelles vous collaborez pour diffuser leurs offres à vos étudiants." : undefined} action={tab === "active" && canWrite && <Btn size="sm" onClick={() => setInvite(true)}>Inviter une entreprise</Btn>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => (
              <Card key={p.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.company?.name} src={p.company?.logo_url} size={44} />
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-bold text-[#0B1F33] dark:text-white">{p.company?.name}</p><p className="truncate text-[12px] text-slate-400">{[p.company?.sector, p.company?.city].filter(Boolean).join(" · ") || "—"}</p></div>
                  <Badge tone={partnerTone[p.status]}>{LABELS.partnership[p.status]}</Badge>
                </div>
                {p.status === "active" && (
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6FC] p-3 text-center dark:bg-white/5">
                    <div><p className="text-[20px] font-bold text-[#0B1F33] dark:text-white">{p.placed_students}</p><p className="text-[11px] text-slate-400">étudiants placés</p></div>
                    <div><p className="text-[20px] font-bold text-[#0B1F33] dark:text-white">{p.offers_count}</p><p className="text-[11px] text-slate-400">offres diffusées</p></div>
                  </div>
                )}
                {p.message && <p className="mt-3 line-clamp-2 text-[12.5px] italic text-[#526B83] dark:text-slate-400">« {p.message} »</p>}
                <p className="mt-3 text-[11.5px] text-slate-400">{p.status === "active" ? `Partenaire depuis le ${fmtDate(p.started_at)}` : p.initiated_by === "company" ? "Demande reçue de l'entreprise" : "Invitation envoyée"} · {fmtDate(p.created_at)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {p.status === "active" && <><Btn size="sm" onClick={() => nav("/university/collaborations?tab=offers")}>Diffuser une offre</Btn>{canWrite && <Btn size="sm" variant="ghost" onClick={() => window.confirm("Mettre fin à ce partenariat ?") && act(p.id, "end")}>Mettre fin</Btn>}</>}
                    {p.company?.owner_user_id && (
        <ContextMessageButton 
          userId={p.company.owner_user_id} 
          context="partenariat" 
          contextId={p.id} 
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-semibold text-[#0B1F33] transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        />
      )}
                  {p.status === "pending" && canWrite && p.initiated_by === "company" && <><Btn size="sm" onClick={() => act(p.id, "accept")}>Accepter</Btn><Btn size="sm" variant="danger" onClick={() => act(p.id, "decline")}>Refuser</Btn></>}
                  {p.status === "pending" && canWrite && p.initiated_by === "university" && <Btn size="sm" variant="ghost" onClick={() => act(p.id, "decline")}>Annuler l'invitation</Btn>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InviteModal open={invite} onClose={() => setInvite(false)} onDone={() => { setInvite(false); reload(); setDone("Invitation envoyée"); }} />
      <SuccessModal open={!!done} title={done} text="L'entreprise en sera notifiée." onClose={() => setDone(null)} />
      {toast}
    </div>
  );
}
