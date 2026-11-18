import React, { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import api from "../../services/api";
import { Avatar, Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, Select, Spinner, errMsg, useConfirm, useFetch, useToast } from "./ui";

const ROLES = ["admin", "internship_office", "teacher", "viewer"];

/* Permissions internes (miroir des règles du backend : requireAdmin / requireWrite) */
const PERMS = [
  { label: "Modifier la fiche et gérer l'équipe", roles: ["owner", "admin"] },
  { label: "Gérer étudiants, ressources, partenariats et conventions", roles: ["owner", "admin", "internship_office"] },
  { label: "Consulter les profils, compétences et disponibilités", roles: ["owner", "admin", "internship_office", "teacher", "viewer"] },
];
const ROLE_TEXT = {
  admin: "Accès complet, hors propriété de l'espace.",
  internship_office: "Gère les étudiants, les ressources et les conventions.",
  teacher: "Consulte les étudiants et leurs profils.",
  viewer: "Lecture seule.",
};

export default function UniversityTeam({ canAdmin }) {
  const { data, loading, reload } = useFetch("/university/team");
  const [toast, notify] = useToast();
  const [confirmNode, ask] = useConfirm();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "internship_office" });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const add = async () => {
    setBusy(true);
    try {
      const { data: d } = await api.post("/university/team", f);
      setOpen(false);
      setCreated({ email: f.email, pwd: d.temporary_password });
      setF({ name: "", email: "", role: "internship_office" });
      reload();
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const patch = (id, body) => api.put(`/university/team/${id}`, body).then(reload).catch((e) => notify(errMsg(e), "err"));
  const remove = (m) => ask({
    title: "Retirer ce membre ?", text: `${m.name} n'aura plus accès à l'espace de votre établissement.`, confirmLabel: "Retirer",
    onYes: () => api.delete(`/university/team/${m.id}`).then(reload).catch((e) => notify(errMsg(e), "err")),
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[#526B83] dark:text-slate-400">Donnez accès à votre équipe pédagogique et au service des stages, avec des droits adaptés à chaque rôle.</p>
        {canAdmin && <Btn onClick={() => setOpen(true)}><UserPlus size={15} className="mr-2" />Ajouter un collaborateur</Btn>}
      </div>

      <Card className="divide-y divide-[#E4EBF1] dark:divide-white/10">
        {data?.owner && (
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Avatar name={data.owner.name} />
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-[#0B1F33] dark:text-white">{data.owner.name}</p><p className="text-[12px] text-slate-400">{data.owner.email}</p></div>
            <Badge tone="navy">Propriétaire</Badge>
          </div>
        )}
        {data?.members?.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{m.name}</p><p className="truncate text-[12px] text-slate-400">{m.email}</p></div>
            {canAdmin ? (
              <Select value={m.role} onChange={(e) => patch(m.id, { role: e.target.value })} className="!w-auto !py-1.5 text-[12px]">
                {ROLES.map((r) => <option key={r} value={r}>{LABELS.role[r]}</option>)}
              </Select>
            ) : <Badge>{LABELS.role[m.role]}</Badge>}
            <Badge tone={m.status === "active" ? "teal" : "rose"}>{m.status === "active" ? "Actif" : "Révoqué"}</Badge>
            {canAdmin && (
              <>
                <Btn variant="ghost" size="sm" onClick={() => patch(m.id, { status: m.status === "active" ? "revoked" : "active" })}>{m.status === "active" ? "Révoquer" : "Réactiver"}</Btn>
                <Btn variant="danger" size="sm" onClick={() => remove(m)}>Retirer</Btn>
              </>
            )}
          </div>
        ))}
        {!data?.members?.length && <Empty title="Aucun autre collaborateur" text="Invitez un collègue pour partager la gestion des étudiants, des ressources et des partenariats." />}
      </Card>

      <Card className="overflow-x-auto p-5">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-[#0F9691]" /><h3 className="text-[13.5px] font-bold text-[#0B1F33] dark:text-white">Rôles et permissions</h3></div>
        <table className="w-full min-w-[560px] text-left text-[12.5px]">
          <thead>
            <tr className="text-[11.5px] font-semibold text-slate-400">
              <th className="py-2 pr-3">Permission</th>
              {["owner", ...ROLES].map((r) => <th key={r} className="px-2 py-2 text-center">{LABELS.role[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMS.map((p) => (
              <tr key={p.label} className="border-t border-[#E4EBF1] dark:border-white/10">
                <td className="py-2.5 pr-3 text-[#102A43] dark:text-slate-200">{p.label}</td>
                {["owner", ...ROLES].map((r) => (
                  <td key={r} className="px-2 py-2.5 text-center">{p.roles.includes(r) ? <span className="font-bold text-[#16B8B1]" aria-label="Autorisé">✓</span> : <span className="text-slate-300" aria-label="Non autorisé">—</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} icon={UserPlus} title="Ajouter un collaborateur" subtitle="Un compte est créé s'il n'existe pas encore ; un lien de connexion est envoyé par e-mail."
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Annuler</Btn><Btn onClick={add} loading={busy} disabled={!f.name || !f.email}>Ajouter</Btn></>}>
        <div className="space-y-4">
          <Field label="Nom complet"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-[#526B83] dark:text-slate-400">Rôle</span>
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => setF({ ...f, role: r })}
                  className={`rounded-xl px-3.5 py-2.5 text-left ring-1 transition ${f.role === r ? "bg-[#16B8B1]/10 ring-[#16B8B1]" : "ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:ring-white/10 dark:hover:bg-white/5"}`}>
                  <p className="text-[13px] font-semibold text-[#0B1F33] dark:text-white">{LABELS.role[r]}</p>
                  <p className="text-[11.5px] text-slate-400">{ROLE_TEXT[r]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={!!created} onClose={() => setCreated(null)} icon={UserPlus} title="Collaborateur ajouté" footer={<Btn onClick={() => setCreated(null)}>Terminé</Btn>}>
        <p className="text-[13px] text-[#526B83] dark:text-slate-300">{created?.email} peut désormais accéder à l'espace.</p>
        {created?.pwd && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:ring-amber-400/20">
            <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-200">Mot de passe temporaire (affiché une seule fois)</p>
            <p className="mt-1 select-all font-mono text-[15px] font-bold text-[#0B1F33] dark:text-white">{created.pwd}</p>
          </div>
        )}
      </Modal>
      {confirmNode}
      {toast}
    </div>
  );
}
