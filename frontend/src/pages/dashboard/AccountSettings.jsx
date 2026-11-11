import React, { useState, useEffect, useRef } from "react";
import {
  User, Lock, Shield, AlertTriangle, Mail, Phone, Globe,
  Eye, EyeOff, Check, X, Loader2, Camera, Save, Key,
  Bell, Trash2, Monitor, ChevronRight, Palette, Settings2, Info,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Appearance from "../Appearance";

/* ============================================================
   PALETTE (alignée sur Messages.jsx)
   Bleu Marine : #0B1F33
   Bleu Marine clair : #142B49
   Turquoise : #16B8B1
   Turquoise foncé : #0F9691
   Fond sombre : #112A3A
============================================================ */

const SECTIONS = [
  { id: "general",      label: "Informations générales", shortLabel: "Général",         icon: User,          desc: "Profil et coordonnées",         group: "COMPTE" },
  { id: "security",     label: "Sécurité",               shortLabel: "Sécurité",        icon: Lock,          desc: "Mot de passe et session",       group: "COMPTE" },
  { id: "privacy",      label: "Confidentialité",        shortLabel: "Confidentialité", icon: Shield,        desc: "Visibilité du profil",          group: "PRÉFÉRENCES" },
  { id: "notifications",label: "Notifications",          shortLabel: "Notifications",   icon: Bell,          desc: "Alertes et communications",     group: "PRÉFÉRENCES" },
  { id: "appearance",   label: "Apparence",              shortLabel: "Apparence",       icon: Palette,       desc: "Thème et accessibilité",        group: "PRÉFÉRENCES" },
  { id: "danger",       label: "Zone sensible",          shortLabel: "Zone sensible",   icon: AlertTriangle, desc: "Désactivation et suppression",  group: "COMPTE", danger: true },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0B1F33] placeholder:text-slate-400 outline-none transition duration-200 " +
  "hover:border-slate-300 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 " +
  "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 " +
  "dark:hover:border-white/20 dark:focus:border-[#16B8B1] dark:focus:ring-[#16B8B1]/20 " +
  "dark:disabled:bg-white/[0.03] dark:disabled:text-slate-500";

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [section, setSection] = useState("general");

  const activeSection = SECTIONS.find((item) => item.id === section);
  const ActiveIcon = activeSection?.icon || Settings2;

  const groupedSections = [
    { title: "COMPTE",      items: SECTIONS.filter((i) => i.group === "COMPTE" && !i.danger) },
    { title: "PRÉFÉRENCES", items: SECTIONS.filter((i) => i.group === "PRÉFÉRENCES") },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50/60 px-3 py-5 transition-colors duration-300 dark:bg-[#071521] sm:px-5 sm:py-7 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-[1440px] space-y-6">

          {/* EN-TÊTE */}
          <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16B8B1]">
                Mon espace
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white sm:text-3xl">
                Paramètres du compte
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Gérez vos informations personnelles, votre sécurité et vos préférences.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
              <Shield size={18} className="text-[#16B8B1]" />
              <div>
                <p className="text-xs font-bold text-[#0B1F33] dark:text-slate-200">Votre espace</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Sécurisé</p>
              </div>
            </div>
          </header>

          <div className="grid items-start gap-5 lg:grid-cols-[275px_minmax(0,1fr)] lg:gap-7">
            {/* NAVIGATION */}
            <aside className="min-w-0 lg:sticky lg:top-24">
              <nav
                aria-label="Sections des paramètres"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#112A3A]"
              >
                <div className="px-3 pb-3 pt-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400 dark:text-slate-500">
                    Centre de configuration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1F33] dark:text-slate-200">
                    Gérer mon compte
                  </p>
                </div>

                {groupedSections.map((group) => (
                  <div key={group.title} className="mb-3">
                    <p className="px-3 pb-2 pt-2 text-[9px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {group.title}
                    </p>

                    <div className="space-y-1">
                      {group.items.map(({ id, label, shortLabel, icon: Icon, desc }) => {
                        const active = section === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSection(id)}
                            aria-current={active ? "page" : undefined}
                            className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/15 ${
                              active
                                ? "border-[#16B8B1]/30 bg-gradient-to-r from-[#16B8B1]/10 to-transparent shadow-sm dark:border-[#16B8B1]/30"
                                : "border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {active && (
                              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#16B8B1]" />
                            )}

                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                active
                                  ? "bg-[#16B8B1]/15 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-[#16B8B1]/10 group-hover:text-[#0F9691] dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-[#16B8B1]/15 dark:group-hover:text-[#16B8B1]"
                              }`}
                            >
                              <Icon size={18} strokeWidth={1.8} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-bold ${
                                active ? "text-[#0B1F33] dark:text-white" : "text-slate-700 dark:text-slate-300"
                              }`}>
                                <span className="hidden xl:inline">{label}</span>
                                <span className="xl:hidden">{shortLabel}</span>
                              </span>
                              <span className="mt-1 hidden truncate text-[11px] text-slate-400 dark:text-slate-500 sm:block">
                                {desc}
                              </span>
                            </span>

                            <ChevronRight
                              size={15}
                              className={`shrink-0 transition ${
                                active
                                  ? "translate-x-0.5 text-[#16B8B1]"
                                  : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-[#16B8B1] dark:text-slate-600"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Zone sensible */}
                {SECTIONS.filter((i) => i.danger).map(({ id, label, icon: Icon, desc }) => {
                  const active = section === id;
                  return (
                    <div key={id} className="mt-2 border-t border-slate-100 pt-3 dark:border-white/10">
                      <p className="px-3 pb-2 text-[9px] font-bold tracking-[0.16em] text-rose-300 dark:text-rose-500/60">
                        ACTIONS SENSIBLES
                      </p>
                      <button
                        type="button"
                        onClick={() => setSection(id)}
                        aria-current={active ? "page" : undefined}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                          active
                            ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
                            : "border-transparent hover:border-rose-100 hover:bg-rose-50/60 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20"
                        }`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          active
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                            : "bg-rose-50/60 text-rose-400 group-hover:text-rose-600 dark:bg-white/5 dark:text-rose-500/70 dark:group-hover:text-rose-400"
                        }`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-rose-700 dark:text-rose-400">{label}</span>
                          <span className="mt-1 hidden text-[11px] leading-4 text-rose-400 dark:text-rose-500/80 sm:block">{desc}</span>
                        </span>
                        <ChevronRight size={15} className="shrink-0 text-rose-300 dark:text-rose-500/50" />
                      </button>
                    </div>
                  );
                })}
              </nav>
            </aside>

            {/* CONTENU */}
            <main className="min-w-0">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A] sm:px-6">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  section === "danger"
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "bg-[#16B8B1]/15 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]"
                }`}>
                  <ActiveIcon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    Paramètres / {activeSection?.group || "Compte"}
                  </p>
                  <h2 className="mt-1 text-base font-extrabold text-[#0B1F33] dark:text-white sm:text-lg">
                    {activeSection?.label || "Paramètres"}
                  </h2>
                </div>

                <span className="hidden items-center gap-1.5 rounded-full border border-[#16B8B1]/30 bg-[#16B8B1]/10 px-3 py-1.5 text-[10px] font-bold text-[#0F9691] dark:text-[#16B8B1] sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
                  Configuration
                </span>
              </div>

              <div className="min-w-0">
                {section === "general" && <GeneralSection user={user} refreshUser={refreshUser} />}
                {section === "security" && <SecuritySection />}
                {section === "privacy" && <PrivacySection />}
                {section === "notifications" && <NotificationsSection />}
                {section === "appearance" && <Appearance />}
                {section === "danger" && <DangerSection />}
              </div>
            </main>
          </div>

          <footer className="flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-xs text-slate-400 dark:border-white/10 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>TalentShare · Paramètres du compte</p>
            <p className="flex items-center gap-1.5">
              <Shield size={13} />
              Gérez vos informations en toute sérénité.
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
  }, [user?.first_name, user?.last_name, user?.name, user?.phone, user?.country]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.patch("/account/profile", form);
      await refreshUser?.();
      setMessage({ type: "success", text: "Vos informations ont été mises à jour." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Impossible de mettre à jour vos informations.",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Veuillez sélectionner un fichier image." });
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La photo est trop volumineuse. Maximum : 5 Mo." });
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
      setMessage({ type: "success", text: "Votre photo de profil a été mise à jour." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Impossible de téléverser votre photo.",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const avatarUrl = user?.avatar_path ? `/storage/${user.avatar_path}` : null;
  const initials =
    user?.name?.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-5">
      <Card
        icon={Camera}
        title="Photo de profil"
        subtitle="Personnalisez votre espace avec une photo professionnelle."
        eyebrow="IDENTITÉ"
      >
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:p-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Photo de profil"}
              className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm dark:border-white/10 dark:bg-[#112A3A]"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#16B8B1]/30 bg-gradient-to-br from-[#16B8B1]/20 to-[#16B8B1]/5 text-2xl font-extrabold text-[#0F9691] shadow-sm dark:text-[#16B8B1]">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0B1F33] dark:text-white">Votre photo personnelle</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Formats image acceptés. Taille maximale : 5 Mo.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0B1F33] shadow-sm transition hover:-translate-y-0.5 hover:border-[#16B8B1] hover:bg-[#16B8B1]/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#16B8B1] dark:hover:bg-[#16B8B1]/10"
            >
              {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
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
              <input type="text" value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className={inputCls} placeholder="Votre prénom" autoComplete="given-name" />
            </Field>
            <Field label="Nom">
              <input type="text" value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className={inputCls} placeholder="Votre nom" autoComplete="family-name" />
            </Field>
          </div>

          <Field label="Nom d'affichage" hint="Ce nom peut être visible par les autres utilisateurs.">
            <input type="text" value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputCls} placeholder="Votre nom d'affichage" autoComplete="name" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" icon={Phone}>
              <input type="tel" value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputCls} placeholder="+261 34 12 345 67" autoComplete="tel" />
            </Field>
            <Field label="Pays" icon={Globe}>
              <input type="text" value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className={inputCls} placeholder="Madagascar" autoComplete="country-name" />
            </Field>
          </div>

          <Field label="Adresse email" icon={Mail}
            hint="Pour modifier votre adresse email, contactez le support.">
            <input type="email" value={user?.email || ""} disabled className={inputCls} autoComplete="email" />
          </Field>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Vérifiez vos informations avant d'enregistrer.
            </p>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.current_password) {
      setMessage({ type: "error", text: "Veuillez saisir votre mot de passe actuel." });
      return;
    }
    if (form.password.length < 8) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    if (form.password !== form.password_confirmation) {
      setMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }

    setSaving(true);
    try {
      await api.patch("/account/password", form);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      setShow({ current: false, next: false, confirm: false });
      setMessage({ type: "success", text: "Votre mot de passe a été modifié." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Impossible de modifier le mot de passe.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card icon={Key} title="Changer le mot de passe"
        subtitle="Mettez régulièrement à jour votre mot de passe pour protéger votre compte."
        eyebrow="AUTHENTIFICATION">
        {message && <Alert tone={message.type}>{message.text}</Alert>}

        <form onSubmit={save} className="space-y-5">
          <Field label="Mot de passe actuel">
            <PasswordInput value={form.current_password}
              onChange={(v) => updateField("current_password", v)}
              visible={show.current}
              toggle={() => setShow((p) => ({ ...p, current: !p.current }))}
              autoComplete="current-password" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
              <PasswordInput value={form.password}
                onChange={(v) => updateField("password", v)}
                visible={show.next}
                toggle={() => setShow((p) => ({ ...p, next: !p.next }))}
                autoComplete="new-password" />
            </Field>
            <Field label="Confirmer le mot de passe">
              <PasswordInput value={form.password_confirmation}
                onChange={(v) => updateField("password_confirmation", v)}
                visible={show.confirm}
                toggle={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                autoComplete="new-password" />
            </Field>
          </div>

          <div className="rounded-xl border border-[#16B8B1]/20 bg-[#16B8B1]/5 p-4 dark:border-[#16B8B1]/20 dark:bg-[#16B8B1]/10">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#0F9691] dark:text-[#16B8B1]" />
              <p className="text-xs font-bold text-[#0B1F33] dark:text-[#16B8B1]">Conseils de sécurité</p>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {[
                "Utilisez au moins 8 caractères.",
                "Évitez les mots de passe déjà utilisés ailleurs.",
                "Ne partagez jamais vos identifiants.",
              ].map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <Check size={14} className="shrink-0 text-[#16B8B1]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-5 dark:border-white/10">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {saving ? "Modification..." : "Modifier le mot de passe"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      <Card icon={Monitor} title="Sessions"
        subtitle="Informations sur votre session actuelle." eyebrow="APPAREILS ET SESSIONS">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F9691] dark:border-white/10 dark:bg-[#112A3A] dark:text-[#16B8B1]">
              <Monitor size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#0B1F33] dark:text-white">Session actuelle</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Navigateur web</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#16B8B1]/30 bg-[#16B8B1]/10 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#0F9691] dark:text-[#16B8B1]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
            ACTIVE
          </span>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 dark:bg-white/[0.03]">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            La gestion détaillée des sessions dépend des fonctionnalités prises en charge par le serveur.
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
    profile_public: true, show_email: false, show_phone: false, show_availability: true,
  });
  const toggle = (key) => setSettings((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5">
      <Card icon={Shield} title="Confidentialité du profil"
        subtitle="Définissez vos préférences de visibilité." eyebrow="VISIBILITÉ">
        <div className="space-y-3">
          <Toggle label="Profil public" hint="Préférence de visibilité du profil sur la plateforme."
            checked={settings.profile_public} onChange={() => toggle("profile_public")} />
          <Toggle label="Afficher mon email" hint="Préférence d'affichage de votre adresse email."
            checked={settings.show_email} onChange={() => toggle("show_email")} />
          <Toggle label="Afficher mon téléphone" hint="Préférence d'affichage de votre numéro de téléphone."
            checked={settings.show_phone} onChange={() => toggle("show_phone")} />
          <Toggle label="Afficher mes disponibilités" hint="Préférence de visibilité de vos disponibilités."
            checked={settings.show_availability} onChange={() => toggle("show_availability")} />
        </div>
        <Notice title="Préférences non enregistrées" tone="warning">
          Ces choix sont conservés uniquement dans l'état de cette page. Ils ne sont pas sauvegardés sur le serveur
          et ne modifient pas la visibilité réelle de votre profil.
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
    email_proposals: true, email_missions: true, email_messages: true, email_marketing: false,
  });
  const toggle = (key) => setSettings((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5">
      <Card icon={Bell} title="Préférences de notification"
        subtitle="Personnalisez les communications que vous souhaitez recevoir." eyebrow="COMMUNICATIONS">
        <div className="space-y-3">
          <Toggle label="Nouvelles propositions" hint="Notifications concernant les nouvelles propositions."
            checked={settings.email_proposals} onChange={() => toggle("email_proposals")} />
          <Toggle label="Missions" hint="Acceptations, refus et changements de statut."
            checked={settings.email_missions} onChange={() => toggle("email_missions")} />
          <Toggle label="Messages" hint="Notifications concernant les nouveaux messages."
            checked={settings.email_messages} onChange={() => toggle("email_messages")} />
          <Toggle label="Actualités et nouveautés" hint="Informations générales et nouveautés de la plateforme."
            checked={settings.email_marketing} onChange={() => toggle("email_marketing")} />
        </div>
        <Notice title="Préférences temporaires" tone="warning">
          Les choix effectués ici ne sont pas encore enregistrés sur le serveur. Ils seront réinitialisés
          lorsque vous quitterez cette page.
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
    if (!window.confirm("Voulez-vous vraiment désactiver votre compte ?")) return;
    setDeactivating(true);
    try {
      await api.post("/account/deactivate");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      window.alert(err.response?.data?.message || "Impossible de désactiver le compte.");
      setDeactivating(false);
    }
  };

  const destroy = async () => {
    const password = window.prompt("Saisissez votre mot de passe pour confirmer la suppression.");
    if (!password) return;
    if (!window.confirm("ATTENTION : la suppression du compte est définitive. Voulez-vous continuer ?")) return;
    setDeleting(true);
    try {
      await api.delete("/account", { data: { password } });
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      window.alert(err.response?.data?.message || "Impossible de supprimer le compte. Vérifiez votre mot de passe.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle size={19} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">Avant de continuer</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-300/80">
              Les actions ci-dessous peuvent affecter l'accès à votre compte ou entraîner une perte de données.
              Prenez le temps de vérifier votre choix.
            </p>
          </div>
        </div>
      </div>

      <DangerCard icon={AlertTriangle} title="Désactiver mon compte"
        description="Cette action envoie une demande de désactivation au serveur. Vérifiez les conditions de réactivation applicables à votre compte avant de continuer."
        buttonLabel="Désactiver mon compte" loadingLabel="Désactivation..."
        loading={deactivating} disabled={deleting} onClick={deactivate} tone="amber" />

      <DangerCard icon={Trash2} title="Supprimer définitivement"
        description="Cette opération demande la suppression du compte au serveur. Elle peut entraîner la perte définitive des données associées."
        buttonLabel="Supprimer mon compte" loadingLabel="Suppression..."
        loading={deleting} disabled={deactivating} onClick={destroy} tone="rose" />
    </div>
  );
}

/* ============================================================
   COMPOSANTS UI RÉUTILISABLES
============================================================ */
function Card({ icon: Icon, title, subtitle, eyebrow, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(11,31,51,0.04)] transition-shadow duration-200 hover:shadow-[0_7px_28px_rgba(11,31,51,0.06)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none">
      <div className="flex items-start gap-3.5 border-b border-slate-100 px-4 py-5 dark:border-white/10 sm:px-6 sm:py-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#16B8B1]/20 bg-gradient-to-br from-[#16B8B1]/15 to-[#16B8B1]/5 text-[#0F9691] dark:border-[#16B8B1]/20 dark:text-[#16B8B1]">
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#16B8B1]">
              {eyebrow}
            </p>
          )}
          <h2 className="text-base font-extrabold tracking-tight text-[#0B1F33] dark:text-white sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <span className="hidden h-2 w-2 shrink-0 rounded-full bg-[#16B8B1]/40 dark:bg-[#16B8B1]/30 sm:block" />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
        {Icon && <Icon size={14} className="text-[#16B8B1]" />}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function PrimaryButton({ children, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0B1F33] bg-[#0B1F33] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(11,31,51,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#142B49] hover:shadow-[0_7px_18px_rgba(11,31,51,0.22)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-[#16B8B1] dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691] sm:w-auto"
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
        onChange={(e) => onChange(e.target.value)}
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
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#0B1F33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1]/40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0B1F33] dark:text-slate-200">{label}</p>
        {hint && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 ${
          checked ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"
        }`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}

function Alert({ tone, children }) {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? Check : X;
  const styles = isSuccess
    ? "border-[#16B8B1]/30 bg-[#16B8B1]/10 text-[#0F9691] dark:border-[#16B8B1]/30 dark:bg-[#16B8B1]/10 dark:text-[#16B8B1]"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400";
  return (
    <div role={isSuccess ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Notice({ title, tone = "warning", children }) {
  const styles = tone === "warning"
    ? "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
    : "border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200";
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

function DangerCard({ icon: Icon, title, description, buttonLabel, loadingLabel, loading, disabled, onClick, tone }) {
  const isRose = tone === "rose";
  const cardStyle = isRose
    ? "border-rose-200 bg-white dark:border-rose-900/40 dark:bg-[#112A3A]"
    : "border-amber-200 bg-white dark:border-amber-900/40 dark:bg-[#112A3A]";
  const iconStyle = isRose
    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
    : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400";
  const buttonStyle = isRose
    ? "border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500"
    : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/40";

  return (
    <section className={`rounded-2xl border p-5 shadow-[0_4px_20px_rgba(11,31,51,0.03)] dark:shadow-none sm:p-6 ${cardStyle}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyle}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-[#0B1F33] dark:text-white sm:text-lg">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
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