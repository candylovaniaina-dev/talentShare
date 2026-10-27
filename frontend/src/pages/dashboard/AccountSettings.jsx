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
  Palette,
  Settings2,
  Info,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Appearance from "../Appearance";

const SECTIONS = [
  {
    id: "general",
    label: "Informations générales",
    shortLabel: "Général",
    icon: User,
    desc: "Profil et coordonnées",
    group: "COMPTE",
  },
  {
    id: "security",
    label: "Sécurité",
    shortLabel: "Sécurité",
    icon: Lock,
    desc: "Mot de passe et session",
    group: "COMPTE",
  },
  {
    id: "privacy",
    label: "Confidentialité",
    shortLabel: "Confidentialité",
    icon: Shield,
    desc: "Visibilité du profil",
    group: "PRÉFÉRENCES",
  },
  {
    id: "notifications",
    label: "Notifications",
    shortLabel: "Notifications",
    icon: Bell,
    desc: "Alertes et communications",
    group: "PRÉFÉRENCES",
  },
  {
    id: "appearance",
    label: "Apparence",
    shortLabel: "Apparence",
    icon: Palette,
    desc: "Thème et accessibilité",
    group: "PRÉFÉRENCES",
  },
  {
    id: "danger",
    label: "Zone sensible",
    shortLabel: "Zone sensible",
    icon: AlertTriangle,
    desc: "Désactivation et suppression",
    group: "COMPTE",
    danger: true,
  },
];

const inputCls =
  "w-full rounded-xl border border-[#DCE7E2] bg-white px-4 py-3 text-sm text-[#183D39] placeholder:text-[#A0B1AA] outline-none transition duration-200 hover:border-[#B8D2C6] focus:border-[#18A889] focus:ring-4 focus:ring-[#18A889]/10 disabled:cursor-not-allowed disabled:bg-[#F5F8F6] disabled:text-[#8A9C94] " +
  "dark:border-slate-700 dark:bg-[#0B1F33] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20 dark:disabled:bg-slate-800 dark:disabled:text-slate-500";

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [section, setSection] = useState("general");

  const activeSection = SECTIONS.find((item) => item.id === section);
  const ActiveIcon = activeSection?.icon || Settings2;

  const groupedSections = [
    {
      title: "COMPTE",
      items: SECTIONS.filter(
        (item) => item.group === "COMPTE" && !item.danger
      ),
    },
    {
      title: "PRÉFÉRENCES",
      items: SECTIONS.filter((item) => item.group === "PRÉFÉRENCES"),
    },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F5F8F6] px-3 py-5 transition-colors duration-300 dark:bg-[#071521] sm:px-5 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          
          {/* ✅ EN-TÊTE COMPACT ET MODERNE */}
          <header className="flex flex-col gap-4 border-b border-[#E0EAE4] pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
             
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#173D38] dark:text-white sm:text-3xl">
                Paramètres du compte
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#74877E] dark:text-slate-400">
                Gérez vos informations personnelles, votre sécurité et vos préférences.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#E2ECE6] bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-[#112A3A]">
              <Shield size={18} className="text-[#18A889] dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-[#244840] dark:text-slate-200">Votre espace</p>
                <p className="text-[10px] text-[#81938A] dark:text-slate-400">Sécurisé</p>
              </div>
            </div>
          </header>

          {/* Navigation et contenu */}
          <div className="grid items-start gap-5 lg:grid-cols-[275px_minmax(0,1fr)] lg:gap-7">
            <aside className="min-w-0 lg:sticky lg:top-24">
              <nav
                aria-label="Sections des paramètres"
                className="overflow-hidden rounded-2xl border border-[#DFE9E3] bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#0D2030]"
              >
                <div className="px-3 pb-3 pt-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#9AA9A1] dark:text-slate-500">
                    Centre de configuration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#31534A] dark:text-slate-200">
                    Gérer mon compte
                  </p>
                </div>

                {groupedSections.map((group) => (
                  <div key={group.title} className="mb-3">
                    <p className="px-3 pb-2 pt-2 text-[9px] font-bold tracking-[0.16em] text-[#A2B0A8] dark:text-slate-500">
                      {group.title}
                    </p>

                    <div className="space-y-1">
                      {group.items.map(
                        ({ id, label, shortLabel, icon: Icon, desc }) => {
                          const active = section === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSection(id)}
                              aria-current={active ? "page" : undefined}
                              className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18A889]/15 ${
                                active
                                  ? "border-[#D2EEE2] bg-gradient-to-r from-[#ECF9F2] to-[#F7FCF9] shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-[#0D2030] dark:shadow-none"
                                  : "border-transparent bg-white hover:border-[#E6F0EA] hover:bg-[#F8FBF9] dark:bg-transparent dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              {active && (
                                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#18A889] dark:bg-emerald-400" />
                              )}

                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                  active
                                    ? "bg-[#D9F3E6] text-[#087F68] dark:bg-emerald-900/50 dark:text-emerald-400"
                                    : "bg-[#F3F7F4] text-[#81948A] group-hover:bg-[#EAF7F0] group-hover:text-[#087F68] dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-emerald-400"
                                }`}
                              >
                                <Icon size={18} strokeWidth={1.8} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-sm font-bold ${
                                    active ? "text-[#176B59] dark:text-emerald-400" : "text-[#526D62] dark:text-slate-300"
                                  }`}
                                >
                                  <span className="hidden xl:inline">
                                    {label}
                                  </span>
                                  <span className="xl:hidden">
                                    {shortLabel}
                                  </span>
                                </span>
                                <span className="mt-1 hidden truncate text-[11px] text-[#94A49B] dark:text-slate-500 sm:block">
                                  {desc}
                                </span>
                              </span>

                              <ChevronRight
                                size={15}
                                className={`shrink-0 transition ${
                                  active
                                    ? "translate-x-0.5 text-[#18A889] dark:text-emerald-400"
                                    : "text-[#B7C3BC] group-hover:translate-x-0.5 group-hover:text-[#087F68] dark:text-slate-600 dark:group-hover:text-emerald-400"
                                }`}
                              />
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}

                {/* Zone sensible */}
                {SECTIONS.filter((item) => item.danger).map(
                  ({ id, label, icon: Icon, desc }) => {
                    const active = section === id;

                    return (
                      <div
                        key={id}
                        className="mt-2 border-t border-[#EDF1EE] pt-3 dark:border-slate-800"
                      >
                        <p className="px-3 pb-2 text-[9px] font-bold tracking-[0.16em] text-[#B4A29D] dark:text-slate-500">
                          ACTIONS SENSIBLES
                        </p>

                        <button
                          type="button"
                          onClick={() => setSection(id)}
                          aria-current={active ? "page" : undefined}
                          className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                            active
                              ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30"
                              : "border-transparent hover:border-rose-100 hover:bg-rose-50/60 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400"
                                : "bg-[#FFF6F4] text-rose-400 group-hover:text-rose-600 dark:bg-slate-800 dark:text-rose-500/70 dark:group-hover:text-rose-400"
                            }`}
                          >
                            <Icon size={18} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-rose-700 dark:text-rose-400">
                              {label}
                            </span>
                            <span className="mt-1 hidden text-[11px] leading-4 text-rose-400 dark:text-rose-500/80 sm:block">
                              {desc}
                            </span>
                          </span>
                          <ChevronRight
                            size={15}
                            className="shrink-0 text-rose-300 dark:text-rose-500/50"
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </nav>
            </aside>

            <main className="min-w-0">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#E0EAE4] bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-[#0D2030] sm:px-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    section === "danger"
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                      : "bg-[#E9F7EF] text-[#087F68] dark:bg-emerald-950/50 dark:text-emerald-400"
                  }`}
                >
                  <ActiveIcon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#91A197] dark:text-slate-500">
                    Paramètres / {activeSection?.group || "Compte"}
                  </p>
                  <h2 className="mt-1 text-base font-extrabold text-[#23483F] dark:text-white sm:text-lg">
                    {activeSection?.label || "Paramètres"}
                  </h2>
                </div>

                <span className="hidden items-center gap-1.5 rounded-full border border-[#DCEFE4] bg-[#F3FAF6] px-3 py-1.5 text-[10px] font-bold text-[#16836A] dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#18A889] dark:bg-emerald-500" />
                  Configuration
                </span>
              </div>

              <div className="min-w-0">
                {section === "general" && (
                  <GeneralSection user={user} refreshUser={refreshUser} />
                )}
                {section === "security" && <SecuritySection />}
                {section === "privacy" && <PrivacySection />}
                {section === "notifications" && <NotificationsSection />}
                {section === "appearance" && <Appearance />}
                {section === "danger" && <DangerSection />}
              </div>
            </main>
          </div>

          <footer className="flex flex-col gap-2 border-t border-[#E0EAE4] pt-4 text-xs text-[#96A49C] dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>TalentShare · Paramètres du compte</p>
            <p className="flex items-center gap-1.5">
              <Shield size={13} />
              Gérez vos informations en toute attention.
            </p>
          </footer>
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
    ? `/storage/${user.avatar_path}`
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
    <div className="space-y-5">
      <Card
        icon={Camera}
        title="Photo de profil"
        subtitle="Personnalisez votre espace avec une photo professionnelle."
        eyebrow="IDENTITÉ"
      >
        <div className="flex flex-col gap-5 rounded-2xl border border-[#E7EFEA] bg-[#FAFCFB] p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:p-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Photo de profil"}
              className="h-20 w-20 shrink-0 rounded-2xl border border-[#DFEAE3] bg-white object-cover shadow-sm dark:border-slate-600 dark:bg-slate-800"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#CDEBDD] bg-gradient-to-br from-[#DDF7EB] to-[#BDEBD7] text-2xl font-extrabold text-[#087F68] shadow-sm dark:border-emerald-900 dark:from-emerald-950 dark:to-[#0B253A] dark:text-emerald-400">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#31534A] dark:text-white">
              Votre photo personnelle
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[#8A9A91] dark:text-slate-400">
              Formats image acceptés. Taille maximale : 5 Mo.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#BBDCCB] bg-white px-4 py-2.5 text-sm font-bold text-[#176B59] shadow-sm transition hover:-translate-y-0.5 hover:border-[#18A889] hover:bg-[#F0FAF5] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18A889]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30"
            >
              {uploadingAvatar ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
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
        subtitle="Les informations associées à votre compte TalentShare."
        eyebrow="PROFIL"
      >
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-6">
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

          <div className="flex flex-col gap-4 border-t border-[#E9F0EC] pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#8A9A91] dark:text-slate-400">
              Vérifiez vos informations avant d’enregistrer.
            </p>

            <PrimaryButton type="submit" disabled={saving}>
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </PrimaryButton>
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
    <div className="space-y-5">
      <Card
        icon={Key}
        title="Changer le mot de passe"
        subtitle="Mettez régulièrement à jour votre mot de passe pour protéger votre compte."
        eyebrow="AUTHENTIFICATION"
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

          <div className="rounded-xl border border-[#DDECE3] bg-[#F7FBF8] p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#16836A] dark:text-emerald-400" />
              <p className="text-xs font-bold text-[#31534A] dark:text-emerald-100">
                Conseils de sécurité
              </p>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs text-[#74877D] dark:text-slate-300">
              {[
                "Utilisez au moins 8 caractères.",
                "Évitez les mots de passe déjà utilisés ailleurs.",
                "Ne partagez jamais vos identifiants.",
              ].map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <Check size={14} className="shrink-0 text-[#18A889] dark:text-emerald-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#E9F0EC] pt-5 dark:border-slate-800">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              {saving ? "Modification..." : "Modifier le mot de passe"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      <Card
        icon={Monitor}
        title="Sessions"
        subtitle="Informations sur votre session actuelle."
        eyebrow="APPAREILS ET SESSIONS"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E1EBE5] bg-[#FAFCFB] p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDECE3] bg-[#EAF7F0] text-[#087F68] dark:border-slate-600 dark:bg-slate-800 dark:text-emerald-400">
              <Monitor size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#31534A] dark:text-white">
                Session actuelle
              </p>
              <p className="mt-1 text-xs text-[#91A097] dark:text-slate-400">Navigateur web</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#CFEBDD] bg-[#EFF9F3] px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#16836A] dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18A889] dark:bg-emerald-500" />
            ACTIVE
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F7FAF8] p-3.5 dark:bg-slate-900/50">
          <Info size={15} className="mt-0.5 shrink-0 text-[#8DA097] dark:text-slate-500" />
          <p className="text-xs leading-5 text-[#83948B] dark:text-slate-400">
            La gestion détaillée des sessions dépend des fonctionnalités prises
            en charge par le serveur.
          </p>
        </div>
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
    <div className="space-y-5">
      <Card
        icon={Shield}
        title="Confidentialité du profil"
        subtitle="Définissez vos préférences de visibilité."
        eyebrow="VISIBILITÉ"
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
          Ces choix sont conservés uniquement dans l’état de cette page. Ils
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
    <div className="space-y-5">
      <Card
        icon={Bell}
        title="Préférences de notification"
        subtitle="Personnalisez les communications que vous souhaitez recevoir."
        eyebrow="COMMUNICATIONS"
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
   SECTION ZONE SENSIBLE
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertTriangle size={19} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
              Avant de continuer
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-300/80">
              Les actions ci-dessous peuvent affecter l’accès à votre compte
              ou entraîner une perte de données. Prenez le temps de vérifier
              votre choix.
            </p>
          </div>
        </div>
      </div>

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

function Card({ icon: Icon, title, subtitle, eyebrow, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DFE9E3] bg-white shadow-[0_4px_24px_rgba(24,61,57,0.035)] transition-shadow duration-200 hover:shadow-[0_7px_28px_rgba(24,61,57,0.055)] dark:border-slate-800 dark:bg-[#0D2030] dark:shadow-none dark:hover:shadow-none">
      <div className="flex items-start gap-3.5 border-b border-[#EDF2EE] px-4 py-5 dark:border-slate-800 sm:px-6 sm:py-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DCEFE4] bg-gradient-to-br from-[#F0FAF5] to-[#E3F6EC] text-[#087F68] dark:border-emerald-900/50 dark:from-emerald-950/50 dark:to-[#0B253A] dark:text-emerald-400">
          <Icon size={19} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#18A889] dark:text-emerald-500">
              {eyebrow}
            </p>
          )}
          <h2 className="text-base font-extrabold tracking-tight text-[#23483F] dark:text-white sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-6 text-[#84958C] dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <span className="hidden h-2 w-2 shrink-0 rounded-full bg-[#BFEBD7] dark:bg-emerald-900 sm:block" />
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#526D62] dark:text-slate-300">
        {Icon && <Icon size={14} className="text-[#18A889] dark:text-emerald-400" />}
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs leading-5 text-[#8C9C93] dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function PrimaryButton({ children, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#087F68] bg-gradient-to-r from-[#087F68] to-[#119B7C] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(8,127,104,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#076B58] hover:to-[#087F68] hover:shadow-[0_7px_18px_rgba(8,127,104,0.20)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18A889]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-emerald-600 dark:from-emerald-600 dark:to-emerald-500 dark:text-white dark:hover:from-emerald-500 dark:hover:to-emerald-400 dark:shadow-none dark:hover:shadow-none sm:w-auto"
    >
      {children}
    </button>
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
        aria-label={
          visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8A9C92] transition hover:bg-[#EFF8F3] hover:text-[#087F68] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A889]/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E5EDE7] bg-white p-4 transition-all duration-200 hover:border-[#CFE8DA] hover:bg-[#FBFDFC] dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:hover:bg-slate-800/50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#34564B] dark:text-slate-200">{label}</p>
        {hint && (
          <p className="mt-1 text-xs leading-5 text-[#899990] dark:text-slate-400">{hint}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18A889]/20 ${
          checked ? "bg-[#18A889] dark:bg-emerald-500" : "bg-[#D8E1DB] dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
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
    ? "border-[#CDEBDD] bg-[#F0FAF5] text-[#087F68] dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400";

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
      ? "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
      : "border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200";

  return (
    <div className={`mt-5 rounded-xl border p-4 ${styles}`}>
      <div className="flex items-center gap-2">
        <Info size={15} />
        <p className="text-sm font-bold">{title}</p>
      </div>
      <p className="mt-1.5 text-xs leading-5 opacity-80">{children}</p>
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
    ? "border-rose-200 bg-white dark:border-rose-900/50 dark:bg-[#0D2030]"
    : "border-amber-200 bg-white dark:border-amber-900/50 dark:bg-[#0D2030]";

  const iconStyle = isRose
    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
    : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400";

  const buttonStyle = isRose
    ? "border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500"
    : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/50";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-[0_4px_20px_rgba(24,61,57,0.025)] dark:shadow-none sm:p-6 ${cardStyle}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyle}`}
        >
          <Icon size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-[#31534A] dark:text-white sm:text-lg">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#819087] dark:text-slate-400">
            {description}
          </p>

          <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${buttonStyle}`}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? loadingLabel : buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}