import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [hash, setHash] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    const h = searchParams.get('hash');
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');

    if (id && h) {
      setUserId(id);
      setHash(h);
      verifyEmail(id, h, expires, signature);
    } else {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
    }
  }, [searchParams]);

  const verifyEmail = async (id, hash, expires, signature) => {
    try {
      const response = await api.get(
        `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`
      );
      setStatus('success');
      setMessage(response.data.message || 'Email vérifié avec succès !');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(
        err.response?.data?.message || 'Le lien de vérification est invalide ou a expiré.'
      );
    }
  };

  const handleResend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Veuillez vous connecter pour renvoyer un email.');
        navigate('/login');
        return;
      }
      await api.post('/email/resend', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Un nouvel email de vérification a été envoyé.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'success' ? (
          <>
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600">Email vérifié !</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirection vers la connexion...</p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600">Vérification échouée</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <button
              onClick={handleResend}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Renvoyer l'email de vérification
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;