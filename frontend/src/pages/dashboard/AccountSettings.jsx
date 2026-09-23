// frontend/src/pages/dashboard/AccountSettings.jsx
import React, { useState, useEffect } from "react";
import {
  User, Lock, Shield, AlertTriangle, Mail, Phone, Globe,
  Eye, EyeOff, Check, X, Loader2, Camera, Save, Key, Bell, Trash2,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = [
  { id: "general",        label: "Général",          icon: User,          desc: "Nom, email, téléphone" },
  { id: "security",       label: "Sécurité",         icon: Lock,          desc: "Mot de passe, sessions" },
  { id: "privacy",        label: "Confidentialité",  icon: Shield,        desc: "Visibilité, données" },
  { id: "notifications",  label: "Notifications",    icon: Bell,          desc: "Emails et alertes" },
  { id: "danger",         label: "Zone dangereuse",  icon: AlertTriangle, desc: "Désactiver, supprimer", danger: true },
];

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [section, setSection] = useState("general");

  return (
    <AppShell>
      {/* ===== HEADER ===== */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Espace personnel
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">Paramètres du compte</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gérez vos informations personnelles et la sécurité de votre compte.
        </p>
      </div>

      {/* ===== LAYOUT 2 COLONNES ===== */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ===== MENU GAUCHE ===== */}
        <aside className="lg:sticky lg:top-24 self-start">
          <nav className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
            {SECTIONS.map(({ id, label, icon: Icon, desc, danger }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                    active
                      ? danger
                        ? "bg-rose-500/15 border border-rose-500/30"
                        : "bg-emerald-500/15 border border-emerald-500/30"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? danger
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-emerald-500/20 text-emerald-300"
                        : danger
                          ? "bg-white/5 text-rose-400"
                          : "bg-white/5 text-slate-400"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-200"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{desc}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ===== CONTENU DROITE ===== */}
        <div className="min-w-0">
          {section === "general"       && <GeneralSection user={user} refreshUser={refreshUser} />}
          {section === "security"      && <SecuritySection />}
          {section === "privacy"       && <PrivacySection user={user} />}
          {section === "notifications" && <NotificationsSection />}
          {section === "danger"        && <DangerSection user={user} />}
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   SECTION : GÉNÉRAL
============================================================ */
function GeneralSection({ user, refreshUser }) {
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
    name:       user?.name       || "",
    phone:      user?.phone      || "",
    country:    user?.country    || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.patch("/account/profile", form);
      await refreshUser?.();
      setMessage({ type: "success", text: "Informations mises à jour ✅" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur serveur" });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Photo trop lourde (max 5 Mo)" });
      return;
    }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/profile/avatar", fd);
      await refreshUser?.();
      setMessage({ type: "success", text: "Photo mise à jour ✅" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur upload" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte photo */}
      <Card
        icon={Camera}
        title="Photo de profil"
        subtitle="Elle apparaît sur vos propositions et votre portfolio."
      >
        <div className="flex flex-wrap items-center gap-4">
          {user?.avatar_path ? (
            <img
              src={`http://localhost:8000/storage/${user.avatar_path}`}
              alt={user.name}
              className="h-20 w-20 rounded-2xl border-2 border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-[#0A1229]">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300">
            {uploadingAvatar ? "Envoi..." : "Changer la photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
              disabled={uploadingAvatar}
            />
          </label>
        </div>
      </Card>

      {/* Carte infos */}
      <Card
        icon={User}
        title="Informations personnelles"
        subtitle="Ces informations restent privées et ne sont jamais partagées sans votre accord."
      >
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className={inputCls}
                placeholder="Sarah"
              />
            </Field>
            <Field label="Nom">
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className={inputCls}
                placeholder="Andrianina"
              />
            </Field>
          </div>

          <Field label="Nom d'affichage" hint="Visible par les autres utilisateurs">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="Sarah Andrianina"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone" icon={Phone}>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
                placeholder="+261 34 12 345 67"
              />
            </Field>
            <Field label="Pays" icon={Globe}>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={inputCls}
                placeholder="Madagascar"
              />
            </Field>
          </div>

          <Field label="Email" icon={Mail} hint="Non modifiable — contactez le support">
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className={`${inputCls} opacity-60 cursor-not-allowed`}
            />
          </Field>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION : SÉCURITÉ
============================================================ */
function SecuritySection() {
  const [form, setForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.password_confirmation) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (form.password.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    setSaving(true);
    try {
      await api.patch("/account/password", form);
      setMessage({ type: "success", text: "Mot de passe modifié ✅" });
      setForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur serveur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        icon={Key}
        title="Changer le mot de passe"
        subtitle="Utilisez un mot de passe fort : 8+ caractères, majuscules, chiffres."
      >
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-4">
          <Field label="Mot de passe actuel">
            <PasswordInput
              value={form.current_password}
              onChange={(v) => setForm({ ...form, current_password: v })}
              visible={show.current}
              toggle={() => setShow({ ...show, current: !show.current })}
              placeholder="••••••••"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nouveau mot de passe">
              <PasswordInput
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                visible={show.next}
                toggle={() => setShow({ ...show, next: !show.next })}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirmer le mot de passe">
              <PasswordInput
                value={form.password_confirmation}
                onChange={(v) => setForm({ ...form, password_confirmation: v })}
                visible={show.confirm}
                toggle={() => setShow({ ...show, confirm: !show.confirm })}
                placeholder="••••••••"
              />
            </Field>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {saving ? "Modification..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </Card>

      <Card
        icon={Shield}
        title="Sessions actives"
        subtitle="Vos appareils connectés à votre compte."
      >
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Shield size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Session actuelle</p>
                <p className="text-xs text-slate-500">Navigateur web · Maintenant</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
              ACTIVE
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION : CONFIDENTIALITÉ
============================================================ */
function PrivacySection({ user }) {
  const [settings, setSettings] = useState({
    profile_public: true,
    show_email: false,
    show_phone: false,
    show_availability: true,
  });

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

  return (
    <div className="space-y-6">
      <Card
        icon={Shield}
        title="Visibilité du profil"
        subtitle="Contrôlez ce que les autres utilisateurs peuvent voir."
      >
        <div className="space-y-3">
          <Toggle
            label="Profil public"
            hint="Votre profil est visible par tous les utilisateurs connectés."
            checked={settings.profile_public}
            onChange={() => toggle("profile_public")}
          />
          <Toggle
            label="Afficher mon email"
            hint="Les recruteurs pourront voir votre adresse email."
            checked={settings.show_email}
            onChange={() => toggle("show_email")}
          />
          <Toggle
            label="Afficher mon téléphone"
            hint="Visible uniquement par les entreprises vérifiées."
            checked={settings.show_phone}
            onChange={() => toggle("show_phone")}
          />
          <Toggle
            label="Afficher mes disponibilités"
            hint="Les entreprises peuvent voir quand vous êtes disponible."
            checked={settings.show_availability}
            onChange={() => toggle("show_availability")}
          />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          💡 Ces paramètres sont indicatifs pour l'instant. La synchronisation sera ajoutée prochainement.
        </p>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION : NOTIFICATIONS
============================================================ */
function NotificationsSection() {
  const [settings, setSettings] = useState({
    email_proposals: true,
    email_missions: true,
    email_messages: true,
    email_marketing: false,
  });

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

  return (
    <div className="space-y-6">
      <Card
        icon={Bell}
        title="Notifications par email"
        subtitle="Choisissez les emails que vous souhaitez recevoir."
      >
        <div className="space-y-3">
          <Toggle
            label="Nouvelles propositions"
            hint="Recevoir un email à chaque nouvelle proposition."
            checked={settings.email_proposals}
            onChange={() => toggle("email_proposals")}
          />
          <Toggle
            label="Missions"
            hint="Acceptations, refus, changements de statut."
            checked={settings.email_missions}
            onChange={() => toggle("email_missions")}
          />
          <Toggle
            label="Messages"
            hint="Nouveaux messages dans la messagerie."
            checked={settings.email_messages}
            onChange={() => toggle("email_messages")}
          />
          <Toggle
            label="Actualités et nouveautés"
            hint="Nouveautés de la plateforme, événements."
            checked={settings.email_marketing}
            onChange={() => toggle("email_marketing")}
          />
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION : DANGER
============================================================ */
function DangerSection({ user }) {
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deactivate = async () => {
    if (!confirm("Désactiver votre compte ? Vous pourrez le réactiver en contactant le support.")) return;
    setDeactivating(true);
    try {
      await api.post("/account/deactivate");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Erreur serveur"));
      setDeactivating(false);
    }
  };

  const destroy = async () => {
    const pwd = prompt("Tapez votre mot de passe pour confirmer la suppression :");
    if (!pwd) return;
    if (!confirm("⚠️ Suppression définitive. Cette action est irréversible. Continuer ?")) return;
    setDeleting(true);
    try {
      await api.delete("/account", { data: { password: pwd } });
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Mot de passe incorrect."));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle size={18} />
          </span>
          <div>
            <h3 className="font-bold text-white">Désactiver le compte</h3>
            <p className="mt-1 text-sm text-slate-400">
              Votre profil sera masqué. Vos données sont conservées et pourront être restaurées en contactant le support.
            </p>
            <button
              onClick={deactivate}
              disabled={deactivating}
              className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
            >
              {deactivating ? "Désactivation..." : "Désactiver mon compte"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
            <Trash2 size={18} />
          </span>
          <div>
            <h3 className="font-bold text-white">Supprimer définitivement</h3>
            <p className="mt-1 text-sm text-slate-400">
              Toutes vos données seront effacées. Cette action est <strong className="text-rose-300">irréversible</strong>.
            </p>
            <button
              onClick={destroy}
              disabled={deleting}
              className="mt-4 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              {deleting ? "Suppression..." : "Supprimer mon compte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PETITS COMPOSANTS UI
============================================================ */

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon size={12} />} {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function PasswordInput({ value, onChange, visible, toggle, placeholder }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-12`}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Alert({ tone, children }) {
  const cls =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";
  const Icon = tone === "success" ? Check : X;
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Icon size={16} /> {children}
    </div>
  );
}