import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, MapPin, Globe, ArrowLeft, Users, ShieldCheck, Mail, Phone } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PublicNavbar from "../components/layout/PublicNavbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:8001";

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/companies/${id}`)
      .then((res) => { if (!cancelled) setCompany(res.data); })
      .catch((err) => {
        if (!cancelled) setError(err.response?.status === 404 ? "introuvable" : "erreur");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  const Layout = user ? AppShell : PublicOnlyLayout;

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-[#F3F6FC] dark:bg-[#0A1230]">
          <div className="flex flex-col items-center gap-3 text-[#5B6785] dark:text-[#A6B2D1]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B1437] dark:border-white/10 dark:border-t-[#7BE9D3]" />
            <p className="text-sm font-medium">Chargement de l'entreprise…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !company) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#F3F6FC] px-4 text-center dark:bg-[#0A1230]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
            <Building2 size={28} />
          </div>
          <h1 className="text-xl font-bold text-[#0B1437] dark:text-white">
            {error === "introuvable" ? "Entreprise introuvable" : "Erreur de chargement"}
          </h1>
          <p className="max-w-md text-sm text-[#5B6785] dark:text-[#A6B2D1]">
            Cette entreprise n'existe pas ou n'est plus disponible.
          </p>
          {/* ✅ Bouton de retour */}
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143B55] dark:bg-[#7BE9D3] dark:text-[#0A1230] dark:hover:bg-[#5EDCC4]"
          >
            <ArrowLeft size={16} /> Retour à l'explorateur
          </button>
        </div>
      </Layout>
    );
  }

  const logoUrl = company.logo_url || (company.logo_path ? `${API_BASE}/storage/${company.logo_path}` : null);

  return (
    <Layout>
      <div className="min-h-screen bg-[#F3F6FC] py-6 dark:bg-[#0A1230] sm:py-10">
        <div className="mx-auto max-w-4xl px-5">
          
          {/* ✅ LE BOUTON DE RETOUR EST ICI */}
          <div className="mb-6">
            <button 
              onClick={() => navigate(-1)} 
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#5B6785] transition hover:text-[#0B1437] dark:text-[#A6B2D1] dark:hover:text-white"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
              Retour à l'explorateur
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]">
            {/* Bannière */}
            <div className="h-32 bg-gradient-to-br from-[#0A1230] to-[#111A4E]" />

            <div className="relative px-6 pb-6 sm:px-10">
              {/* Logo */}
              <div className="-mt-16 flex items-end justify-between">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg dark:border-[#131E47] dark:bg-[#0A1230]">
                  {logoUrl ? (
                    <img src={logoUrl} alt={company.name} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-3xl font-extrabold text-[#0B1437] dark:text-white">
                      {company.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                {company.is_verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck size={14} /> Vérifiée
                  </span>
                )}
              </div>

              {/* Informations */}
              <div className="mt-5">
                <h1 className="text-2xl font-extrabold text-[#0B1437] dark:text-white">{company.name}</h1>
                {company.industry && <p className="mt-1 text-sm font-semibold text-[#0B1437] dark:text-[#7BE9D3]">{company.industry}</p>}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#5B6785] dark:text-slate-400">
                  {(company.city || company.country) && (
                    <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {[company.city, company.country].filter(Boolean).join(", ")}</span>
                  )}
                  {company.size && <span className="inline-flex items-center gap-1.5"><Users size={15} /> {company.size} employés</span>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#0B1437] dark:hover:text-[#7BE9D3]">
                      <Globe size={15} /> {company.website}
                    </a>
                  )}
                </div>

                {company.description && (
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
                    <h2 className="mb-2 text-sm font-bold text-[#0B1437] dark:text-white">À propos</h2>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{company.description}</p>
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {company.phone && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-white/5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#0B1437] dark:bg-[#0A1230] dark:text-[#7BE9D3]"><Phone size={17} /></span>
                      <div><p className="text-xs text-slate-400">Téléphone</p><p className="text-sm font-semibold text-[#0B1437] dark:text-white">{company.phone}</p></div>
                    </div>
                  )}
                  {company.owner?.email && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-white/5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#0B1437] dark:bg-[#0A1230] dark:text-[#7BE9D3]"><Mail size={17} /></span>
                      <div><p className="text-xs text-slate-400">Email</p><p className="text-sm font-semibold text-[#0B1437] dark:text-white">{company.owner.email}</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PublicOnlyLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F3F6FC] text-[#0B1437] dark:bg-[#0A1230] dark:text-white">
      <PublicNavbar />
      {children}
    </div>
  );
}