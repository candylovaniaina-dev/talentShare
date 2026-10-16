
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Lock,
  Shield,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Camera,
  Save,
  Key,
  Bell,
  Trash2,
  Monitor,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = [
  { id: "general", label: "Général", icon: User, desc: "Informations personnelles" },
  { id: "security", label: "Sécurité", icon: Lock, desc: "Mot de passe et session" },
  { id: "privacy", label: "Confidentialité", icon: Shield, desc: "Visibilité du profil" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Alertes et emails" },
  { id: "danger", label: "Zone dangereuse", icon: AlertTriangle, desc: "Actions irréversibles", danger: true },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0B1F33]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition duration-200 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [section, setSection] = useState("general");

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12364D] via-[#12364D] to-[#0B1F33] p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <Sparkles size={14} />
            Espace personnel
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Paramètres du compte
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Gérez vos informations personnelles, votre sécurité et vos
            préférences depuis un espace centralisé.
          </p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          <aside className="min-w-0 lg:sticky lg:top-24">
            <nav
              aria-label="Sections des paramètres"
              className="rounded-2xl border border-white/10 bg-[#12364D]/70 p-2 shadow-xl shadow-black/10 backdrop-blur-xl"
            >
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Paramètres du compte
              </p>

              <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {SECTIONS.map(({ id, label, icon: Icon, desc, danger }) => {
                  const active = section === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSection(id)}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-w-[150px] flex-1 items-center gap-3 rounded-xl border p-3 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 lg:min-w-0 lg:flex-none ${
                        active
                          ? danger
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-emerald-500/30 bg-emerald-500/10"
                          : "border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition sm:h-10 sm:w-10 ${
                          active
                            ? danger
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-emerald-500/15 text-emerald-300"
                            : danger
                              ? "bg-white/5 text-rose-400"
                              : "bg-white/5 text-slate-400 group-hover:text-white"
                        }`}
                      >
                        <Icon size={17} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold ${
                            active ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {label}
                        </span>
                        <span className="mt-0.5 hidden truncate text-xs text-slate-500 lg:block">
                          {desc}
                        </span>
                      </span>

                      <ChevronRight
                        size={15}
                        className={`hidden shrink-0 transition lg:block ${
                          active
                            ? "text-emerald-400"
                            : "text-slate-600 group-hover:text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="mt-4 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:block">
              <div className="flex items-center gap-2 text-emerald-300">
                <Shield size={16} />
                <p className="text-xs font-semibold">Votre sécurité compte</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Utilisez un mot de passe unique et gardez vos informations de
                connexion confidentielles.
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            {section === "general" && (
              <GeneralSection user={user} refreshUser={refreshUser} />
            )}
            {section === "security" && <SecuritySection />}
            {section === "privacy" && <PrivacySection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "danger" && <DangerSection />}
          </main>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   SECTION GÉNÉRALE
============================================================ */

function GeneralSection({ user, refreshUser }) {
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    name: user?.name || "",
    phone: user?.phone || "",
    country: user?.country || "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      name: user?.name || "",
      phone: user?.phone || "",
      country: user?.country || "",
    });
  }, [
    user?.first_name,
    user?.last_name,
    user?.name,
    user?.phone,
    user?.country,
  ]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.patch("/account/profile", form);
      await refreshUser?.();

      setMessage({
        type: "success",
        text: "Vos informations ont été mises à jour.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Impossible de mettre à jour vos informations.",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Veuillez sélectionner un fichier image.",
      });
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "La photo est trop volumineuse. Maximum : 5 Mo.",
      });
      input.value = "";
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await api.post("/profile/avatar", formData);
      await refreshUser?.();

      setMessage({
        type: "success",
        text: "Votre photo de profil a été mise à jour.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Impossible de téléverser votre photo.",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const avatarUrl = user?.avatar_path
    ? `http://localhost:8001/storage/${user.avatar_path}`
    : null;

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card
        icon={Camera}
        title="Photo de profil"
        subtitle="Ajoutez une photo pour personnaliser votre compte."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Photo de profil"}
              className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-600 text-2xl font-bold text-[#0B1F33] shadow-lg shadow-emerald-900/20">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              Votre photo personnelle
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Formats image acceptés. Taille maximale : 5 Mo.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/5 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Camera size={15} />
              )}
              {uploadingAvatar ? "Envoi en cours..." : "Changer la photo"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
              disabled={uploadingAvatar}
              aria-label="Sélectionner une photo de profil"
            />
          </div>
        </div>
      </Card>

      <Card
        icon={User}
        title="Informations personnelles"
        subtitle="Maintenez vos informations à jour."
      >
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prénom">
              <input
                type="text"
                value={form.first_name}
                onChange={(event) =>
                  updateField("first_name", event.target.value)
                }
                className={inputCls}
                placeholder="Votre prénom"
                autoComplete="given-name"
              />
            </Field>

            <Field label="Nom">
              <input
                type="text"
                value={form.last_name}
                onChange={(event) =>
                  updateField("last_name", event.target.value)
                }
                className={inputCls}
                placeholder="Votre nom"
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field
            label="Nom d'affichage"
            hint="Ce nom peut être visible par les autres utilisateurs."
          >
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputCls}
              placeholder="Votre nom d'affichage"
              autoComplete="name"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={inputCls}
                placeholder="+261 34 12 345 67"
                autoComplete="tel"
              />
            </Field>

            <Field label="Pays" icon={Globe}>
              <input
                type="text"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                className={inputCls}
                placeholder="Madagascar"
                autoComplete="country-name"
              />
            </Field>
          </div>

          <Field
            label="Adresse email"
            icon={Mail}
            hint="Pour modifier votre adresse email, contactez le support."
          >
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className={inputCls}
              autoComplete="email"
            />
          </Field>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Enregistrez vos modifications avant de quitter cette page.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0B1F33] shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION SÉCURITÉ
============================================================ */

function SecuritySection() {
  const [form, setForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.current_password) {
      setMessage({
        type: "error",
        text: "Veuillez saisir votre mot de passe actuel.",
      });
      return;
    }

    if (form.password.length < 8) {
      setMessage({
        type: "error",
        text: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    if (form.password !== form.password_confirmation) {
      setMessage({
        type: "error",
        text: "Les nouveaux mots de passe ne correspondent pas.",
      });
      return;
    }

    setSaving(true);

    try {
      await api.patch("/account/password", form);
      setForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setShow({ current: false, next: false, confirm: false });

      setMessage({
        type: "success",
        text: "Votre mot de passe a été modifié.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Impossible de modifier le mot de passe.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card
        icon={Key}
        title="Changer le mot de passe"
        subtitle="Choisissez un mot de passe difficile à deviner."
      >
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-5">
          <Field label="Mot de passe actuel">
            <PasswordInput
              value={form.current_password}
              onChange={(value) => updateField("current_password", value)}
              visible={show.current}
              toggle={() =>
                setShow((previous) => ({
                  ...previous,
                  current: !previous.current,
                }))
              }
              autoComplete="current-password"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
              <PasswordInput
                value={form.password}
                onChange={(value) => updateField("password", value)}
                visible={show.next}
                toggle={() =>
                  setShow((previous) => ({
                    ...previous,
                    next: !previous.next,
                  }))
                }
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirmer le mot de passe">
              <PasswordInput
                value={form.password_confirmation}
                onChange={(value) =>
                  updateField("password_confirmation", value)
                }
                visible={show.confirm}
                toggle={() =>
                  setShow((previous) => ({
                    ...previous,
                    confirm: !previous.confirm,
                  }))
                }
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-slate-300">
              Conseils de sécurité
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              {[
                "Au moins 8 caractères",
                "Évitez les mots de passe déjà utilisés ailleurs",
                "Ne partagez jamais votre mot de passe",
              ].map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <Check size={13} className="shrink-0 text-emerald-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={16} />
            )}
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </Card>

      <Card
        icon={Monitor}
        title="Sessions"
        subtitle="Informations sur votre session actuelle."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <Monitor size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Session actuelle</p>
              <p className="mt-1 text-xs text-slate-500">Navigateur web</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ACTIVE
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          La gestion détaillée des sessions dépend des fonctionnalités prises
          en charge par le serveur.
        </p>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION CONFIDENTIALITÉ
============================================================ */

function PrivacySection() {
  const [settings, setSettings] = useState({
    profile_public: true,
    show_email: false,
    show_phone: false,
    show_availability: true,
  });

  const toggle = (key) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card
        icon={Shield}
        title="Confidentialité du profil"
        subtitle="Prévisualisez vos préférences de visibilité."
      >
        <div className="space-y-3">
          <Toggle
            label="Profil public"
            hint="Préférence de visibilité du profil sur la plateforme."
            checked={settings.profile_public}
            onChange={() => toggle("profile_public")}
          />
          <Toggle
            label="Afficher mon email"
            hint="Préférence d'affichage de votre adresse email."
            checked={settings.show_email}
            onChange={() => toggle("show_email")}
          />
          <Toggle
            label="Afficher mon téléphone"
            hint="Préférence d'affichage de votre numéro de téléphone."
            checked={settings.show_phone}
            onChange={() => toggle("show_phone")}
          />
          <Toggle
            label="Afficher mes disponibilités"
            hint="Préférence de visibilité de vos disponibilités."
            checked={settings.show_availability}
            onChange={() => toggle("show_availability")}
          />
        </div>

        <Notice title="Préférences non enregistrées" tone="warning">
          Ces choix sont conservés uniquement dans l'état de cette page. Ils
          ne sont pas sauvegardés sur le serveur et ne modifient pas la
          visibilité réelle de votre profil.
        </Notice>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION NOTIFICATIONS
============================================================ */

function NotificationsSection() {
  const [settings, setSettings] = useState({
    email_proposals: true,
    email_missions: true,
    email_messages: true,
    email_marketing: false,
  });

  const toggle = (key) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card
        icon={Bell}
        title="Préférences de notification"
        subtitle="Choisissez les types de notifications que vous souhaitez recevoir."
      >
        <div className="space-y-3">
          <Toggle
            label="Nouvelles propositions"
            hint="Notifications concernant les nouvelles propositions."
            checked={settings.email_proposals}
            onChange={() => toggle("email_proposals")}
          />
          <Toggle
            label="Missions"
            hint="Acceptations, refus et changements de statut."
            checked={settings.email_missions}
            onChange={() => toggle("email_missions")}
          />
          <Toggle
            label="Messages"
            hint="Notifications concernant les nouveaux messages."
            checked={settings.email_messages}
            onChange={() => toggle("email_messages")}
          />
          <Toggle
            label="Actualités et nouveautés"
            hint="Informations générales et nouveautés de la plateforme."
            checked={settings.email_marketing}
            onChange={() => toggle("email_marketing")}
          />
        </div>

        <Notice title="Préférences temporaires" tone="warning">
          Les choix effectués ici ne sont pas encore enregistrés sur le
          serveur. Ils seront réinitialisés lorsque vous quitterez cette page.
        </Notice>
      </Card>
    </div>
  );
}

/* ============================================================
   SECTION ZONE DANGEREUSE
============================================================ */

function DangerSection() {
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deactivate = async () => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment désactiver votre compte ?"
    );

    if (!confirmed) return;

    setDeactivating(true);

    try {
      await api.post("/account/deactivate");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Impossible de désactiver le compte."
      );
      setDeactivating(false);
    }
  };

  const destroy = async () => {
    const password = window.prompt(
      "Saisissez votre mot de passe pour confirmer la suppression."
    );

    if (!password) return;

    const confirmed = window.confirm(
      "ATTENTION : la suppression du compte est définitive. Voulez-vous continuer ?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete("/account", { data: { password } });
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Impossible de supprimer le compte. Vérifiez votre mot de passe."
      );
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DangerCard
        icon={AlertTriangle}
        title="Désactiver mon compte"
        description="Cette action envoie une demande de désactivation au serveur. Vérifiez les conditions de réactivation applicables à votre compte avant de continuer."
        buttonLabel="Désactiver mon compte"
        loadingLabel="Désactivation..."
        loading={deactivating}
        disabled={deleting}
        onClick={deactivate}
        tone="amber"
      />

      <DangerCard
        icon={Trash2}
        title="Supprimer définitivement"
        description="Cette opération demande la suppression du compte au serveur. Elle peut entraîner la perte définitive des données associées."
        buttonLabel="Supprimer mon compte"
        loadingLabel="Suppression..."
        loading={deleting}
        disabled={deactivating}
        onClick={destroy}
        tone="rose"
      />
    </div>
  );
}

/* ============================================================
   COMPOSANTS UI RÉUTILISABLES
============================================================ */

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#12364D]/50 p-4 shadow-lg shadow-black/5 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-start gap-3 sm:mb-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/10 text-emerald-300">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white sm:text-lg">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon size={13} />}
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function PasswordInput({ value, onChange, visible, toggle, autoComplete }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="••••••••••"
        autoComplete={autoComplete}
        required
        className={`${inputCls} pr-12`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/[0.04] sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12364D] ${
          checked ? "bg-emerald-400" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Alert({ tone, children }) {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? Check : X;
  const styles = isSuccess
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-rose-500/20 bg-rose-500/10 text-rose-300";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Notice({ title, tone = "warning", children }) {
  const styles =
    tone === "warning"
      ? "border-amber-500/20 bg-amber-500/5 text-amber-200"
      : "border-blue-500/20 bg-blue-500/5 text-blue-200";

  return (
    <div className={`mt-5 rounded-xl border p-4 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

function DangerCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  loadingLabel,
  loading,
  disabled,
  onClick,
  tone,
}) {
  const isRose = tone === "rose";

  const cardStyle = isRose
    ? "border-rose-500/25 bg-rose-500/[0.04]"
    : "border-amber-500/20 bg-amber-500/[0.04]";

  const iconStyle = isRose
    ? "bg-rose-500/10 text-rose-300"
    : "bg-amber-500/10 text-amber-300";

  const buttonStyle = isRose
    ? "bg-rose-500 text-white hover:bg-rose-600"
    : "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20";

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${cardStyle}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {description}
          </p>

          <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${buttonStyle}`}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? loadingLabel : buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
