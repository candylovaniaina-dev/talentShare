import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, CalendarClock, GraduationCap, Handshake, Plus, Rocket, ScrollText, Users } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, LABELS, Ring, Spinner, Stat, cx, convTone, partnerTone, reqTone, resTone, useFetch } from "./ui";
import PublishResourceModal from "./PublishResourceModal";

const TYPE_TILES = [
  { type: "stage", label: "Stage", hint: "Durée déterminée", icon: GraduationCap, dark: true },
  { type: "alternance", label: "Alternance", hint: "Rythme école / entreprise", icon: CalendarClock },
  { type: "premier_emploi", label: "Premier emploi", hint: "Jeunes diplômés", icon: Rocket },
  { type: "mission", label: "Mission", hint: "Projet ponctuel", icon: Briefcase },
];

const KIND = {
  request: { icon: Handshake, tone: "text-[#3478E8] bg-[#3478E8]/10", labels: LABELS.request, tones: reqTone },
  resource: { icon: Briefcase, tone: "text-[#0F9691] bg-[#16B8B1]/12", labels: LABELS.resStatus, tones: resTone },
  partnership: { icon: Users, tone: "text-amber-600 bg-amber-400/15", labels: LABELS.partnership, tones: partnerTone },
  convention: { icon: ScrollText, tone: "text-slate-600 bg-slate-200/70 dark:text-slate-300 dark:bg-white/10", labels: LABELS.convention, tones: convTone },
};
const FILTERS = [["all", "Tout"], ["request", "Demandes"], ["resource", "Ressources"], ["partnership", "Partenariats"], ["convention", "Conventions"]];

function timeAgo(d) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 3600) return `il y a ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

export default function UniversityHome({ me }) {
  const nav = useNavigate();
  const uni = me.university;
  const canWrite = ["owner", "admin", "internship_office"].includes(me.role);
  const { data, loading, reload } = useFetch("/university/overview");
  const [publish, setPublish] = useState(null); // null | preset
  const [filter, setFilter] = useState("all");

  if (loading && !data) return <Spinner />;
  const k = data?.kpis || {};
  const comp = data?.completeness;
  const feed = (data?.activity || []).filter((a) => filter === "all" || a.kind === filter);

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {/* Composer */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 sm:p-5">
              <Avatar name={uni.name} src={uni.logo_path} size={52} round="rounded-2xl" />
              <button type="button" disabled={!canWrite} onClick={() => setPublish({})}
                className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-full bg-[#F3F6FC] px-5 text-left text-[13.5px] text-slate-500 ring-1 ring-[#E4EBF1] transition hover:ring-[#16B8B1] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
                <span className="truncate">Quelle ressource souhaitez-vous publier ?</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#16B8B1]/15 text-[#0F9691]"><Plus size={16} /></span>
              </button>
            </div>
            <div className="grid border-t border-[#E4EBF1] sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10">
              {TYPE_TILES.map((t) => (
                <button key={t.type} type="button" disabled={!canWrite} onClick={() => setPublish({ type: t.type })}
                  className="flex items-center gap-3 border-b border-[#E4EBF1] px-5 py-4 text-left transition hover:bg-[#F8FAFD] disabled:opacity-60 sm:border-r lg:border-b-0 dark:border-white/10 dark:hover:bg-white/5">
                  <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.dark ? "bg-[#0B1F33] text-white" : "bg-[#16B8B1]/12 text-[#0F9691]")}><t.icon size={18} /></span>
                  <span><span className="block text-[13px] font-bold text-[#0B1F33] dark:text-white">{t.label}</span><span className="block text-[11.5px] text-slate-400">{t.hint}</span></span>
                </button>
              ))}
            </div>
          </Card>

          {/* Indicateurs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => nav("/university/resources?tab=mine")} className="text-left"><Stat label="Ressources publiées" value={k.resources_published ?? 0} hint="Visibles des entreprises" /></button>
            <button type="button" onClick={() => nav("/university/resources?tab=requests")} className="text-left"><Stat label="Demandes à traiter" value={k.requests_pending ?? 0} hint="Entreprises intéressées" tone="amber" /></button>
            <button type="button" onClick={() => nav("/university?tab=profile&section=students")} className="text-left"><Stat label="Étudiants vérifiés" value={k.students_verified ?? 0} hint={k.students_pending ? `${k.students_pending} en attente` : `${k.students_total ?? 0} référencés`} tone="blue" /></button>
            <button type="button" onClick={() => nav("/university/collaborations?tab=partners")} className="text-left"><Stat label="Partenaires actifs" value={k.partners_active ?? 0} hint={`${k.conventions_open ?? 0} convention(s) en cours`} tone="navy" /></button>
          </div>

          {/* Suivi d'activité */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <h3 className="text-[15px] font-bold text-[#0B1F33] dark:text-white">Suivi de votre activité</h3>
                <p className="text-[12px] text-slate-400">Ressources, demandes, partenariats et conventions issus de vos données.</p>
              </div>
              <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-[#F3F6FC] p-1 dark:bg-white/5">
                {FILTERS.map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                    className={cx("rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", filter === id ? "bg-white text-[#0B1F33] shadow-sm dark:bg-white/15 dark:text-white" : "text-[#526B83] hover:text-[#0B1F33] dark:text-slate-400")}>{label}</button>
                ))}
              </div>
            </div>
            {feed.length === 0 ? (
              <Empty title="Aucune activité pour l'instant" text="Publiez votre première ressource : les entreprises partenaires seront notifiées automatiquement."
                action={canWrite && <Btn size="sm" onClick={() => setPublish({})}>Publier une ressource</Btn>} />
            ) : (
              <ul className="divide-y divide-[#E4EBF1] border-t border-[#E4EBF1] dark:divide-white/10 dark:border-white/10">
                {feed.map((a, i) => {
                  const K = KIND[a.kind];
                  return (
                    <li key={`${a.kind}-${i}`} className="flex items-center gap-3.5 px-5 py-3.5">
                      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", K.tone)}><K.icon size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F9691]">{a.label}{a.sub && <span className="ml-1.5 font-medium normal-case tracking-normal text-slate-400">· {a.sub}</span>}</p>
                        <p className="truncate text-[13.5px] font-semibold text-[#0B1F33] dark:text-white">{a.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone={K.tones[a.status] || "slate"}>{K.labels[a.status] || a.status}</Badge>
                        <p className="mt-1 text-[11px] text-slate-400">{timeAgo(a.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          {comp && (
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <Ring value={comp.percent} size={72} />
                <div><p className="text-[14px] font-bold leading-snug text-[#0B1F33] dark:text-white">{comp.percent === 100 ? "Fiche complète" : "Un profil qui inspire confiance"}</p><p className="text-[12px] text-slate-400">{comp.items.filter((i) => i.done).length} sur {comp.items.length} éléments</p></div>
              </div>
              {comp.percent < 100 && (
                <ul className="mt-4 space-y-1.5">
                  {comp.items.filter((i) => !i.done).slice(0, 4).map((i) => <li key={i.key} className="flex items-center gap-2 text-[12.5px] text-[#526B83] dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{i.label}</li>)}
                </ul>
              )}
              <Link to="/university?tab=profile"><Btn variant="soft" className="mt-4 w-full">{comp.percent < 100 ? "Compléter mon profil" : "Voir mon profil"}</Btn></Link>
            </Card>
          )}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Collaborateurs</h3>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691]"><Users size={16} /></span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F3F6FC] px-4 py-3 dark:bg-white/5">
              <span className="text-[13px] text-[#526B83] dark:text-slate-300">Membres de l'équipe</span>
              <span className="text-[18px] font-bold text-[#0B1F33] dark:text-white">{k.team ?? 1}</span>
            </div>
            <Link to="/university?tab=profile&section=team"><Btn variant="ghost" className="mt-3 w-full">Gérer les accès</Btn></Link>
          </Card>
        </aside>
      </div>

      <PublishResourceModal open={publish !== null} preset={publish || {}} onClose={() => setPublish(null)} onPublished={reload} />
    </div>
  );
}
