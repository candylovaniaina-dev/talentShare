import React from 'react';
import AppShell from '../components/layout/AppShell';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Confidentialite() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Link to="/help" className="inline-flex items-center gap-2 text-sm text-navy hover:underline mb-4">
          <ArrowLeft size={16} /> Retour à l'aide
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-navy" size={28} />
          Confidentialité & Sécurité
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-sm text-slate-600">
          <p><strong>🔒 Protection des données</strong><br />Toutes les données sont stockées en France et protégées par des serveurs sécurisés.</p>
          <p><strong>👤 Vos droits</strong><br />Vous pouvez consulter, modifier ou supprimer vos données à tout moment.</p>
          <p><strong>🔐 Sécurité des comptes</strong><br />Les mots de passe sont hachés. L'authentification à deux facteurs est disponible.</p>
          <p><strong>🛡️ Transparence</strong><br />Nous ne vendons pas vos données à des tiers.</p>
        </div>
      </div>
    </AppShell>
  );
}