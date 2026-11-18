import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, PageHead, Select, Spinner, SuccessModal, Tabs, Textarea, errMsg, fmtDate, useFetch, useToast } from "./ui";

export default function UniversityOpportunities() {
  const { data, loading, reload } = useFetch("/university/opportunities");
  const { data: acad } = useFetch("/university/academic");
  const { data: partners } = useFetch("/university/partnerships", { status: "active" });
  const { data: me } = useFetch("/university/me");
  const canWrite = ["owner", "admin", "internship_office"].includes(me?.role);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("offer"); // offer | custom
  const [cands, setCands] = useState(null);
  const [f, setF] = useState({ job_offer_id: "", title: "", type: "stage", company_id: "", program_id: "", description: "", deadline: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, notify] = useToast();
  const [tab, setTab] = useState("published");

  const openModal = () => {
    setOpen(true);
    api.get("/university/opportunities/candidates").then((r) => setCands(r.data.offers)).catch(() => setCands([]));
  };
  const submit = async () => {
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
      if (mode === "custom") delete body.job_offer_id; else { delete body.title; delete body.type; }
      await api.post("/university/opportunities", body);
      setOpen(false); setF({ job_offer_id: "", title: "", type: "stage", company_id: "", program_id: "", description: "", deadline: "" }); reload(); setDone(true);
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const patch = (id, body) => api.put(`/university/opportunities/${id}`, body).then(reload).catch((e) => notify(errMsg(e), "err"));
  const remove = (id) => window.confirm("Supprimer cette diffusion ?") && api.delete(`/university/opportunities/${id}`).then(reload);

  if (loading) return <Spinner />;
  const all = data?.opportunities || [];
  const rows = all.filter((o) => (tab === "published" ? o.status === "published" : o.status !== "published"));
  const valid = mode === "offer" ? !!f.job_offer_id : f.title.trim().length > 2;

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Offres étudiantes" subtitle="Diffusez les stages et premiers emplois de vos entreprises partenaires auprès de vos étudiants vérifiés."
        actions={canWrite && <Btn onClick={openModal}>Diffuser une offre</Btn>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "published", label: "Diffusées", count: all.filter((o) => o.status === "published").length }, { id: "closed", label: "Clôturées", count: all.filter((o) => o.status !== "published").length }]} />

      <div className="mt-5">
        {rows.length === 0 ? (
          <Card><Empty title="Aucune offre ici" text="Choisissez une offre d'un partenaire ou rédigez la vôtre : vos étudiants sont notifiés." action={canWrite && tab === "published" && <Btn size="sm" onClick={openModal}>Diffuser une offre</Btn>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((o) => (
              <Card key={o.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-[#0B1F33] dark:text-white">{o.title}</h3>
                    <p className="mt-0.5 text-[12.5px] text-[#526B83] dark:text-slate-400">{o.company?.name || "Offre de l'université"}</p>
                  </div>
                  <Badge tone="blue">{LABELS.oppType[o.type] || o.type}</Badge>
                </div>
                {o.description && <p className="mt-3 line-clamp-3 text-[12.5px] text-[#526B83] dark:text-slate-400">{o.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-[11.5px] text-slate-400">
                  <span>Ciblage : {o.program?.name || "tous les étudiants"}</span>
                  <span>· Date limite : {fmtDate(o.deadline)}</span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {o.job_offer_id && <Link to={`/job-offers/${o.job_offer_id}`}><Btn size="sm" variant="soft">Voir l'offre</Btn></Link>}
                  {canWrite && (o.status === "published"
                    ? <Btn size="sm" variant="ghost" onClick={() => patch(o.id, { status: "closed" })}>Clôturer</Btn>
                    : <Btn size="sm" variant="ghost" onClick={() => patch(o.id, { status: "published" })}>Republier</Btn>)}
                  {canWrite && <Btn size="sm" variant="danger" onClick={() => remove(o.id)}>Supprimer</Btn>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Diffuser une offre" subtitle="Vos étudiants vérifiés (ou ceux d'une filière) sont notifiés." wide
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Annuler</Btn><Btn onClick={submit} loading={busy} disabled={!valid}>Diffuser</Btn></>}>
        <div className="mb-4 inline-flex rounded-full bg-[#F3F6FC] p-1 dark:bg-white/5">
          {[["offer", "Offre d'un partenaire"], ["custom", "Rédiger une offre"]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${mode === k ? "bg-[#0B1F33] text-white dark:bg-white dark:text-[#0B1F33]" : "text-[#526B83]"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "offer" ? (
            <Field label="Offre de recrutement" className="sm:col-span-2" hint={cands && cands.length === 0 ? "Aucune offre disponible : invitez d'abord des entreprises partenaires." : undefined}>
              <Select value={f.job_offer_id} onChange={(e) => setF({ ...f, job_offer_id: e.target.value })}>
                <option value="">Choisir…</option>
                {(cands || []).map((o) => <option key={o.id} value={o.id}>{o.title} — {o.company_name}</option>)}
              </Select>
            </Field>
          ) : (
            <>
              <Field label="Intitulé" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Stage de fin d'études en développement web" /></Field>
              <Field label="Type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.entries(LABELS.oppType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Field label="Entreprise partenaire"><Select value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })}><option value="">Aucune</option>{(partners?.partnerships || []).map((p) => <option key={p.company.id} value={p.company.id}>{p.company.name}</option>)}</Select></Field>
            </>
          )}
          <Field label="Filière ciblée"><Select value={f.program_id} onChange={(e) => setF({ ...f, program_id: e.target.value })}><option value="">Tous les étudiants</option>{(acad?.programs || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Date limite"><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
          <Field label="Message aux étudiants" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Précisions, conditions de candidature…" /></Field>
        </div>
      </Modal>
      <SuccessModal open={done} title="Offre diffusée" text="Vos étudiants concernés ont été notifiés." onClose={() => setDone(false)} />
      {toast}
    </div>
  );
}
