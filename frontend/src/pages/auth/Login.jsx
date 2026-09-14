import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-navy">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <PublicNavbar variant="light" />
      </div>

      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
        <h1 className="text-2xl font-bold">Connexion à TalentShare</h1>
        <p className="mt-1 text-sm text-slate-500">Retrouvez vos profils, missions et opportunités.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              autoComplete="off"
              autoSave="off"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-navy py-3 font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ? <Link to="/register" className="font-semibold text-navy hover:text-mint">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}