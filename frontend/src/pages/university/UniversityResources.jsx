import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Clock, Plus, Sparkles } from "lucide-react";
import api from "../../services/api";
import {
  Avatar, Badge, Btn, Card, Empty, LABELS, PageHead, Spinner, SuccessModal, Tabs, errMsg,
  fmtDate, reqTone, resTone, useConfirm, useFetch, useToast,
} from "./ui";
import PublishResourceModal from "./PublishResourceModal";

function Stack({ students, total }) {
  return (
    <div className="flex items-center">
      {students.slice(0, 5).map((s, i) => <span key={s.id} className={i ? "-ml-2" : ""}><Avatar name={s.name} size={30} round="rounded-full" /></span>)}
      {total > 5 && <span className="-ml-2 flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#0B1F33] px-1.5 text-[11px] font-bold text-white">+{total - 5}</span>}
    </div>
  );
}

function MyResources({ canWrite, onPublish, goRequests }) {
  const { data, loading, reload } = useFetch("/university/resources");
  const [toast, notify] = useToast();
  const [confirmNode, ask] = useConfirm();
  const offers = data?.offers || [];
  const patch = (o, status) => api.put(`/university/resources/${o.id}`, { status }).then(reload).catch((e) => notify(errMsg(e), "err"));
  const del = (o) => ask({ title: "Supprimer cette ressource ?", text: "Les demandes associées seront aussi supprimées.", confirmLabel: "Supprimer", onYes: () => api.delete(`/university/resources/${o.id}`).then(reload).catch((e) => notify(errMsg(e), "err")) });

  if (loading && !data) return <Spinner />;
  if (!offers.length) return <Card><Empty title="Aucune ressource publiée" text="Proposez un groupe d'étudiants vérifiés avec leurs compétences : les entreprises le voient et peuvent vous solliciter." action={canWrite && <Btn size="sm" onClick={() => onPublish({})}>Publier une ressource</Btn>} /></Card>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {offers.map((o) => (
        <Card key={o.id} className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5"><Badge tone="navy">{LABELS.resType[o.type]}</Badge><Badge tone={resTone[o.status]}>{LABELS.resStatus[o.status]}</Badge></div>
            {o.pending_interests > 0 && <button onClick={goRequests} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">{o.pending_interests} demande{o.pending_interests > 1 ? "s" : ""}</button>}
          </div>
          <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#0B1F33] dark:text-white">{o.title}</h3>
          {o.target_company && <p className="mt-0.5 text-[12px] text-slate-400">Pour {o.target_company.name}</p>}
          <div className="mt-3 flex items-center gap-3"><Stack students={o.students} total={o.students_count} /><span className="text-[12.5px] font-medium text-[#526B83] dark:text-slate-300">{o.students_count} étudiant{o.students_count > 1 ? "s" : ""}</span></div>
          {o.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{o.skills.slice(0, 8).map((s) => <Badge key={s} tone="slate">{s}</Badge>)}</div>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-400">
            {o.available_from && <span className="inline-flex items-center gap-1"><CalendarDays size={13} />Dès le {fmtDate(o.available_from)}</span>}
            {o.duration_months && <span className="inline-flex items-center gap-1"><Clock size={13} />{o.duration_months} mois</span>}
          </div>
          {canWrite && (
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#E4EBF1] pt-3 dark:border-white/10">
              {o.status !== "filled" && <Btn size="sm" variant="ghost" onClick={() => patch(o, o.status === "published" ? "closed" : "published")}>{o.status === "published" ? "Clôturer" : "Republier"}</Btn>}
              <Btn size="sm" variant="danger" onClick={() => del(o)}>Supprimer</Btn>
            </div>
          )}
        </Card>
      ))}
      {confirmNode}{toast}
    </div>
  );
}

function Requests({ canWrite }) {
  const { data, loading, reload } = useFetch("/university/resources/requests");
  const [toast, notify] = useToast();
  const [confirmNode, ask] = useConfirm();
  const [result, setResult] = useState(null);
  const rows = data?.requests || [];

  const accept = (r) => ask({
    title: `Accepter la demande de ${r.company?.name} ?`, danger: false, confirmLabel: "Accepter et lancer le processus",
    text: `Automatiquement : le partenariat est activé, les ${r.offer.students_count} étudiant(s) sont placés, des conventions en brouillon sont créées, et chacun est notifié.`,
    onYes: () => api.put(`/university/resources/requests/${r.id}`, { action: "accept" }).then((res) => { setResult({ company: r.company?.name, ...res.data.summary }); reload(); }).catch((e) => notify(errMsg(e), "err")),
  });
  const decline = (r) => ask({
    title: "Refuser cette demande ?", text: `${r.company?.name} sera informée.`, confirmLabel: "Refuser",
    onYes: () => api.put(`/university/resources/requests/${r.id}`, { action: "decline" }).then(reload).catch((e) => notify(errMsg(e), "err")),
  });

  if (loading && !data) return <Spinner />;
  if (!rows.length) return <Card><Empty title="Aucune demande reçue" text="Quand une entreprise s'intéresse à l'une de vos ressources, sa demande apparaît ici." /></Card>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={r.company?.name} src={r.company?.logo_url} size={46} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#0B1F33] dark:text-white">{r.company?.name} <span className="font-medium text-slate-400">souhaite accueillir</span></p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-[#0F9691]">{r.offer.title}</p>
              <p className="mt-1 text-[12px] text-slate-400">{r.offer.students_count} étudiant{r.offer.students_count > 1 ? "s" : ""} · {LABELS.resType[r.offer.type]}{r.start_date && ` · début souhaité le ${fmtDate(r.start_date)}`} · reçue le {fmtDate(r.created_at)}</p>
              {r.message && <p className="mt-3 rounded-xl bg-[#F3F6FC] px-4 py-3 text-[12.5px] leading-relaxed text-[#526B83] dark:bg-white/5 dark:text-slate-300">« {r.message} »</p>}
            </div>
            <Badge tone={reqTone[r.status]}>{LABELS.request[r.status]}</Badge>
          </div>
          {r.status === "pending" && canWrite && (
            <div className="mt-4 flex justify-end gap-2 border-t border-[#E4EBF1] pt-3 dark:border-white/10">
              <Btn size="sm" variant="ghost" onClick={() => decline(r)}>Refuser</Btn>
              <Btn size="sm" onClick={() => accept(r)}>Accepter</Btn>
            </div>
          )}
        </Card>
      ))}
      <SuccessModal open={!!result} title="Collaboration lancée" text={result ? `Votre accord avec ${result.company} est enregistré.` : ""} onClose={() => setResult(null)} cta="Terminer">
        {result && (
          <ul className="space-y-2 rounded-2xl bg-[#F3F6FC] p-4 text-[13px] text-[#0B1F33] dark:bg-white/5 dark:text-white">
            <li>✓ {result.students} étudiant{result.students > 1 ? "s" : ""} placé{result.students > 1 ? "s" : ""}</li>
            <li>✓ {result.conventions} convention{result.conventions > 1 ? "s" : ""} en brouillon créée{result.conventions > 1 ? "s" : ""}</li>
            <li>✓ {result.partnership_created ? "Partenariat activé" : "Partenariat déjà actif"}</li>
            {result.declined_others > 0 && <li>✓ {result.declined_others} autre{result.declined_others > 1 ? "s" : ""} demande{result.declined_others > 1 ? "s" : ""} informée{result.declined_others > 1 ? "s" : ""}</li>}
          </ul>
        )}
      </SuccessModal>
      {confirmNode}{toast}
    </div>
  );
}

function Needs({ canWrite, onPropose }) {
  const { data, loading } = useFetch("/university/resources/needs");
  const needs = data?.needs || [];
  if (loading && !data) return <Spinner />;
  if (!needs.length) return <Card><Empty title="Aucun besoin publié" text="Les besoins en ressources des entreprises apparaîtront ici. Vous pourrez leur proposer vos étudiants en un clic." /></Card>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {needs.map((n) => (
        <Card key={n.id} className="flex flex-col p-5">
          <div className="flex items-center gap-3">
            <Avatar name={n.company?.name} src={n.company?.logo_url} size={40} />
            <div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#0B1F33] dark:text-white">{n.company?.name || "Entreprise"}</p><p className="truncate text-[11.5px] text-slate-400">{[n.company?.sector, n.company?.city].filter(Boolean).join(" · ") || "—"}</p></div>
          </div>
          <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#0B1F33] dark:text-white">{n.title}</h3>
          {n.description && <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-[#526B83] dark:text-slate-300">{n.description}</p>}
          {n.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{n.skills.slice(0, 8).map((s) => <Badge key={s} tone="slate">{s}</Badge>)}</div>}
          {canWrite && n.company && (
            <div className="mt-4 flex justify-end border-t border-[#E4EBF1] pt-3 dark:border-white/10">
              <Btn size="sm" onClick={() => onPropose({ title: `Réponse : ${n.title}`, skills: n.skills, resource_request_id: n.id, target_company_id: n.company.id, target_company_name: n.company.name })}>
                <Sparkles size={13} className="mr-1.5" />Proposer des étudiants
              </Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function UniversityResources() {
  const [sp, setSp] = useSearchParams();
  const tab = ["needs", "mine", "requests"].includes(sp.get("tab")) ? sp.get("tab") : "mine";
  const { data: me } = useFetch("/university/me");
  const canWrite = ["owner", "admin", "internship_office"].includes(me?.role);
  const [publish, setPublish] = useState(null);
  const [key, setKey] = useState(0);
  const setTab = (t) => setSp({ tab: t });

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Besoins en ressources" subtitle="Répondez aux besoins des entreprises et publiez vos propres ressources : le reste du processus est automatique."
        actions={canWrite && <Btn onClick={() => setPublish({})}><Plus size={15} className="mr-1.5" />Publier une ressource</Btn>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "needs", label: "Besoins des entreprises" }, { id: "mine", label: "Mes ressources" }, { id: "requests", label: "Demandes reçues" }]} />
      <div className="mt-5" key={key}>
        {tab === "needs" && <Needs canWrite={canWrite} onPropose={setPublish} />}
        {tab === "mine" && <MyResources canWrite={canWrite} onPublish={setPublish} goRequests={() => setTab("requests")} />}
        {tab === "requests" && <Requests canWrite={canWrite} />}
      </div>
      <PublishResourceModal open={publish !== null} preset={publish || {}} onClose={() => setPublish(null)} onPublished={() => { setKey((k) => k + 1); setTab("mine"); }} />
    </div>
  );
}
