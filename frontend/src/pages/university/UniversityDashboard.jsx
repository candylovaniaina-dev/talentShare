import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Avatar, Badge, Btn, Card, Empty, LABELS, PageHead, Spinner, Stat, fmtDate, placeTone, useFetch, verifTone } from "./ui";

const PIE = { searching: "#94A3B8", internship: "#3478E8", employed: "#16B8B1", continuing: "#F5B942", unavailable: "#CBD5E1" };

const tipStyle = { borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(11,31,51,.15)", fontSize: 12 };

function Gauge({ value }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="11" className="text-[#E4EBF1] dark:text-white/10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="#16B8B1" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold text-[#0B1F33] dark:text-white">{value}%</span>
        <span className="text-[11px] text-slate-400">placés</span>
      </div>
    </div>
  );
}

export default function UniversityDashboard() {
  const nav = useNavigate();
  const { data, loading, error } = useFetch("/university/dashboard");

  if (loading) return <Spinner />;
  if (error || !data) return <Card><Empty title="Impossible de charger le tableau de bord" text={error} /></Card>;

  const k = data.kpis;
  const pie = (data.placement || []).map((p) => ({ name: LABELS.placement[p.status] || p.status, value: Number(p.value), key: p.status }));

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead
        title={data.university?.name || "Tableau de bord"}
        subtitle="Vue d'ensemble de vos étudiants, de leur insertion et de votre réseau d'entreprises."
        actions={<><Btn variant="ghost" onClick={() => nav("/university?tab=profile&section=students")}>Voir les étudiants</Btn><Btn onClick={() => nav("/university/resources?tab=mine")}>Publier une ressource</Btn></>}
      />

      {k.students_pending > 0 && (
        <Link to="/university?tab=profile&section=students&verification_status=pending" className="mb-4 flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-3.5 ring-1 ring-amber-200 transition hover:bg-amber-100/70 dark:bg-amber-400/10 dark:ring-amber-400/20">
          <span className="text-[13px] font-semibold text-amber-800 dark:text-amber-200">
            {k.students_pending} demande{k.students_pending > 1 ? "s" : ""} de rattachement à vérifier
          </span>
          <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">Traiter</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Étudiants référencés" value={k.students_total} hint={`${k.students_verified} vérifiés`} />
        <Stat label="Taux de placement" value={`${k.placement_rate}%`} hint={`${k.internships} en stage · ${k.employed} en emploi`} tone="blue" />
        <Stat label="Entreprises partenaires" value={k.partners_active} hint={k.partners_pending ? `${k.partners_pending} invitation(s) en attente` : "Aucune invitation en attente"} tone="navy" />
        <Stat label="Offres diffusées" value={k.opportunities} hint={`${k.conventions_open} convention(s) à finaliser`} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Candidatures envoyées" value={k.applications_sent ?? 0} hint="par vos étudiants vérifiés" tone="blue" />
        <Stat label="Missions et stages en cours" value={k.missions_active ?? 0} hint="planifiés, en essai ou actifs" />
        <Stat label="Missions terminées" value={k.missions_completed ?? 0} hint="expériences achevées" tone="navy" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Évolution sur 12 mois</h3>
              <p className="text-[12px] text-slate-400">Nouveaux étudiants et placements</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16B8B1" stopOpacity={0.35} /><stop offset="100%" stopColor="#16B8B1" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3478E8" stopOpacity={0.3} /><stop offset="100%" stopColor="#3478E8" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EBF1" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A9BB0" }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A9BB0" }} />
                <Tooltip contentStyle={tipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" name="Étudiants" dataKey="students" stroke="#16B8B1" strokeWidth={2.5} fill="url(#gS)" />
                <Area type="monotone" name="Placements" dataKey="placements" stroke="#3478E8" strokeWidth={2.5} fill="url(#gP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Insertion professionnelle</h3>
          <p className="text-[12px] text-slate-400">Étudiants vérifiés</p>
          {pie.length === 0 ? (
            <Empty title="Pas encore de données" text="Ajoutez des étudiants pour suivre leur insertion." />
          ) : (
            <div className="mt-2 flex flex-1 flex-col items-center gap-3">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={3} stroke="none">
                      {pie.map((p) => <Cell key={p.key} fill={PIE[p.key] || "#94A3B8"} />)}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                {pie.map((p) => (
                  <li key={p.key} className="flex items-center gap-2 text-[#526B83] dark:text-slate-300">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE[p.key] }} />
                    <span className="truncate">{p.name}</span><span className="ml-auto font-semibold">{p.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Étudiants et placements par filière</h3>
          <div className="mt-3 h-60">
            {data.by_program?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_program} margin={{ left: -20, right: 8 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EBF1" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A9BB0" }} interval={0} tickFormatter={(v) => (v.length > 12 ? v.slice(0, 11) + "…" : v)} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A9BB0" }} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(22,184,177,.06)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar name="Étudiants" dataKey="students" fill="#0B2235" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar name="Placés" dataKey="placed" fill="#16B8B1" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty title="Aucune filière renseignée" text="Créez vos filières pour analyser l'insertion par formation." action={<Btn size="sm" onClick={() => nav("/university?tab=profile&section=academic")}>Configurer l'offre académique</Btn>} />}
          </div>
        </Card>

        <Card className="flex flex-col items-center p-5">
          <h3 className="self-start text-[14px] font-bold text-[#0B1F33] dark:text-white">Taux de placement</h3>
          <div className="my-4"><Gauge value={k.placement_rate} /></div>
          <div className="w-full">
            <p className="mb-2 text-[12px] font-semibold text-[#526B83] dark:text-slate-400">Entreprises qui recrutent le plus</p>
            {data.top_companies?.length ? data.top_companies.map((c) => (
              <div key={c.name} className="flex items-center justify-between border-t border-[#E4EBF1] py-2 text-[12.5px] first:border-0 dark:border-white/10">
                <span className="truncate text-[#102A43] dark:text-white">{c.name}</span>
                <Badge tone="teal">{c.value}</Badge>
              </div>
            )) : <p className="text-[12px] text-slate-400">Renseignez les placements pour voir le classement.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">À vérifier</h3>
            <Link to="/university?tab=profile&section=students&verification_status=pending" className="text-[12px] font-semibold text-[#0F9691]">Tout voir</Link>
          </div>
          {data.pending_students?.length ? data.pending_students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-t border-[#E4EBF1] py-2.5 first:border-0 dark:border-white/10">
              <Avatar name={s.full_name} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{s.full_name}</p><p className="truncate text-[11.5px] text-slate-400">{s.program?.name || s.email}</p></div>
              <span className="text-[11px] text-slate-400">{fmtDate(s.created_at)}</span>
            </div>
          )) : <p className="py-6 text-center text-[12.5px] text-slate-400">Aucune demande en attente.</p>}
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0B1F33] dark:text-white">Derniers étudiants</h3>
            <Link to="/university?tab=profile&section=students" className="text-[12px] font-semibold text-[#0F9691]">Tout voir</Link>
          </div>
          {data.recent_students?.length ? data.recent_students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-t border-[#E4EBF1] py-2.5 first:border-0 dark:border-white/10">
              <Avatar name={s.full_name} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{s.full_name}</p><p className="truncate text-[11.5px] text-slate-400">{s.program?.name || "Sans filière"}</p></div>
              <Badge tone={verifTone[s.verification_status]}>{LABELS.verification[s.verification_status]}</Badge>
              <Badge tone={placeTone[s.placement_status]}>{LABELS.placement[s.placement_status]}</Badge>
            </div>
          )) : <p className="py-6 text-center text-[12.5px] text-slate-400">Aucun étudiant référencé pour l'instant.</p>}
        </Card>
      </div>
    </div>
  );
}
