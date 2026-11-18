import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight, BookOpen, Building2, Check, Globe, GraduationCap, Mail, MapPin, Pencil, Phone,
  UserPlus, Users, UsersRound,
} from "lucide-react";
import api from "../../services/api";
import { Avatar, Badge, Btn, Card, Embedded, Empty, LABELS, Modal, Ring, Spinner, SuccessModal, cx, errMsg, useFetch, useToast, verifTone } from "./ui";
import UniversityForm, { LocationMap } from "./UniversityForm";
import UniversityTeam from "./UniversityTeam";
import UniversityStudents from "./UniversityStudents";
import UniversityAcademic from "./UniversityAcademic";

const notifyBranding = () => window.dispatchEvent(new Event("university:updated"));

/* ============ Création de la fiche (affichée directement dans l'onglet Profil) ============ */
export function UniversityCreate({ onCreated }) {
  const [, setSp] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, notify] = useToast();

  const submit = async (body, logo) => {
    setSaving(true);
    try {
      await api.post("/university/onboarding", body);
      if (logo) {
        const fd = new FormData();
        fd.append("logo", logo);
        await api.post("/university/profile/logo", fd).catch(() => notify("Fiche créée, mais le logo n'a pas pu être envoyé. Vous pourrez l'ajouter ensuite.", "err"));
      }
      notifyBranding();
      setDone(true);
    } catch (e) { notify(errMsg(e), "err"); } finally { setSaving(false); }
  };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative mb-5 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0B1F33] via-[#0F3B4A] to-[#0B1F33] p-6 text-white sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-56 w-56 rounded-full bg-[#16B8B1]/25 blur-3xl" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-[#16B8B1]">Bienvenue sur TalentShare</p>
        <h2 className="relative mt-2 text-[22px] font-bold tracking-tight sm:text-[26px]">Créez la fiche de votre établissement</h2>
        <p className="relative mt-2 max-w-2xl text-[13.5px] leading-relaxed text-white/65">
          Une fois votre fiche publiée, vous pourrez rattacher vos étudiants, inviter votre équipe et proposer vos ressources aux entreprises.
        </p>
      </div>
      <UniversityForm onSubmit={submit} submitting={saving} submitLabel="Créer ma fiche" />
      <SuccessModal open={done} title="Votre établissement est créé"
        text="Votre fiche est enregistrée. Découvrez-la et complétez-la pour inspirer confiance aux entreprises."
        cta="Voir ma fiche" onClose={() => { setSp({ tab: "profile" }); onCreated?.(); }} />
      {toast}
    </div>
  );
}

/* ============ Briques d'affichage ============ */
function Row({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/10 text-[#0F9691] dark:text-[#16B8B1]"><Icon size={15} /></span>
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><div className="text-[13px] font-medium text-[#0B1F33] dark:text-white">{children}</div></div>
    </div>
  );
}

const ManageBtn = ({ onClick, children = "Gérer", icon }) => (
  <Btn size="sm" variant="soft" icon={icon} onClick={onClick}>{children}</Btn>
);

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#E4EBF1] dark:bg-[#131E47] dark:ring-white/10">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]"><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="text-[19px] font-bold leading-none text-[#0B1F33] dark:text-white">{value ?? "—"}</p>
        <p className="mt-1 truncate text-[11.5px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function AboutCard({ uni }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]"><Building2 size={17} /></span>
        <h3 className="text-[14.5px] font-bold text-[#0B1F33] dark:text-white">À propos</h3>
      </div>
      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#526B83] dark:text-slate-300">{uni.description || "Aucune présentation renseignée."}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Row icon={Building2} label="Type">{LABELS.uniType[uni.type] || uni.type}</Row>
        <Row icon={GraduationCap} label="Secteur d'activité">{uni.sector}</Row>
        <Row icon={Users} label="Taille">{LABELS.uniSize[uni.size]}</Row>
        <Row icon={Check} label="Création">{uni.founded_year}</Row>
        <Row icon={Check} label="Accréditation">{uni.accreditation}</Row>
      </div>
    </Card>
  );
}

function ContactCard({ uni }) {
  const address = [uni.address, uni.city, uni.region, uni.country].filter(Boolean).join(", ");
  const empty = !uni.contact_email && !uni.phone && !uni.website && !address;
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]"><Phone size={17} /></span>
        <h3 className="text-[14.5px] font-bold text-[#0B1F33] dark:text-white">Coordonnées</h3>
      </div>
      <Row icon={Mail} label="E-mail">{uni.contact_email && <a href={`mailto:${uni.contact_email}`} className="break-all text-[#0F9691] hover:underline">{uni.contact_email}</a>}</Row>
      <Row icon={Phone} label="Téléphone">{uni.phone}</Row>
      <Row icon={Globe} label="Site web">{uni.website && <a href={uni.website} target="_blank" rel="noreferrer" className="break-all text-[#0F9691] hover:underline">{uni.website}</a>}</Row>
      <Row icon={MapPin} label="Adresse">{address}</Row>
      {empty && <p className="text-[12.5px] text-slate-400">Aucune coordonnée renseignée.</p>}
    </Card>
  );
}

function MapCard({ uni }) {
  const pos = uni.latitude != null && uni.longitude != null ? [Number(uni.latitude), Number(uni.longitude)] : null;
  return (
    <Panel icon={MapPin} title="Localisation" bodyClass="px-4 pb-4">
      {pos ? (
        <>
          <LocationMap pos={pos} height={210} />
          <p className="mt-2 px-1 text-[11.5px] text-slate-400">{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>
        </>
      ) : <Empty compact icon={MapPin} title="Aucune géolocalisation" text="Modifiez la fiche pour placer l'établissement sur la carte." />}
    </Panel>
  );
}

/* ============ Colonne latérale ============ */
function CompletenessCard({ ov, loading, error, reload, goItem }) {
  const comp = ov?.completeness;
  return (
    <Card className="p-5">
      {loading && !comp ? <Spinner small />
        : error && !comp ? <ErrorState compact message={error} onRetry={reload} />
        : comp && (
          <>
            <div className="flex items-center gap-4">
              <Ring value={comp.percent} size={72} />
              <div>
                <p className="text-[14px] font-bold leading-snug text-[#0B1F33] dark:text-white">{comp.percent === 100 ? "Une fiche exemplaire" : "Une fiche qui inspire confiance"}</p>
                <p className="text-[12px] text-slate-400">Complétez votre profil</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {comp.items.map((i) => (
                <li key={i.key}>
                  <button type="button" onClick={() => !i.done && goItem(i.key)} disabled={i.done}
                    className={cx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] transition", i.done ? "bg-[#16B8B1]/10 text-[#0F9691]" : "text-[#526B83] ring-1 ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5")}>
                    <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", i.done ? "bg-[#16B8B1] text-white" : "bg-slate-100 text-slate-400 dark:bg-white/10")}>{i.done ? <Check size={12} strokeWidth={3} /> : null}</span>
                    <span className="font-medium">{i.label}</span>
                    {!i.done && <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#0F9691]">Compléter <ArrowRight size={11} /></span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
    </Card>
  );
}

function TeamCard({ uni, team, onManage }) {
  const { data, loading, error, reload } = team;
  const members = data?.members || [];
  return (
    <Panel icon={Users} title="Équipe" count={data ? members.length + 1 : undefined} action={<ManageBtn icon={UserPlus} onClick={onManage}>Gérer</ManageBtn>}>
      {loading && !data ? <Spinner small /> : error && !data ? <ErrorState compact message={error} onRetry={reload} /> : (
        <ul className="divide-y divide-[#E4EBF1] px-5 pb-2 dark:divide-white/10">
          <li className="flex items-center gap-3 py-2.5">
            <Avatar name={data?.owner?.name || uni.name} />
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{data?.owner?.name || uni.name}</p><p className="truncate text-[11.5px] text-slate-400">{data?.owner?.email}</p></div>
            <Badge tone="navy">Propriétaire</Badge>
          </li>
          {members.slice(0, 4).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{m.name}</p><p className="truncate text-[11.5px] text-slate-400">{m.email}</p></div>
              <Badge>{LABELS.role[m.role] || m.role}</Badge>
            </li>
          ))}
          {members.length === 0 && <li className="py-4 text-center text-[12.5px] text-slate-400">Invitez un collègue pour partager la gestion.</li>}
          {members.length > 4 && <li className="py-2.5 text-center text-[12px] text-slate-400">+ {members.length - 4} autre(s) collaborateur(s)</li>}
        </ul>
      )}
    </Panel>
  );
}

function StudentsCard({ students, total, onManage }) {
  const { data, loading, error, reload } = students;
  const rows = data?.data || [];
  return (
    <Panel icon={UsersRound} title="Étudiants rattachés" count={total ?? data?.total} action={<ManageBtn onClick={onManage}>Voir tout</ManageBtn>}>
      {loading && !data ? <Spinner small /> : error && !data ? <ErrorState compact message={error} onRetry={reload} /> : rows.length === 0 ? (
        <Empty compact icon={UsersRound} title="Aucun étudiant référencé" text="Ajoutez vos étudiants ou importez un fichier CSV." action={<Btn size="sm" icon={UserPlus} onClick={onManage}>Ajouter des étudiants</Btn>} />
      ) : (
        <ul className="divide-y divide-[#E4EBF1] px-5 pb-2 dark:divide-white/10">
          {rows.slice(0, 5).map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={s.full_name} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#0B1F33] dark:text-white">{s.full_name}</p><p className="truncate text-[11.5px] text-slate-400">{s.program?.name || s.email || "—"}{s.level ? ` · ${s.level}` : ""}</p></div>
              <Badge tone={verifTone[s.verification_status]}>{LABELS.verification[s.verification_status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function AcademicCard({ academic, onManage }) {
  const { data, loading, error, reload } = academic;
  const programs = data?.programs || [];
  const depts = data?.departments || [];
  return (
    <Panel icon={BookOpen} title="Offre académique" count={programs.length || undefined} action={<ManageBtn onClick={onManage}>Gérer</ManageBtn>}>
      {loading && !data ? <Spinner small /> : error && !data ? <ErrorState compact message={error} onRetry={reload} /> : programs.length === 0 ? (
        <Empty compact icon={BookOpen} title="Aucune filière" text="Décrivez vos départements et filières pour que les entreprises sachent qui vous formez." action={<Btn size="sm" icon={BookOpen} onClick={onManage}>Ajouter une filière</Btn>} />
      ) : (
        <div className="px-5 pb-4">
          <p className="mb-2 text-[11.5px] text-slate-400">{depts.length} département{depts.length > 1 ? "s" : ""}</p>
          <div className="flex flex-wrap gap-1.5">
            {programs.slice(0, 8).map((p) => <Badge key={p.id} tone="teal">{p.name}</Badge>)}
            {programs.length > 8 && <Badge>+{programs.length - 8}</Badge>}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ============ Page ============ */
const SECTIONS = {
  team:     { title: "Équipe et permissions", subtitle: "Invitez vos collègues et définissez leurs rôles.", icon: Users },
  students: { title: "Étudiants rattachés", subtitle: "Annuaire, vérification et suivi de l'insertion.", icon: UsersRound },
  academic: { title: "Offre académique", subtitle: "Départements et filières de l'établissement.", icon: BookOpen },
};

export default function UniversityProfile({ me, onChange }) {
  const [sp, setSp] = useSearchParams();
  const uni = me.university;
  const role = me.role;
  const canEdit = ["owner", "admin"].includes(role);
  const canAcademic = ["owner", "admin", "internship_office"].includes(role);

  const section = SECTIONS[sp.get("section")] ? sp.get("section") : null;

  const overview = useFetch("/university/overview");
  const team = useFetch("/university/team");
  const students = useFetch("/university/students", { per_page: 5 });
  const academic = useFetch("/university/academic");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, notify] = useToast();

  const reloadAll = () => { overview.reload(); team.reload(); students.reload(); academic.reload(); };
  const open = (s) => setSp({ tab: "profile", section: s });
  const close = () => { setSp({ tab: "profile" }); reloadAll(); };

  // un lien externe (?section=students) ouvre directement la bonne fenêtre
  useEffect(() => { if (section) reloadAll(); /* eslint-disable-next-line */ }, []);

  const save = async (body, logo) => {
    setSaving(true);
    try {
      let { data } = await api.put("/university/profile", body);
      let updated = data.university;
      if (logo) {
        const fd = new FormData();
        fd.append("logo", logo);
        ({ data } = await api.post("/university/profile/logo", fd));
        updated = data.university;
      }
      onChange(updated);
      notifyBranding();
      overview.reload();
      setEditing(false);
      setDone(true);
    } catch (e) { notify(errMsg(e), "err"); } finally { setSaving(false); }
  };

  const k = overview.data?.kpis;
  const goItem = (key) => ({ academic: () => open("academic"), team: () => open("team"), students: () => open("students") }[key] || (() => setEditing(true)))();
  const meta = section ? SECTIONS[section] : null;

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      {/* En-tête de la fiche : le overflow est sur la bannière seule pour ne pas rogner le logo */}
      <Card>
        <div className="relative h-28 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#0B1F33] via-[#0F3B4A] to-[#16B8B1]/70 sm:h-32">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex min-w-0 items-end gap-4">
            <div className="relative z-10 rounded-[26px] bg-white p-1.5 shadow-lg ring-1 ring-[#E4EBF1] dark:bg-[#131E47] dark:ring-white/10">
              <Avatar name={uni.name} src={uni.logo_path} size={92} round="rounded-[20px]" />
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-[20px] font-bold leading-tight tracking-tight text-[#0B1F33] dark:text-white sm:text-[22px]">{uni.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {uni.type && <Badge tone="teal">{LABELS.uniType[uni.type] || uni.type}</Badge>}
                {uni.size && <Badge>{LABELS.uniSize[uni.size]}</Badge>}
                {uni.city && <span className="inline-flex items-center gap-1 text-[12px] text-slate-400"><MapPin size={12} />{[uni.city, uni.region].filter(Boolean).join(", ")}</span>}
              </div>
            </div>
          </div>
          {canEdit && <Btn variant="dark" icon={Pencil} onClick={() => setEditing(true)}>Modifier la fiche</Btn>}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={UsersRound} label="Étudiants vérifiés" value={k?.students_verified} />
        <MiniStat icon={Users} label="Collaborateurs" value={k?.team} />
        <MiniStat icon={Building2} label="Entreprises partenaires" value={k?.partners_active} />
        <MiniStat icon={BookOpen} label="Ressources publiées" value={k?.resources_published} />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Colonne principale */}
        <div className="min-w-0 space-y-4">
          <AboutCard uni={uni} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ContactCard uni={uni} />
            <MapCard uni={uni} />
          </div>
          <AcademicCard academic={academic} onManage={() => open("academic")} />
        </div>

        {/* Colonne latérale */}
        <aside className="min-w-0 space-y-4">
          <CompletenessCard ov={overview.data} loading={overview.loading} error={overview.error} reload={overview.reload} goItem={goItem} />
          <TeamCard uni={uni} team={team} onManage={() => open("team")} />
          <StudentsCard students={students} total={k?.students_total} onManage={() => open("students")} />
        </aside>
      </div>

      {/* Fenêtres de gestion complètes */}
      <Modal open={!!section} onClose={close} size="xl" icon={meta?.icon} title={meta?.title} subtitle={meta?.subtitle}>
        {section === "team" && <UniversityTeam canAdmin={canEdit} />}
        {section === "students" && <Embedded.Provider value={true}><UniversityStudents /></Embedded.Provider>}
        {section === "academic" && <UniversityAcademic canEdit={canAcademic} />}
      </Modal>

      <Modal open={editing} onClose={() => setEditing(false)} size="xl" icon={Pencil} title="Modifier la fiche" subtitle="Mettez à jour les informations visibles par les entreprises et les étudiants.">
        <UniversityForm compact initial={uni} onSubmit={save} submitting={saving} submitLabel="Enregistrer les modifications" onCancel={() => setEditing(false)} />
      </Modal>
      <SuccessModal open={done} title="Fiche mise à jour" text="Vos informations ont bien été enregistrées." onClose={() => setDone(false)} />
      {toast}
    </div>
  );
}
