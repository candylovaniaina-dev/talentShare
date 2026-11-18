import React, { useState } from "react";
import { CalendarDays, Clock, GraduationCap, Send } from "lucide-react";
import api from "../../services/api";
import { Avatar, Badge, Btn, Card, Empty, Field, Input, LABELS, Modal, Select, Spinner, SuccessModal, Textarea, errMsg, fmtDate, reqTone, useConfirm, useFetch, useToast } from "../../pages/university/ui";
import { Link } from "react-router-dom";

/**
 * Côté entreprise : ressources (groupes d'étudiants) proposées par les universités.
 * À intégrer dans « Ressources disponibles » ou via la route /resource-offers/universities.
 */
export default function CompanyUniversityResources() {
  const [type, setType] = useState("");
  const { data, loading, reload } = useFetch("/company/university-resources", { type: type || undefined });
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ message: "", start_date: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, notify] = useToast();
  const [confirmNode, ask] = useConfirm();
  const offers = data?.offers || [];

  const send = async () => {
    setBusy(true);
    try {
      await api.post(`/company/university-resources/${target.id}/interest`, { message: form.message || null, start_date: form.start_date || null });
      setTarget(null); setForm({ message: "", start_date: "" }); setSent(true); reload();
    } catch (e) { notify(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const withdraw = (o) => ask({ title: "Retirer votre demande ?", text: "L'université ne la verra plus.", confirmLabel: "Retirer", onYes: () => api.delete(`/company/university-resources/${o.id}/interest`).then(reload).catch((e) => notify(errMsg(e), "err")) });

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-[#0B1F33] dark:text-white">Ressources des universités</h2>
          <p className="text-[12.5px] text-[#526B83] dark:text-slate-400">Des étudiants vérifiés, avec leurs compétences, prêts à rejoindre vos équipes.</p>
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="!w-auto"><option value="">Tous les types</option>{Object.entries(LABELS.resType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
      </div>

      {loading && !data ? <Spinner /> : offers.length === 0 ? (
        <Card><Empty title="Aucune ressource pour l'instant" text="Les universités partenaires publient ici leurs groupes d'étudiants disponibles." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {offers.map((o) => (
            <Card key={o.id} className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar name={o.university?.name} src={o.university?.logo_path} size={40} />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold text-[#0B1F33] dark:text-white">{o.university?.name}</p><p className="truncate text-[11.5px] text-slate-400">{o.university?.city || "—"}</p></div>
                <Badge tone="navy">{LABELS.resType[o.type]}</Badge>
              </div>
              <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#0B1F33] dark:text-white">{o.title}</h3>
              {o.description && <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-[#526B83] dark:text-slate-300">{o.description}</p>}
              {o.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{o.skills.slice(0, 8).map((s) => <Badge key={s} tone="teal">{s}</Badge>)}</div>}

              <div className="mt-4 space-y-1.5">
                {o.students.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 rounded-xl bg-[#F3F6FC] px-3 py-2 dark:bg-white/5">
                    <Avatar name={s.name} size={28} round="rounded-full" />
                    <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-semibold text-[#0B1F33] dark:text-white">{s.name}</p><p className="truncate text-[11px] text-slate-400">{[s.program, s.level].filter(Boolean).join(" · ") || "—"}</p></div>
                    {s.user_id && <Link to={`/talents/${s.user_id}`} className="text-[11.5px] font-semibold text-[#0F9691]">Profil</Link>}
                  </div>
                ))}
                {o.students_count > 4 && <p className="px-1 text-[11.5px] text-slate-400">+ {o.students_count - 4} autre{o.students_count - 4 > 1 ? "s" : ""} étudiant{o.students_count - 4 > 1 ? "s" : ""}</p>}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-400">
                <span className="inline-flex items-center gap-1"><GraduationCap size={13} />{o.students_count} étudiant{o.students_count > 1 ? "s" : ""}</span>
                {o.available_from && <span className="inline-flex items-center gap-1"><CalendarDays size={13} />Dès le {fmtDate(o.available_from)}</span>}
                {o.duration_months && <span className="inline-flex items-center gap-1"><Clock size={13} />{o.duration_months} mois</span>}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#E4EBF1] pt-3 dark:border-white/10">
                {o.my_interest && <Badge tone={reqTone[o.my_interest]}>{LABELS.request[o.my_interest]}</Badge>}
                {o.my_interest === "pending" && <Btn size="sm" variant="ghost" onClick={() => withdraw(o)}>Retirer</Btn>}
                {(!o.my_interest || ["declined", "withdrawn"].includes(o.my_interest)) && <Btn size="sm" onClick={() => setTarget(o)}><Send size={13} className="mr-1.5" />Je suis intéressé</Btn>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} icon={Send} title="Accueillir ces étudiants" subtitle={target ? `${target.title} — ${target.university?.name}` : ""}
        footer={<><Btn variant="ghost" onClick={() => setTarget(null)}>Annuler</Btn><Btn onClick={send} loading={busy}>Envoyer la demande</Btn></>}>
        <div className="space-y-4">
          <p className="rounded-xl bg-[#16B8B1]/10 px-4 py-3 text-[12.5px] leading-relaxed text-[#0F9691]">Si l'université accepte, le partenariat est activé automatiquement et les conventions sont préparées pour chaque étudiant.</p>
          <Field label="Date de début souhaitée"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="Message (optionnel)"><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Présentez votre besoin, les missions confiées, l'encadrement prévu…" /></Field>
        </div>
      </Modal>
      <SuccessModal open={sent} title="Demande envoyée" text="L'université a été notifiée. Vous serez prévenu dès sa réponse." onClose={() => setSent(false)} />
      {confirmNode}{toast}
    </div>
  );
}
