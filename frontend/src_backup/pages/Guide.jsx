import React from 'react';
import AppShell from '../components/layout/AppShell';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Guide() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Link to="/help" className="inline-flex items-center gap-2 text-sm text-navy hover:underline mb-4">
          <ArrowLeft size={16} /> Retour à l'aide
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-navy" size={28} />
          Guide d'utilisation - TalentShare
        </h1>
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-lg">1. Créer mon compte</h2>
            <p className="text-sm text-slate-600 mt-2">Inscrivez-vous avec votre email, choisissez votre rôle (Entreprise, Talent, Étudiant, Université) et validez votre compte via l'email de vérification.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-lg">2. Compléter mon profil</h2>
            <p className="text-sm text-slate-600 mt-2">Remplissez vos informations personnelles, ajoutez votre photo, bio, compétences et disponibilités pour être visible.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-lg">3. Créer un portfolio</h2>
            <p className="text-sm text-slate-600 mt-2">Valorisez vos projets et expériences en créant votre portfolio professionnel.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-lg">4. Rechercher des opportunités</h2>
            <p className="text-sm text-slate-600 mt-2">Explorez les offres de missions, stages et emplois. Filtrez par compétences, localisation ou type de contrat.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-lg">5. Partager des ressources (Entreprise)</h2>
            <p className="text-sm text-slate-600 mt-2">Publiez les disponibilités de vos salariés pour qu'ils puissent être missionnés par d'autres entreprises.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}