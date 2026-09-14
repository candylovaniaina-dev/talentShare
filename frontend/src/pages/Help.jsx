import React, { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { 
  HelpCircle, FileText, Mail, Phone, BookOpen, 
  Shield, User, Settings, ExternalLink, CheckCircle,
  ChevronDown, ChevronUp, Users, Briefcase, Search
} from 'lucide-react';

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Données FAQ spécifiques à TalentShare
  const faqs = [
    {
      question: "Comment créer mon profil professionnel ?",
      answer: "Connectez-vous à votre compte, allez dans 'Mon profil' et remplissez vos informations : photo, titre, bio, compétences et expériences. Plus votre profil est complet, plus vous serez visible par les entreprises."
    },
    {
      question: "Comment une entreprise peut-elle partager une ressource ?",
      answer: "Les entreprises peuvent déclarer qu'un salarié est disponible via la section 'Resource Sharing'. Sélectionnez le salarié, définissez la période et les compétences, puis publiez l'offre pour que d'autres entreprises puissent la voir."
    },
    {
      question: "Comment postuler à une offre de stage ou d'emploi ?",
      answer: "Rendez-vous dans la section 'Offres & stages', filtrez par type (stage, CDD, CDI, etc.) et cliquez sur 'Postuler'. Vous pouvez joindre votre CV et une lettre de motivation."
    },
    {
      question: "Comment fonctionne la vérification des profils ?",
      answer: "Les profils des étudiants peuvent être vérifiés par leur université. Les entreprises peuvent également demander une vérification pour obtenir un badge 'Entreprise vérifiée', ce qui renforce la confiance entre les parties."
    },
    {
      question: "Qu'est-ce que le matching de compétences ?",
      answer: "TalentShare analyse automatiquement vos compétences, disponibilités et expériences pour vous proposer des missions ou opportunités qui correspondent à votre profil. Le score de correspondance vous indique la pertinence de chaque suggestion."
    },
    {
      question: "Comment gérer mes disponibilités ?",
      answer: "Dans votre profil, allez dans l'onglet 'Disponibilités'. Vous pouvez ajouter des périodes où vous êtes disponible, définir votre charge de travail (ex: 80%) et indiquer si le télétravail est possible."
    },
    {
      question: "Comment créer un portfolio ?",
      answer: "Dans l'onglet 'Portfolio' de votre profil, vous pouvez ajouter vos projets, vos réalisations et vos certifications. C'est idéal pour valoriser vos compétences auprès des recruteurs."
    },
    {
      question: "Quels sont les différents rôles sur TalentShare ?",
      answer: "Il y a 5 rôles : Entreprise (publié des offres), Talent (salarié disponible), Étudiant (en recherche de stage/emploi), Université (partenaire éducatif) et Administrateur (gestion de la plateforme)."
    }
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="text-navy" size={28} />
          Aide et assistance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Trouvez des réponses à vos questions et contactez notre équipe.
        </p>

        {/* Section des guides */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Guide d'utilisation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-navy" />
              Guide d'utilisation
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Découvrez comment utiliser TalentShare étape par étape.
            </p>
            <button 
              onClick={() => window.open('/guide', '_blank')}
              className="mt-3 text-sm text-navy font-semibold hover:underline flex items-center gap-1"
            >
              Consulter le guide → <ExternalLink size={14} />
            </button>
          </div>

          {/* Conditions générales */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText size={18} className="text-navy" />
              Conditions générales
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Consultez nos conditions d'utilisation et politiques.
            </p>
            <button 
              onClick={() => window.open('/cgu', '_blank')}
              className="mt-3 text-sm text-navy font-semibold hover:underline flex items-center gap-1"
            >
              Lire les CGU → <ExternalLink size={14} />
            </button>
          </div>

          {/* Confidentialité */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} className="text-navy" />
              Confidentialité & sécurité
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Comment nous protégeons vos données et votre vie privée.
            </p>
            <button 
              onClick={() => window.open('/confidentialite', '_blank')}
              className="mt-3 text-sm text-navy font-semibold hover:underline flex items-center gap-1"
            >
              En savoir plus → <ExternalLink size={14} />
            </button>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle size={18} className="text-navy" />
              FAQ
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Questions fréquentes sur les missions, profils et partenariats.
            </p>
            <button 
              onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-3 text-sm text-navy font-semibold hover:underline"
            >
              Voir les FAQ ↓
            </button>
          </div>
        </div>

        {/* Section FAQ détaillée */}
        <div id="faq-section" className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            ❓ Foire Aux Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
                >
                  <span className="font-medium text-sm">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp size={18} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">📞 Nous contacter</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Mail size={18} className="text-navy" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <a href="mailto:support@talentshare.mg" className="text-sm text-navy hover:underline">
                  support@talentshare.mg
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Phone size={18} className="text-navy" />
              <div>
                <p className="text-sm font-medium">Téléphone</p>
                <p className="text-sm text-slate-600">+261 34 00 000 00</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Réponse sous 24h ouvrables (du lundi au vendredi).
          </p>
        </div>

        {/* Statut */}
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
          Tous les services sont opérationnels
        </div>
      </div>
    </AppShell>
  );
}