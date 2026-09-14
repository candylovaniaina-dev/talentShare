import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppShell from '../../components/layout/AppShell';

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/account/password', passwordData);
      setSuccess('✅ Mot de passe modifié avec succès !');
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || '❌ Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.post('/account/deactivate');
      await logout();
    } catch (err) {
      setError('Erreur lors de la désactivation du compte.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('/account', {
        data: { password: deletePassword },
      });
      await logout();
    } catch (err) {
      setError('Mot de passe incorrect.');
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">⚙️ Paramètres du compte</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gérez vos informations personnelles et la sécurité de votre compte.
      </p>

      {/* Onglets */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            activeTab === 'password' ? 'border-navy text-navy' : 'border-transparent text-slate-400'
          }`}
        >
          🔒 Sécurité
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            activeTab === 'privacy' ? 'border-navy text-navy' : 'border-transparent text-slate-400'
          }`}
        >
          🛡️ Confidentialité
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            activeTab === 'danger' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400'
          }`}
        >
          ⚠️ Danger
        </button>
      </div>

      {/* Contenu selon l'onglet */}
      <div className="mt-6 max-w-2xl">
        {activeTab === 'password' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">🔒 Changer le mot de passe</h2>

            {success && (
              <div className="bg-green-100 text-green-700 p-3 rounded-xl mb-4">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={passwordData.password_confirmation}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-navy text-white rounded-xl hover:bg-navy/90 transition disabled:opacity-50"
              >
                {loading ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">🛡️ Confidentialité</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-medium text-slate-800">Visibilité du profil</p>
                  <p className="text-xs text-slate-400">Qui peut voir votre profil</p>
                </div>
                <select className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm">
                  <option>Public</option>
                  <option>Réseau</option>
                  <option>Privé</option>
                </select>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-medium text-slate-800">Email</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <span className="text-xs text-green-600">✅ Vérifié</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Téléphone</p>
                  <p className="text-xs text-slate-400">{user?.phone || 'Non renseigné'}</p>
                </div>
                <button className="text-sm text-navy hover:underline">Modifier</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-lg font-semibold text-red-600 mb-2">⚠️ Désactiver le compte</h2>
              <p className="text-sm text-slate-600">
                Votre compte sera désactivé et vous ne pourrez plus vous connecter.
                Contactez le support pour le réactiver.
              </p>
              <button
                onClick={() => setShowDeactivateConfirm(true)}
                className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                Désactiver mon compte
              </button>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-lg font-semibold text-red-600 mb-2">🗑️ Supprimer le compte</h2>
              <p className="text-sm text-slate-600">
                Cette action est irréversible. Toutes vos données seront supprimées définitivement.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-800 transition"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale Désactivation */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Désactiver le compte</h2>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir désactiver votre compte ? Vous pourrez le réactiver plus tard.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">🗑️ Supprimer le compte</h2>
            <p className="text-slate-600 mb-4">
              Cette action est irréversible. Entrez votre mot de passe pour confirmer.
            </p>
            <input
              type="password"
              placeholder="Mot de passe"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-700 text-white rounded-xl hover:bg-red-800 transition"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}