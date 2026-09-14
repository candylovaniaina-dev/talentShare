import React from 'react';
import AppShell from '../components/layout/AppShell';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cgu() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Link to="/help" className="inline-flex items-center gap-2 text-sm text-navy hover:underline mb-4">
          <ArrowLeft size={16} /> Retour à l'aide
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-navy" size={28} />
          Conditions Générales d'Utilisation
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-sm text-slate-600">
          <p><strong>1. Présentation</strong><br />TalentShare est une plateforme de mise en relation entre entreprises, talents, étudiants et universités.</p>
          <p><strong>2. Inscription</strong><br />L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes.</p>
          <p><strong>3. Données personnelles</strong><br />Les données sont protégées conformément à la législation en vigueur.</p>
          <p><strong>4. Confidentialité</strong><br />Les profils peuvent être publics, privés ou visibles par le réseau uniquement.</p>
          <p><strong>5. Responsabilité</strong><br />TalentShare n'est pas responsable des transactions ou engagements entre utilisateurs.</p>
          <p><strong>6. Modifications</strong><br />Les CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés.</p>
          <p><strong>7. Contact</strong><br />support@talentshare.mg</p>
        </div>
      </div>
    </AppShell>
  );
}