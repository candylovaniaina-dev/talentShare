import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  Avatar, Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, PageHead, Select, Spinner, SuccessModal,
  Textarea, errMsg, fmtDate, placeTone, useDebounced, useFetch, useToast, verifTone,
} from "./ui";
import UniversityBroadcast from "./UniversityBroadcast";

/* ---------- Tiroir détail étudiant ---------- */
function StudentDrawer({ id, onClose, onChanged, canWrite, programs }) {
  const nav = useNavigate();
  const { data, loading, reload } = useFetch(id ? `/university/students/${id}` : null);
  const [toast, notify] = useToast();
  const [place, setPlace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => { if (data?.student) { const s = data.student; setPlace({ placement_status: s.placement_status, placement_company_name: s.placement_company_name || "", placement_title: s.placement_title || "", placement_start: s.placement_start || "" }); } }, [data]);
  if (!id) return null;

  const act = async (fn, msg) => { setBusy(true); try { await fn(); await reload(); onChanged(); notify(msg); } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); } };
  const s = data?.student; const snap = data?.snapshot;
  const profile = snap?.profile;
  const slug = snap?.portfolio_slug;
  const av = snap?.availability;
  const availText = av ? (av.status || av.availability_status || av.mode || (av.is_available === true ? 'Disponible' : av.is_available === false ? 'Indisponible' : null)) : null;

  return (
    <div className="fixed inset-0 z-[55]">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-[#06141F]/50 backdrop-blur-sm" />
      <aside className="absolute bottom-3 right-3 top-3 flex w-[460px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#131E47]">
        {loading || !s ? <Spinner /> : (
          <>
            <div className="relative bg-gradient-to-br from-[#0B1F33] to-[#0F3B4A] px-6 pb-5 pt-6 text-white">
              <button onClick={onClose} className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white/70 hover:bg-white/10">Fermer</button>
              <div className="flex items-center gap-4">
                <Avatar name={s.full_name} size={56} round="rounded-2xl" />
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold">{s.full_name}</h2>
                  <p className="truncate text-[12.5px] text-white/60">{s.email || "E-mail non renseigné"}</p>
                  <div className="mt-2 flex gap-1.5"><Badge tone={verifTone[s.verification_status]}>{LABELS.verification[s.verification_status]}</Badge>{s.user_id && <Badge tone="blue">Compte TalentShare</Badge>}</div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {s.verification_status !== "verified" && canWrite && (
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:ring-amber-400/20">
                  <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-200">{s.verification_status === "pending" ? "Demande de rattachement en attente" : "Rattachement refusé"}</p>
                  {s.verification_note && <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-300">Motif : {s.verification_note}</p>}
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" loading={busy} onClick={() => act(() => api.post(`/university/students/${s.id}/verify`), "Statut étudiant certifié")}>Certifier le statut</Btn>
                    {s.verification_status === "pending" && <Btn size="sm" variant="danger" onClick={() => setRejecting(true)}>Refuser</Btn>}
                  </div>
                </div>
              )}
              {s.verification_status === "verified" && (
                <p className="rounded-xl bg-[#16B8B1]/10 px-4 py-2.5 text-[12.5px] text-[#0F9691]">Profil vérifié par votre établissement le {fmtDate(s.verified_at)}. Le badge est visible par les recruteurs.</p>
              )}

              <section>
                <h3 className="mb-2 text-[13px] font-bold text-[#0B1F33] dark:text-white">Parcours</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
                  {[["Filière", s.program?.name], ["Niveau", s.level], ["Matricule", s.student_number], ["Année universitaire", s.academic_year], ["Diplôme prévu", s.graduation_year], ["Référencé le", fmtDate(s.created_at)]].map(([k, v]) => (
                    <div key={k}><dt className="text-slate-400">{k}</dt><dd className="mt-0.5 font-medium text-[#0B1F33] dark:text-white">{v || "—"}</dd></div>
                  ))}
                </dl>
              </section>

              {s.user_id && (
                <section>
                  <h3 className="mb-2 text-[13px] font-bold text-[#0B1F33] dark:text-white">Profil et disponibilité</h3>
                  {profile ? (
                    <div className="space-y-3 text-[12.5px]">
                      {(profile.headline || profile.title) && <p className="font-medium text-[#0B1F33] dark:text-white">{profile.headline || profile.title}</p>}
                      {availText && <p className="text-[#526B83] dark:text-slate-400">Disponibilité : <span className="font-semibold text-[#0B1F33] dark:text-white">{String(availText)}</span></p>}
                      {profile.city && <p className="text-[#526B83] dark:text-slate-400">{[profile.city, profile.country].filter(Boolean).join(", ")}</p>}
                      {snap.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{snap.skills.map((k) => <Badge key={k} tone="slate">{k}</Badge>)}</div>}
                      <div className="flex gap-3 text-[12px] font-semibold text-[#0F9691]">
                        <Link to={`/talents/${s.user_id}`}>Profil public</Link>
                        {slug && <Link to={`/portfolio/${slug}`}>Portfolio</Link>}
                      </div>
                    </div>
                  ) : <p className="text-[12.5px] text-slate-400">Cet étudiant n'a pas encore complété son profil.</p>}
                  {snap?.missions?.count > 0 && (
                    <div className="mt-3 rounded-xl bg-[#F3F6FC] p-3 dark:bg-white/5">
                      <p className="mb-1 text-[12px] font-semibold text-[#526B83] dark:text-slate-300">{snap.missions.count} mission{snap.missions.count > 1 ? "s" : ""} / stage{snap.missions.count > 1 ? "s" : ""}</p>
                      {snap.missions.recent.map((m) => <p key={m.id} className="flex justify-between text-[12px] text-[#102A43] dark:text-slate-200"><span className="truncate">{m.title}</span><span className="text-slate-400">{m.status}</span></p>)}
                    </div>
                  )}
                </section>
              )}

              <section>
                <h3 className="mb-2 text-[13px] font-bold text-[#0B1F33] dark:text-white">Insertion professionnelle</h3>
                {place && (
                  <div className="space-y-3">
                    <Select disabled={!canWrite} value={place.placement_status} onChange={(e) => setPlace({ ...place, placement_status: e.target.value })}>
                      {Object.entries(LABELS.placement).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    {["internship", "employed"].includes(place.placement_status) && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Entreprise"><Input disabled={!canWrite} value={place.placement_company_name} onChange={(e) => setPlace({ ...place, placement_company_name: e.target.value })} /></Field>
                        <Field label="Poste / sujet"><Input disabled={!canWrite} value={place.placement_title} onChange={(e) => setPlace({ ...place, placement_title: e.target.value })} /></Field>
                        <Field label="Date de début"><Input type="date" disabled={!canWrite} value={place.placement_start || ""} onChange={(e) => setPlace({ ...place, placement_start: e.target.value })} /></Field>
                      </div>
                    )}
                    {canWrite && <Btn size="sm" variant="dark" loading={busy} onClick={() => act(() => api.put(`/university/students/${s.id}/placement`, { ...place, placement_start: place.placement_start || null }), "Insertion mise à jour")}>Enregistrer</Btn>}
                  </div>
                )}
              </section>

              {s.conventions?.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[13px] font-bold text-[#0B1F33] dark:text-white">Conventions</h3>
                  {s.conventions.map((c) => <p key={c.id} className="flex justify-between border-t border-[#E4EBF1] py-2 text-[12.5px] first:border-0 dark:border-white/10"><span className="truncate">{c.title}</span><Badge tone={c.status === "signed" ? "teal" : "amber"}>{LABELS.convention[c.status]}</Badge></p>)}
                </section>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#E4EBF1] px-6 py-4 dark:border-white/10">
              {s.user_id ? <Btn variant="soft" onClick={() => nav(`/messages?to=${s.user_id}`)}>Envoyer un message</Btn> : <span className="text-[11.5px] text-slate-400">Pas encore de compte TalentShare</span>}
              <Btn variant="ghost" onClick={() => nav("/university/collaborations?tab=conventions", { state: { studentId: s.id } })}>Préparer une convention</Btn>
            </div>
          </>
        )}
        <Modal open={rejecting} onClose={() => setRejecting(false)} title="Refuser le rattachement" subtitle="L'étudiant sera notifié."
          footer={<><Btn variant="ghost" onClick={() => setRejecting(false)}>Annuler</Btn><Btn variant="dark" onClick={() => { setRejecting(false); act(() => api.post(`/university/students/${s.id}/reject`, { note }), "Demande refusée"); }}>Confirmer le refus</Btn></>}>
          <Field label="Motif (optionnel)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Matricule introuvable, inscription non confirmée…" /></Field>
        </Modal>
      </aside>
      {toast}
    </div>
  );
}

/* ---------- Page ---------- */
export default function UniversityStudents() {
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [filters, setFilters] = useState({ verification_status: sp.get("verification_status") || "", placement_status: "", program_id: "" });
  const [page, setPage] = useState(1);
  const params = { search: q || undefined, page, per_page: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, loading, reload } = useFetch("/university/students", params);
  const { data: acad } = useFetch("/university/academic");
  const { data: me } = useFetch("/university/me");
  const canWrite = ["owner", "admin", "internship_office"].includes(me?.role);
  const programs = acad?.programs || [];

  const [open, setOpen] = useState(null); // "add" | "import"
  const [selected, setSelected] = useState(null);
  const [toast, notify] = useToast();
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "", student_number: "", program_id: "", level: "", academic_year: "" });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();
  const [report, setReport] = useState(null);

  useEffect(() => setPage(1), [q, filters]);
  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const add = async () => {
    setBusy(true);
    try {
      await api.post("/university/students", Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "")));
      setOpen(null); setForm({ full_name: "", email: "", student_number: "", program_id: "", level: "", academic_year: "" });
      reload(); setDone("Étudiant référencé");
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const importCsv = async () => {
    const f = fileRef.current?.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f); setBusy(true);
    try { const { data: r } = await api.post("/university/students/import", fd); setReport(r); reload(); } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };

  const rows = data?.data || [];
  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Étudiants" subtitle="Référencez vos étudiants, certifiez leur statut et suivez leur insertion."
        actions={canWrite && <>  <UniversityBroadcast programs={programs} /><Btn variant="ghost" onClick={() => { setReport(null); setOpen("import"); }}>Importer un CSV</Btn><Btn onClick={() => setOpen("add")}>Ajouter un étudiant</Btn></>} />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <Input placeholder="Rechercher un nom, un e-mail, un matricule" value={search} onChange={(e) => setSearch(e.target.value)} className="!w-full sm:!w-72" />
        <Select value={filters.verification_status} onChange={setF("verification_status")} className="!w-auto"><option value="">Tous les statuts</option>{Object.entries(LABELS.verification).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select value={filters.placement_status} onChange={setF("placement_status")} className="!w-auto"><option value="">Toute insertion</option>{Object.entries(LABELS.placement).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select value={filters.program_id} onChange={setF("program_id")} className="!w-auto"><option value="">Toutes les filières</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <span className="ml-auto text-[12px] text-slate-400">{data?.total ?? 0} résultat{(data?.total ?? 0) > 1 ? "s" : ""}</span>
      </Card>

      <Card className="overflow-hidden">
        {loading && !data ? <Spinner /> : rows.length === 0 ? (
          <Empty title="Aucun étudiant" text="Ajoutez vos étudiants un par un, importez un fichier CSV, ou attendez les demandes de rattachement." action={canWrite && <Btn size="sm" onClick={() => setOpen("add")}>Ajouter un étudiant</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E4EBF1] text-[11.5px] font-semibold text-slate-400 dark:border-white/10">
                  <th className="px-5 py-3">Étudiant</th><th className="px-3 py-3">Filière</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Insertion</th><th className="px-5 py-3 text-right">Référencé</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} onClick={() => setSelected(s.id)} className="cursor-pointer border-b border-[#E4EBF1] transition last:border-0 hover:bg-[#F3F6FC] dark:border-white/10 dark:hover:bg-white/5">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={s.full_name} /><div className="min-w-0"><p className="truncate font-semibold text-[#0B1F33] dark:text-white">{s.full_name}</p><p className="truncate text-[11.5px] text-slate-400">{s.email || s.student_number || "—"}</p></div></div></td>
                    <td className="px-3 py-3 text-[#526B83] dark:text-slate-300">{s.program?.name || "—"}{s.level && <span className="ml-1 text-slate-400">· {s.level}</span>}</td>
                    <td className="px-3 py-3"><Badge tone={verifTone[s.verification_status]}>{LABELS.verification[s.verification_status]}</Badge></td>
                    <td className="px-3 py-3"><Badge tone={placeTone[s.placement_status]}>{LABELS.placement[s.placement_status]}</Badge>{s.placement_company_name && <span className="ml-2 text-[11.5px] text-slate-400">{s.placement_company_name}</span>}</td>
                    <td className="px-5 py-3 text-right text-[12px] text-slate-400">{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[#E4EBF1] px-5 py-3 dark:border-white/10">
            <span className="text-[12px] text-slate-400">Page {data.current_page} sur {data.last_page}</span>
            <div className="flex gap-2"><Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</Btn><Btn size="sm" variant="ghost" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Suivant</Btn></div>
          </div>
        )}
      </Card>

      <Modal open={open === "add"} onClose={() => setOpen(null)} title="Référencer un étudiant" subtitle="S'il a déjà un compte TalentShare avec cet e-mail, il est rattaché et notifié automatiquement." wide
        footer={<><Btn variant="ghost" onClick={() => setOpen(null)}>Annuler</Btn><Btn onClick={add} loading={busy} disabled={!form.full_name}>Référencer</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" className="sm:col-span-2"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Matricule"><Input value={form.student_number} onChange={(e) => setForm({ ...form, student_number: e.target.value })} /></Field>
          <Field label="Filière"><Select value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}><option value="">—</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Niveau"><Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="L3, M1…" /></Field>
          <Field label="Année universitaire"><Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="2026-2027" /></Field>
        </div>
      </Modal>

      <Modal open={open === "import"} onClose={() => setOpen(null)} title="Importer des étudiants" subtitle="Fichier CSV (virgule ou point-virgule), 1 000 lignes maximum."
        footer={<><Btn variant="ghost" onClick={() => setOpen(null)}>Fermer</Btn><Btn onClick={importCsv} loading={busy}>Importer</Btn></>}>
        <p className="mb-3 rounded-xl bg-[#F3F6FC] p-3 font-mono text-[11.5px] text-[#526B83] dark:bg-white/5 dark:text-slate-300">full_name;email;student_number;program;level;academic_year</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="block w-full text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-[#16B8B1]/10 file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-[#0F9691]" />
        {report && (
          <div className="mt-4 rounded-xl bg-[#16B8B1]/10 p-4 text-[13px] text-[#0B1F33] dark:text-white">
            <p className="font-semibold">{report.created} étudiant(s) importé(s), {report.skipped} ignoré(s) (déjà référencés).</p>
            {report.errors?.length > 0 && <ul className="mt-2 list-disc pl-5 text-[12px] text-rose-600">{report.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          </div>
        )}
      </Modal>

      {selected && <StudentDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} canWrite={canWrite} programs={programs} />}
      <SuccessModal open={!!done} title={done} text="L'étudiant apparaît dans votre liste." onClose={() => setDone(null)} />
      {toast}
    </div>
  );
}
