import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import { Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, PageHead, Select, Spinner, SuccessModal, Tabs, Textarea, convTone, errMsg, fileUrl, fmtDate, useFetch, useToast } from "./ui";

const EMPTY = { student_id: "", company_id: "", title: "", type: "internship", status: "draft", start_date: "", end_date: "", academic_tutor: "", company_tutor: "", notes: "" };
const FLOW = ["draft", "to_sign", "signed", "archived"];

export default function UniversityConventions() {
  const loc = useLocation();
  const [tab, setTab] = useState("all");
  const { data, loading, reload } = useFetch("/university/conventions");
  const { data: studs } = useFetch("/university/students", { per_page: 100, verification_status: "verified" });
  const { data: partners } = useFetch("/university/partnerships", { status: "active" });
  const { data: me } = useFetch("/university/me");
  const canWrite = ["owner", "admin", "internship_office"].includes(me?.role);

  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [toast, notify] = useToast();
  const fileRef = useRef();
  const [uploadFor, setUploadFor] = useState(null);

  useEffect(() => { if (loc.state?.studentId) setForm({ ...EMPTY, student_id: loc.state.studentId }); }, [loc.state]);

  const all = data?.conventions || [];
  const rows = tab === "all" ? all : all.filter((c) => c.status === tab);

  const save = async () => {
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== "" && !["id", "student", "company", "document_path", "updated_at"].includes(k)));
      form.id ? await api.put(`/university/conventions/${form.id}`, body) : await api.post("/university/conventions", body);
      setForm(null); reload(); setDone(form.id ? "Convention mise à jour" : "Convention créée");
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const status = (id, s) => api.put(`/university/conventions/${id}/status`, { status: s }).then(reload).catch((e) => notify(errMsg(e), "err"));
  const del = (id) => window.confirm("Supprimer cette convention ?") && api.delete(`/university/conventions/${id}`).then(reload);
  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f || !uploadFor) return;
    const fd = new FormData(); fd.append("document", f);
    try { await api.post(`/university/conventions/${uploadFor}/document`, fd); reload(); notify("Document ajouté"); } catch (er) { notify(errMsg(er), "err"); }
    e.target.value = ""; setUploadFor(null);
  };

  if (loading) return <Spinner />;
  const next = (s) => FLOW[Math.min(FLOW.indexOf(s) + 1, FLOW.length - 1)];
  const nextLabel = { draft: "Passer à signer", to_sign: "Marquer signée", signed: "Archiver" };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Conventions de stage" subtitle="Préparez le cadre documentaire université · entreprise · étudiant. La signature en ligne viendra dans une prochaine étape."
        actions={canWrite && <Btn onClick={() => setForm({ ...EMPTY })}>Nouvelle convention</Btn>} />
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={upload} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "all", label: "Toutes", count: all.length }, ...FLOW.map((s) => ({ id: s, label: LABELS.convention[s], count: all.filter((c) => c.status === s).length }))]} />

      <Card className="mt-5 overflow-hidden">
        {rows.length === 0 ? <Empty title="Aucune convention" text="Créez une convention pour un étudiant et son entreprise d'accueil, puis joignez le document final." action={canWrite && <Btn size="sm" onClick={() => setForm({ ...EMPTY })}>Nouvelle convention</Btn>} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead><tr className="border-b border-[#E4EBF1] text-[11.5px] font-semibold text-slate-400 dark:border-white/10"><th className="px-5 py-3">Convention</th><th className="px-3 py-3">Étudiant</th><th className="px-3 py-3">Entreprise</th><th className="px-3 py-3">Période</th><th className="px-3 py-3">Statut</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-[#E4EBF1] last:border-0 dark:border-white/10">
                    <td className="px-5 py-3"><p className="font-semibold text-[#0B1F33] dark:text-white">{c.title}</p><p className="text-[11.5px] text-slate-400">{LABELS.convType[c.type]}</p></td>
                    <td className="px-3 py-3">{c.student?.full_name}</td>
                    <td className="px-3 py-3 text-[#526B83] dark:text-slate-300">{c.company?.name || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-500">{c.start_date ? `${fmtDate(c.start_date)} → ${fmtDate(c.end_date)}` : "—"}</td>
                    <td className="px-3 py-3"><Badge tone={convTone[c.status]}>{LABELS.convention[c.status]}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {c.document_path && <a href={fileUrl(c.document_path)} target="_blank" rel="noreferrer"><Btn size="sm" variant="soft">Document</Btn></a>}
                        {canWrite && <>
                          <Btn size="sm" variant="ghost" onClick={() => { setUploadFor(c.id); fileRef.current?.click(); }}>{c.document_path ? "Remplacer" : "Joindre"}</Btn>
                          {c.status !== "archived" && <Btn size="sm" variant="dark" onClick={() => status(c.id, next(c.status))}>{nextLabel[c.status]}</Btn>}
                          <Btn size="sm" variant="ghost" onClick={() => setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ""])) })}>Modifier</Btn>
                          <Btn size="sm" variant="danger" onClick={() => del(c.id)}>Supprimer</Btn>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} wide title={form?.id ? "Modifier la convention" : "Nouvelle convention"} subtitle="Les informations seront reprises dans le document final."
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Annuler</Btn><Btn onClick={save} loading={busy} disabled={!form?.student_id || !form?.title}>Enregistrer</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Étudiant"><Select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Choisir…</option>{(studs?.data || []).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</Select></Field>
            <Field label="Entreprise d'accueil"><Select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}><option value="">À définir</option>{(partners?.partnerships || []).map((p) => <option key={p.company.id} value={p.company.id}>{p.company.name}</option>)}</Select></Field>
            <Field label="Intitulé" className="sm:col-span-2"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Convention de stage — Développeur web" /></Field>
            <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(LABELS.convType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Statut"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{FLOW.map((s) => <option key={s} value={s}>{LABELS.convention[s]}</option>)}</Select></Field>
            <Field label="Début"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Fin"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
            <Field label="Tuteur pédagogique"><Input value={form.academic_tutor} onChange={(e) => setForm({ ...form, academic_tutor: e.target.value })} /></Field>
            <Field label="Tuteur en entreprise"><Input value={form.company_tutor} onChange={(e) => setForm({ ...form, company_tutor: e.target.value })} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
      <SuccessModal open={!!done} title={done} onClose={() => setDone(null)} />
      {toast}
    </div>
  );
}
