import React, { useState } from "react";
import { GraduationCap, Layers3 } from "lucide-react";
import api from "../../services/api";
import {
  Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, Select, Spinner, SuccessModal,
  Textarea, errMsg, useConfirm, useFetch, useToast,
} from "./ui";

/* ============ Onglet Offre académique ============ */
export default function UniversityAcademic({ canEdit }) {
  const { data, loading, reload } = useFetch("/university/academic");
  const [toast, notify] = useToast();
  const [dept, setDept] = useState(null);   // {id?, name, ...}
  const [prog, setProg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [confirmNode, ask] = useConfirm();

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); await reload(); setDept(null); setProg(null); if (okMsg) setDone(okMsg); }
    catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const saveDept = () => run(() => (dept.id ? api.put(`/university/departments/${dept.id}`, dept) : api.post("/university/departments", dept)), dept.id ? "Département mis à jour" : "Département créé");
  const saveProg = () => run(() => {
    const body = { ...prog, skills: typeof prog.skills === "string" ? prog.skills.split(",").map((s) => s.trim()).filter(Boolean) : prog.skills };
    return prog.id ? api.put(`/university/programs/${prog.id}`, body) : api.post("/university/programs", body);
  }, prog.id ? "Filière mise à jour" : "Filière créée");
  const del = (url) => ask({ title: "Supprimer cet élément ?", text: "Cette action est définitive.", confirmLabel: "Supprimer", onYes: () => run(() => api.delete(url)) });

  if (loading) return <Spinner />;
  const depts = data?.departments || [];
  const orphans = (data?.programs || []).filter((p) => !p.department_id);

  const ProgRow = ({ p }) => (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F3F6FC] dark:hover:bg-white/5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{p.name}</p>
        <p className="truncate text-[11.5px] text-slate-400">{[LABELS.level[p.level], p.duration_years && `${p.duration_years} an${p.duration_years > 1 ? "s" : ""}`, `${p.students_count} étudiant${p.students_count > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</p>
      </div>
      {(p.skills || []).slice(0, 2).map((s) => <Badge key={s} tone="slate">{s}</Badge>)}
      {canEdit && (<><Btn variant="ghost" size="sm" onClick={() => setProg({ ...p, skills: (p.skills || []).join(", ") })}>Modifier</Btn><Btn variant="danger" size="sm" onClick={() => del(`/university/programs/${p.id}`)}>Supprimer</Btn></>)}
    </div>
  );

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setDept({ name: "", code: "", head_name: "", description: "" })}>Nouveau département</Btn>
          <Btn onClick={() => setProg({ name: "", department_id: "", level: "licence", duration_years: 3, description: "", skills: "" })}>Nouvelle filière</Btn>
        </div>
      )}
      {depts.length === 0 && orphans.length === 0 ? (
        <Card><Empty title="Aucune offre académique" text="Décrivez vos facultés, départements et filières : les entreprises sauront quels profils vous formez." /></Card>
      ) : (
        <div className="space-y-4">
          {depts.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-[#0B1F33] dark:text-white">{d.name}{d.code && <span className="ml-2 text-[12px] font-medium text-slate-400">{d.code}</span>}</h3>
                  {(d.head_name || d.description) && <p className="mt-1 text-[12.5px] text-[#526B83] dark:text-slate-400">{[d.head_name && `Responsable : ${d.head_name}`, d.description].filter(Boolean).join(" — ")}</p>}
                </div>
                {canEdit && <div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => setDept(d)}>Modifier</Btn><Btn variant="danger" size="sm" onClick={() => del(`/university/departments/${d.id}`)}>Supprimer</Btn></div>}
              </div>
              <div className="mt-3 border-t border-[#E4EBF1] pt-2 dark:border-white/10">
                {d.programs?.length ? d.programs.map((p) => <ProgRow key={p.id} p={p} />) : <p className="px-3 py-3 text-[12.5px] text-slate-400">Aucune filière dans ce département.</p>}
              </div>
            </Card>
          ))}
          {orphans.length > 0 && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-[#0B1F33] dark:text-white">Filières sans département</h3>
              <div className="mt-2">{orphans.map((p) => <ProgRow key={p.id} p={p} />)}</div>
            </Card>
          )}
        </div>
      )}

      <Modal icon={Layers3} open={!!dept} onClose={() => setDept(null)} title={dept?.id ? "Modifier le département" : "Nouveau département"} subtitle="Faculté, département ou école interne."
        footer={<><Btn variant="ghost" onClick={() => setDept(null)}>Annuler</Btn><Btn onClick={saveDept} loading={busy} disabled={!dept?.name}>Enregistrer</Btn></>}>
        {dept && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" className="sm:col-span-2"><Input value={dept.name} onChange={(e) => setDept({ ...dept, name: e.target.value })} placeholder="Faculté des Sciences" /></Field>
            <Field label="Code"><Input value={dept.code || ""} onChange={(e) => setDept({ ...dept, code: e.target.value })} /></Field>
            <Field label="Responsable"><Input value={dept.head_name || ""} onChange={(e) => setDept({ ...dept, head_name: e.target.value })} /></Field>
            <Field label="Description" className="sm:col-span-2"><Textarea value={dept.description || ""} onChange={(e) => setDept({ ...dept, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <Modal icon={GraduationCap} open={!!prog} onClose={() => setProg(null)} title={prog?.id ? "Modifier la filière" : "Nouvelle filière"} subtitle="Filière, formation ou programme." wide
        footer={<><Btn variant="ghost" onClick={() => setProg(null)}>Annuler</Btn><Btn onClick={saveProg} loading={busy} disabled={!prog?.name}>Enregistrer</Btn></>}>
        {prog && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Intitulé" className="sm:col-span-2"><Input value={prog.name} onChange={(e) => setProg({ ...prog, name: e.target.value })} placeholder="Licence en Informatique de gestion" /></Field>
            <Field label="Département"><Select value={prog.department_id || ""} onChange={(e) => setProg({ ...prog, department_id: e.target.value || null })}><option value="">Aucun</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
            <Field label="Niveau"><Select value={prog.level || ""} onChange={(e) => setProg({ ...prog, level: e.target.value })}>{Object.entries(LABELS.level).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Durée (années)"><Input type="number" min="1" max="12" value={prog.duration_years || ""} onChange={(e) => setProg({ ...prog, duration_years: e.target.value })} /></Field>
            <Field label="Compétences visées" hint="Séparées par des virgules"><Input value={prog.skills || ""} onChange={(e) => setProg({ ...prog, skills: e.target.value })} placeholder="Laravel, React, Gestion de projet" /></Field>
            <Field label="Description" className="sm:col-span-2"><Textarea value={prog.description || ""} onChange={(e) => setProg({ ...prog, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
      <SuccessModal open={!!done} title={done} text="Votre offre académique est à jour." onClose={() => setDone(null)} />
      {confirmNode}
      {toast}
    </div>
  );
}

