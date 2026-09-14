import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Building2, Users, GraduationCap, Sparkles, Check, Eye, EyeOff } from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { useAuth } from "../../context/AuthContext";

const roles = [
  { value: "company", icon: Building2, title: "Entreprise", subtitle: "Mobiliser des compétences" },
  { value: "employee", icon: Users, title: "Talent / salarié", subtitle: "Partager mon expertise" },
  { value: "student", icon: GraduationCap, title: "Étudiant / diplômé", subtitle: "Lancer mon parcours" },
  { value: "university", icon: Sparkles, title: "Université", subtitle: "Connecter les filières" },
];

export default function Register() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "employee");
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // États pour afficher/masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, role });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-navy">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <PublicNavbar variant="light" />
      </div>

      <div className="mx-auto grid max-w-5xl gap-0 overflow-hidden rounded-3xl border border-slate-200 lg:my-16 lg:grid-cols-2">
        {/* Panneau gauche */}
        <div className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Rejoindre l'écosystème</p>
            <h2 className="mt-3 text-3xl font-bold leading-snug">
              Une place pour votre prochain chapitre professionnel.
            </h2>
            <p className="mt-4 text-slate-300">
              Choisissez le parcours qui vous correspond. Vous pourrez ensuite enrichir votre profil,
              régler votre visibilité et explorer les connexions qui comptent.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            {["Un profil construit pour votre métier", "Des disponibilités sous votre contrôle", "Des opportunités et missions lisibles"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Check size={13} className="text-mint" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Panneau droit : formulaire */}
        <div className="p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Créer mon accès</p>
          <h1 className="mt-2 text-2xl font-bold">Bienvenue dans TalentShare.</h1>
          <p className="mt-1 text-sm text-slate-500">Commencez par définir votre rôle pour personnaliser votre expérience.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {roles.map(({ value, icon: Icon, title, subtitle }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                  role === value ? "border-mint bg-mint/10" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon size={20} className={role === value ? "text-navy" : "text-slate-400"} />
                <span className="text-sm font-semibold">{title}</span>
                <span className="text-xs text-slate-500">{subtitle}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Nom */}
            <div>
              <label className="text-sm font-medium text-slate-700">Nom complet ou raison sociale</label>
              <input
                type="text"
                required
                placeholder="Ex. Sarah Andrianina"
                autoComplete="off"
                autoSave="off"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-700">Adresse email</label>
              <input
                type="email"
                required
                placeholder="vous@exemple.com"
                autoComplete="off"
                autoSave="off"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe avec toggle */}
            <div>
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe avec toggle */}
            <div>
              <label className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                  value={form.password_confirmation}
                  onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-navy py-3 font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ? <Link to="/login" className="font-semibold text-navy hover:text-mint">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}