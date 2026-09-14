import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Calendar, Clock, Building2, MessageSquare,
  User, FileText, ExternalLink, Globe, Briefcase, CheckCircle,
  Mail, Phone, Loader2, Edit3, X, Users,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  mission: "Mission", loan: "Mise à disposition",
};
const LOCATION_LABELS = { onsite: "🏢 Sur site", remote: "🏠 Télétravail", hybrid: "🔄 Hybride" };
const LEVEL_LABELS = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };
const UNIT_LABELS = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };

export default function ResourceOfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, show: showToast, close: closeToast } = useToast();

  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({
    start_at: "", end_at: "", workload_value: 100, workload_unit: "percentage",
    daily_rate: "", notes: "", requesting_company_id: "",
  });
  const [creatingMission, setCreatingMission] = useState(false);
  const [companies, setCompanies] = useState([]);

  // ✅ Choisir le layout : AppShell si connecté, sinon page publique
  const Layout = user ? AppShell : PublicOnlyLayout;

  const loadOffer = () => {
    api.get(`/resource-offers/${id}`)
      .then((res) => {
        setOffer(res.data);
        setMissionForm({
          start_at: res.data.start_at?.slice(0, 10) || "",
          end_at: res.data.end_at?.slice(0, 10) || "",
          workload_value: res.data.workload_value || 100,
          workload_unit: res.data.workload_unit || "percentage",
          daily_rate: res.data.daily_rate || "",
          notes: "",
          requesting_company_id: "",
        });
      })
      .catch(() => setError("Offre introuvable"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOffer();

    // Charge la liste des entreprises pour le dropdown emprunteur
    api.get("/companies", { params: { per_page: 100 } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCompanies(list);
      })
      .catch(console.error);
  }, [id]);

  const submitContact = async () => {
    if (!user) { navigate("/login"); return; }
    if (!message.trim()) return;

    setSending(true);
    try {
      await api.post("/conversations", {
        participant_ids: [offer.company.owner_user_id],
        body: message,
        resource_offer_id: offer.id,
      });
      setShowContactModal(false);
      setMessage("");
      showToast("✅ Message envoyé ! Retrouvez la conversation dans Messagerie.", "success");
      setTimeout(() => navigate("/messages"), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setSending(false);
    }
  };

  const submitMission = async (e) => {
    e.preventDefault();
    setCreatingMission(true);
    try {
      await api.post("/missions", {
        resource_offer_id: offer.id,
        requesting_company_id: missionForm.requesting_company_id || null,
        start_at: missionForm.start_at,
        end_at: missionForm.end_at,
        workload_value: Number(missionForm.workload_value),
        workload_unit: missionForm.workload_unit,
        daily_rate: missionForm.daily_rate === "" ? null : Number(missionForm.daily_rate),
        notes: missionForm.notes || null,
      });
      setShowMissionModal(false);
      showToast("✅ Mission créée ! En attente de l'accord du salarié.", "success");
      setTimeout(() => navigate("/missions"), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setCreatingMission(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={40} />
        </div>
      </Layout>
    );
  }

  if (error || !offer) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <p className="text-xl text-slate-400">{error || "Offre introuvable"}</p>
          <Link to="/resource-offers/browse" className="mt-4 text-navy hover:underline">
            ← Retour aux offres
          </Link>
        </div>
      </Layout>
    );
  }

  const profile = offer.profile || {};
  const company = offer.company || {};
  const talentUser = profile.user || {};
  const isOwner = user && company.owner_user_id === user.id;

  const activeMission = offer.active_mission || null;
  const displayStatus = offer.display_status || offer.status;

  const statusBanner = {
    mission_pending: { label: "⏳ Mission en attente d'accord du salarié", color: "amber" },
    mission_planned: { label: "📅 Mission acceptée — prête à démarrer", color: "blue" },
    mission_active:  { label: "🟢 Mission en cours", color: "emerald" },
    closed:          { label: "🔒 Offre clôturée", color: "rose" },
  }[displayStatus];

  const borrowerCompanies = companies.filter((c) => c.id !== company.id);

  return (
    <Layout>
      {/* PublicNavbar : SEULEMENT pour les visiteurs non connectés */}
      {!user && (
        <div className="mx-auto max-w-4xl px-6 pt-6">
          <PublicNavbar variant="light" />
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          to={isOwner ? "/resource-offers" : "/resource-offers/browse"}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy mb-6"
        >
          <ArrowLeft size={15} /> {isOwner ? "Mes offres" : "Retour aux offres"}
        </Link>

        {statusBanner && (
          <div className={`mb-4 rounded-2xl border p-4 text-sm font-medium flex items-center justify-between flex-wrap gap-3
            ${statusBanner.color === "amber"   ? "border-amber-200 bg-amber-50 text-amber-800" :
              statusBanner.color === "blue"    ? "border-blue-200 bg-blue-50 text-blue-800" :
              statusBanner.color === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                                                 "border-rose-200 bg-rose-50 text-rose-800"}`}>
            <span>{statusBanner.label}</span>
            {activeMission && (
              <Link to={`/missions/${activeMission.id}`}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold shadow-sm hover:shadow">
                Voir la mission →
              </Link>
            )}
          </div>
        )}

        {/* HEADER */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-mint">
                {MISSION_TYPES[offer.mission_type] || offer.mission_type}
              </p>
              <h1 className="mt-2 text-3xl font-bold">{offer.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                {offer.location_city && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {offer.location_city}</span>
                )}
                {offer.location_type && <span>{LOCATION_LABELS[offer.location_type]}</span>}
                {offer.daily_rate && <span className="text-mint font-semibold">💰 {offer.daily_rate}€/jour</span>}
              </div>
            </div>
            {company.name && (
              <div className="rounded-2xl bg-white/10 p-4 text-sm">
                <p className="text-xs text-slate-300 mb-1">Proposé par</p>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-mint" />
                  <span className="font-semibold">{company.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TALENT */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold mb-4">Profil du salarié</h2>
          <div className="flex items-center gap-4">
            {profile.avatar_path ? (
              <img src={`http://localhost:8000/storage/${profile.avatar_path}`} alt={talentUser.name}
                className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/20 text-xl font-bold text-navy">
                {(talentUser.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{talentUser.name}</p>
              {profile.headline && <p className="text-sm text-mint">{profile.headline}</p>}
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>}
          {profile.skills?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Compétences</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                    {s.name} · {LEVEL_LABELS[s.pivot?.level] || s.pivot?.level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CONDITIONS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Calendar size={18} /> Période</h3>
            <p className="text-sm text-slate-600">
              Du <b>{new Date(offer.start_at).toLocaleDateString("fr-FR")}</b>{" "}
              au <b>{new Date(offer.end_at).toLocaleDateString("fr-FR")}</b>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Clock size={18} /> Charge</h3>
            <p className="text-sm text-slate-600">
              <b>{offer.workload_value}</b>{UNIT_LABELS[offer.workload_unit] || "%"}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-3">
          {isOwner && displayStatus === "published" && (
            <button
              onClick={() => setShowMissionModal(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 min-w-[200px]"
            >
              <CheckCircle size={16} /> Créer la mission
            </button>
          )}

          {isOwner && activeMission && (
            <Link to={`/missions/${activeMission.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light min-w-[200px]">
              <Briefcase size={16} /> Voir la mission en cours
            </Link>
          )}

          {isOwner && (
            <>
              <Link to={`/resource-offers/${offer.id}/edit`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:border-navy">
                <Edit3 size={16} /> Modifier
              </Link>
              <Link to="/resource-offers"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:border-navy">
                ← Mes offres
              </Link>
            </>
          )}

          {!isOwner && (
            <>
              <button onClick={() => setShowContactModal(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light min-w-[200px]">
                <MessageSquare size={16} /> Contacter {company.name || "l'entreprise"}
              </button>
              <Link to="/resource-offers/browse"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:border-navy">
                ← Retour
              </Link>
            </>
          )}
        </div>
      </div>

      {/* MODAL CONTACT */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Contacter {company.name}</h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, nous sommes intéressés par ce profil..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" autoFocus />
            <div className="mt-4 flex gap-2">
              <button onClick={submitContact} disabled={!message.trim() || sending}
                className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60">
                {sending ? "Envoi..." : "Envoyer le message"}
              </button>
              <button onClick={() => setShowContactModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MISSION */}
      {showMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMissionModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-600" /> Créer une mission
              </h3>
              <button onClick={() => setShowMissionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={submitMission} className="space-y-3">
              {/* ✅ Entreprise emprunteuse */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <Users size={13} /> Entreprise emprunteuse *
                </label>
                <select
                  required
                  value={missionForm.requesting_company_id}
                  onChange={(e) => setMissionForm({ ...missionForm, requesting_company_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">— Sélectionner l'entreprise qui accueille le salarié —</option>
                  {borrowerCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `· ${c.city}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-emerald-700">
                  L'entreprise qui va accueillir {talentUser.name?.split(" ")[0] || "le salarié"} en mission.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Début</label>
                  <input type="date" required value={missionForm.start_at}
                    onChange={(e) => setMissionForm({ ...missionForm, start_at: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Fin</label>
                  <input type="date" required min={missionForm.start_at} value={missionForm.end_at}
                    onChange={(e) => setMissionForm({ ...missionForm, end_at: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Charge</label>
                  <input type="number" min="0" max="100" value={missionForm.workload_value}
                    onChange={(e) => setMissionForm({ ...missionForm, workload_value: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Unité</label>
                  <select value={missionForm.workload_unit}
                    onChange={(e) => setMissionForm({ ...missionForm, workload_unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="percentage">%</option>
                    <option value="hours_per_week">heures/semaine</option>
                    <option value="days_per_week">jours/semaine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Tarif/jour (€)</label>
                <input type="number" min="0" value={missionForm.daily_rate}
                  onChange={(e) => setMissionForm({ ...missionForm, daily_rate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Notes (optionnel)</label>
                <textarea rows={2} value={missionForm.notes}
                  onChange={(e) => setMissionForm({ ...missionForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={creatingMission || !missionForm.requesting_company_id}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {creatingMission ? "Création..." : "✅ Confirmer la mission"}
                </button>
                <button type="button" onClick={() => setShowMissionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </Layout>
  );
}

// Layout simple pour les visiteurs non connectés
function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-navy">{children}</div>;
}