import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');

    if (statusParam === 'success') {
      setStatus('success');
      setMessage(messageParam || 'Email vérifié avec succès !');
      setTimeout(() => navigate('/login'), 3000);
    } else if (statusParam === 'error') {
      setStatus('error');
      setMessage(messageParam || 'Le lien est invalide ou a expiré.');
    } else {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
    }
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1526] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} strokeWidth={1.5} className="mx-auto animate-spin text-mint" />
          <p className="mt-4 text-sm text-slate-400">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1526] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-mint/10 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-xl2 border border-white/10 bg-white/[0.04] p-8 shadow-pop backdrop-blur-xl text-center sm:p-10">
          {status === 'success' ? (
            <>
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl2 bg-mint/15 text-mint">
                  <CheckCircle size={28} strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="mt-6 text-2xl font-bold text-white">Email vérifié !</h1>
              <p className="mt-2 text-sm text-slate-400">{message}</p>
              <p className="mt-4 text-xs text-slate-500">Redirection vers la connexion...</p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl2 bg-rose-500/15 text-rose-400">
                  <AlertCircle size={28} strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="mt-6 text-2xl font-bold text-white">Vérification échouée</h1>
              <p className="mt-2 text-sm text-slate-400">{message}</p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-xl2 bg-mint px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
