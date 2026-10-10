import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    token: '',
  });

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (token && email) {
      setFormData((prev) => ({
        ...prev,
        token,
        email,
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/reset-password', formData);
      setSuccess('Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-2 w-full rounded-xl2 border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20';
  const labelClass = 'text-xs font-semibold uppercase tracking-wider text-slate-400';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1526] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-mint/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-navy-500/15 blur-[120px]" />
      </div>

      <Link
        to="/login"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/10"
      >
        <ArrowLeft size={15} /> Connexion
      </Link>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-xl2 border border-white/10 bg-white/[0.04] p-8 shadow-pop backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-2xl font-bold text-white">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {success && (
            <div className="mt-6 flex items-start gap-2 rounded-xl2 border border-mint/30 bg-mint/10 p-3.5 text-sm text-mint">
              <CheckCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl2 border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-400">
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nouveau mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirmer le mot de passe</label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-mint py-3.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link to="/login" className="font-semibold text-mint hover:text-mint-light">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
