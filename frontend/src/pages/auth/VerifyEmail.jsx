import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    // ✅ Le backend a déjà fait le travail
    // On lit juste les paramètres d'URL status + message
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');

    if (statusParam === 'success') {
      setStatus('success');
      setMessage(messageParam || 'Email vérifié avec succès !');

      // Redirige vers /login après 3 secondes
      setTimeout(() => navigate('/login'), 3000);
    } else if (statusParam === 'error') {
      setStatus('error');
      setMessage(messageParam || 'Le lien est invalide ou a expiré.');
    } else {
      // Aucun paramètre : l'utilisateur a ouvert la page directement
      setStatus('error');
      setMessage('Lien de vérification invalide.');
    }
  }, [searchParams, navigate]);

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
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;