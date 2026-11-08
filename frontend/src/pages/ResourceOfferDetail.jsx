import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Calendar, Clock, Building2, MessageSquare, Edit3, Globe, Handshake,
  Send, Loader2, Eye, Inbox, Wallet, FileText, Check, X, AlertCircle,
} from "lucide-react";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import {
  PageLayout, Modal, Avatar, Badge, StatusBadge, EmptyState, Spinner, Field,
  MISSION_TYPES, LOCATION_LABELS, LEVEL_LABELS, OFFER_STATUS, PROPOSAL_STATUS, VISIBILITY,
  fmtDate, durationLabel, workloadLabel, apiError, cardCls, btnPrimary, btnGhost, btnDanger, inputCls,
} from "../components/resource-sharing/shared";

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className={`${cardCls} p-4`}>
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
        <Icon size={14} className="text-emerald-600 dark:text-emerald-400" /> {label}
      </div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}

export default function ResourceOfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast, show, close } = useToast();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [propLoading, setPropLoading] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null); // { proposal, action }
  const [acting, setActing] = useState(false);

  const tab = params.get("tab") === "proposals" ? "proposals" : "details";

  const loadOffer = () =>
    api.get(`/resource-sharing/${id}`)
      .then((r) => setOffer(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); loadOffer(); /* eslint-disable-next-line */ }, [id, user]);

  useEffect(() => {
    if (!user) return;
    api.get("/companies/my/all")
      .then((r) => setMyCompanies(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(() => setMyCompanies([]));
  }, [user]);

  const loadProposals = () => {
    setPropLoading(true);
    api.get(`/resource-sharing/${id}/proposals`)
      .then((r) => setProposals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProposals([]))
      .finally(() => setPropLoading(false));
  };

  useEffect(() => { if (offer?.is_owner && tab === "proposals") loadProposals(); /* eslint-disable-next-line */ }, [offer?.is_owner, tab]);

  if (loading) return <PageLayout><Spinner label="Chargement de l'offre..." /></PageLayout>;

  if (error || !offer) {
    return (
      <PageLayout>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <AlertCircle size={30} className="text-slate-400" />
          <h1 className="mt-4 text-xl font-extrabold text-[#0B253B] dark:text-white">Offre introuvable</h1>
          <p className="mt-2 text-sm text-slate-500">Cette offre est indisponible ou vous n'y avez pas accès.</p>
          <Link to="/resource-offers/browse" className={`${btnPrimary} mt-6`}><ArrowLeft size={15} /> Retour aux offres</Link>
        </div>
      </PageLayout>
    );
  }

  const profile = offer.profile || {};
  const company = offer.company || {};
  const talent = profile.user || {};
  const isOwner = !!offer.is_owner;
  const alreadyIds = (offer.already_proposed_companies || []).map(Number);
  const eligible = myCompanies.filter((c) => c.id !== offer.company_id && !alreadyIds.includes(Number(c.id)));
  const available = offer.status === "published" && offer.display_status === "published";
  const canPropose = user && !isOwner && available && eligible.length > 0;
  const hasProposed = user && !isOwner && alreadyIds.length > 0 && eligible.length === 0;
  const displayKey = offer.display_status || offer.status;

  const submitContact = async () => {
    if (!user) { navigate("/login"); return; }
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post("/conversations", { participant_ids: [company.owner_user_id], body: message, resource_offer_id: offer.id });
      setShowContact(false); setMessage("");
      show("✅ Message envoyé !", "success");
      setTimeout(() => navigate("/messages"), 1000);
    } catch (e) { show(apiError(e), "error"); }
    finally { setSending(false); }
  };

  const respond = async () => {
    setActing(true);
    try {
      const { proposal, action } = confirm;
      await api.post(`/proposals/${proposal.id}/${action}`);
      show(action === "accept" ? "✅ Proposition acceptée — en attente de l'accord du salarié" : "Proposition refusée", "success");
      setConfirm(null);
      loadProposals(); loadOffer();
    } catch (e) { show(apiError(e), "error"); }
    finally { setActing(false); }
  };

  return (
    <PageLayout>
      <main className="min-h-screen bg-[#F4F7FA] px-3 pb-12 pt-5 dark:bg-transparent sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1100px] space-y-5">
          <Link to={isOwner ? "/resource-offers" : "/resource-offers/browse"} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400">
            <ArrowLeft size={15} /> {isOwner ? "Mes offres" : "Retour aux offres"}
          </Link>

          {/* En-tête */}
          <section className={`${cardCls} overflow-hidden`}>
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#0B253B]" />
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge cls="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{MISSION_TYPES[offer.mission_type] || offer.mission_type}</Badge>
                  {isOwner && <StatusBadge map={OFFER_STATUS} status={displayKey} />}
                  {isOwner && <Badge cls="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{VISIBILITY[offer.visibility || "public"]?.label}</Badge>}
                </div>
                <h1 className="mt-3 break-words text-2xl font-extrabold leading-tight tracking-tight text-[#0B253B] dark:text-white sm:text-3xl">{offer.title}</h1>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {offer.location_city && <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-emerald-600" /> {offer.location_city}</span>}
                  <span className="inline-flex items-center gap-1.5"><Globe size={15} className="text-emerald-600" /> {LOCATION_LABELS[offer.location_type]}</span>
                  {isOwner && <span className="inline-flex items-center gap-1.5"><Eye size={15} className="text-emerald-600" /> {offer.views_count || 0} vues</span>}
                </div>
              </div>
              {company.name && (
                <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900">
                    {company.logo_path ? <img src={`/storage/${company.logo_path}`} alt="" className="h-full w-full object-cover" /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">Entreprise prêteuse</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{company.name}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Onglets propriétaire */}
          {isOwner && (
            <div className="flex gap-1.5">
              {[["details", "Détails"], ["proposals", "Propositions reçues"]].map(([k, label]) => (
                <button key={k} onClick={() => setParams(k === "details" ? {} : { tab: k })}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === k ? "bg-[#0B253B] text-white dark:bg-emerald-500 dark:text-[#06251F]" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {tab === "proposals" && isOwner ? (
            <section className="space-y-3">
              {propLoading ? <Spinner /> : proposals.length === 0 ? (
                <EmptyState title="Aucune proposition reçue" text="Dès qu'une entreprise enverra une proposition, elle apparaîtra ici." />
              ) : proposals.map((p) => {
                const st = p.display_status || p.status;
                return (
                  <article key={p.id} className={`${cardCls} p-5`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{p.proposing_company?.name || "Entreprise"}</p>
                          <StatusBadge map={PROPOSAL_STATUS} status={st} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {fmtDate(p.start_at)} → {fmtDate(p.end_at)} · {p.workload_percent || 100}%
                          {p.days_until_expiry != null && ["sent", "viewed"].includes(st) && ` · expire dans ${p.days_until_expiry} j`}
                        </p>
                        {p.message && <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{p.message}</p>}
                        {p.documents?.length > 0 && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><FileText size={13} /> {p.documents.length} document(s)</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link to={`/proposals/${p.id}`} className={btnGhost}>Détails</Link>
                        {["sent", "viewed"].includes(st) && (
                          <>
                            <button onClick={() => setConfirm({ proposal: p, action: "decline" })} className={btnDanger}><X size={14} /> Refuser</button>
                            <button onClick={() => setConfirm({ proposal: p, action: "accept" })} className={btnPrimary}><Check size={14} /> Accepter</button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                {/* Salarié */}
                <section className={`${cardCls} p-5`}>
                  <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Le salarié</h2>
                  <div className="flex items-center gap-4">
                    <Avatar name={talent.name} path={profile.avatar_path} size={64} />
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{talent.name}</p>
                      {profile.headline && <p className="text-sm text-emerald-600 dark:text-emerald-400">{profile.headline}</p>}
                    </div>
                  </div>
                  {profile.bio && <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio}</p>}
                  {(offer.skills?.length > 0 || profile.skills?.length > 0) && (
                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="mb-2 text-xs font-bold text-slate-500">Compétences proposées</p>
                      <div className="flex flex-wrap gap-2">
                        {(offer.skills?.length ? offer.skills : profile.skills).map((s) => {
                          const lvl = (profile.skills || []).find((x) => x.id === s.id)?.pivot?.level;
                          return (
                            <span key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {s.name}{lvl && <span className="ml-1 font-normal text-slate-400">· {LEVEL_LABELS[lvl] || lvl}</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                {/* Infos clés */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoTile icon={Calendar} label="Période">
                    {fmtDate(offer.start_at)} → {fmtDate(offer.end_at)}
                    <p className="mt-0.5 text-xs font-normal text-slate-400">{durationLabel(offer.start_at, offer.end_at)}</p>
                  </InfoTile>
                  <InfoTile icon={Clock} label="Charge">{workloadLabel(offer.workload_value, offer.workload_unit)}</InfoTile>
                  <InfoTile icon={Wallet} label="Tarif">{offer.daily_rate ? `${offer.daily_rate} € / jour` : "À discuter"}</InfoTile>
                </div>

                <section className={`${cardCls} p-5`}>
                  <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Description de la mission</h2>
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{offer.description}</p>
                </section>

                {offer.conditions && (
                  <section className={`${cardCls} p-5`}>
                    <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Conditions</h2>
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{offer.conditions}</p>
                  </section>
                )}
              </div>

              {/* Actions */}
              <aside>
                <section className={`${cardCls} p-5 lg:sticky lg:top-5`}>
                  <div className="flex flex-col gap-3">
                    {isOwner && (
                      <>
                        <Link to={`/resource-offers/${offer.id}/edit`} className={btnGhost}><Edit3 size={15} /> Modifier l'offre</Link>
                        <Link to="?tab=proposals" className={btnPrimary}><Inbox size={15} /> Voir les propositions</Link>
                      </>
                    )}

                    {!isOwner && canPropose && (
                      <button onClick={() => setShowPropose(true)} className={btnPrimary}><Handshake size={16} /> Proposer une collaboration</button>
                    )}
                    {!isOwner && hasProposed && (
                      <Link to="/resource-proposals" className={btnGhost}><Check size={15} /> Proposition déjà envoyée</Link>
                    )}
                    {!isOwner && !user && (
                      <Link to="/login" className={btnPrimary}>Connectez-vous pour proposer</Link>
                    )}
                    {!isOwner && user && !available && (
                      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Cette offre n'accepte plus de propositions.</p>
                    )}
                    {!isOwner && user && available && myCompanies.length === 0 && (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900">Seule une entreprise peut envoyer une proposition.</p>
                    )}

                    {!isOwner && (
                      <button onClick={() => (user ? setShowContact(true) : navigate("/login"))} className={btnGhost}>
                        <MessageSquare size={15} /> Contacter l'entreprise
                      </button>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      {showPropose && (
        <ProposalFormModal offer={offer} companies={eligible} onClose={() => setShowPropose(false)}
          onSaved={(msg) => { setShowPropose(false); show(msg, "success"); loadOffer(); }} />
      )}

      {showContact && (
        <Modal icon={MessageSquare} title={`Contacter ${company.name}`} subtitle="Votre message ira dans la messagerie." onClose={() => setShowContact(false)}
          footer={<>
            <button onClick={submitContact} disabled={!message.trim() || sending} className={`${btnPrimary} flex-1`}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer
            </button>
            <button onClick={() => setShowContact(false)} className={btnGhost}>Annuler</button>
          </>}>
          <Field label="Message">
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} autoFocus className={inputCls}
              placeholder="Bonjour, nous sommes intéressés par ce profil..." />
          </Field>
        </Modal>
      )}

      {confirm && (
        <Modal icon={confirm.action === "accept" ? Check : X}
          title={confirm.action === "accept" ? "Accepter la proposition ?" : "Refuser la proposition ?"}
          subtitle={confirm.proposal.proposing_company?.name} onClose={() => setConfirm(null)}
          footer={<>
            <button onClick={respond} disabled={acting} className={`${confirm.action === "accept" ? btnPrimary : btnDanger} flex-1`}>
              {acting && <Loader2 size={14} className="animate-spin" />} {confirm.action === "accept" ? "Oui, accepter" : "Oui, refuser"}
            </button>
            <button onClick={() => setConfirm(null)} className={btnGhost}>Annuler</button>
          </>}>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {confirm.action === "accept"
              ? "Une mission sera créée et le salarié devra confirmer sa participation. Les autres propositions ne pourront plus être acceptées tant que cette mission existe."
              : "L'entreprise sera prévenue du refus. Cette action est définitive."}
          </p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </PageLayout>
  );
}