import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, LayoutDashboard, Circle, Check } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/layout/AppShell";
import MinimalTheme from "../components/portfolio-themes/MinimalTheme";
import BoldTheme from "../components/portfolio-themes/BoldTheme";
import CorporateTheme from "../components/portfolio-themes/CorporateTheme";
import VibrantTheme from "../components/portfolio-themes/VibrantTheme";

const THEMES = { minimal: MinimalTheme, bold: BoldTheme, corporate: CorporateTheme, vibrant: VibrantTheme };

export default function PublicPortfolio() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/portfolio/${slug}`)
      .then((res) => setPortfolio(res.data))
      .catch((err) => {
        console.error("Erreur portfolio:", err.response?.data);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    const shareData = {
      title: portfolio?.title || "Mon portfolio",
      text: `Découvrez le portfolio de ${portfolio?.profile_data?.name || "ce talent"}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Erreur partage:", err);
        alert("Impossible de partager : " + url);
      }
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-400">Chargement...</div>;

  if (error || !portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-slate-400">
        <p className="text-xl">Portfolio introuvable</p>
        <p className="mt-2 text-sm">Ce portfolio n'existe pas ou est privé.</p>
      </div>
    );
  }

  const ThemeComponent = THEMES[portfolio.theme] || MinimalTheme;
  const isDarkTheme = portfolio.theme === "bold";
  const isOwner = portfolio.is_owner || (user && user.id === portfolio.profile_data?.user_id);

  // ✅ Fusion des données : profil + projets + Young Talent
  const mergedProfile = {
    ...(portfolio.profile_data || portfolio.profile || {}),
    projects: portfolio.projects || [],
    // ✅ Champs Young Talent
    is_young_talent: portfolio.profile_data?.is_young_talent || false,
    looking_for_opportunity: portfolio.profile_data?.looking_for_opportunity || false,
    university: portfolio.profile_data?.university || null,
    field_of_study: portfolio.profile_data?.field_of_study || null,
    study_level: portfolio.profile_data?.study_level || null,
  };

  // ============================================
  // VUE PUBLIQUE
  // ============================================
  if (!isOwner) {
    return (
      <div>
        <header className={`sticky top-0 z-40 flex items-center justify-between border-b px-6 py-3 backdrop-blur-md ${
          isDarkTheme ? "border-white/10 bg-[#0B1633]/90 text-white" : "border-slate-200 bg-white/90 text-navy"
        }`}>
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-mint/40 bg-mint/10 text-mint">
              <Circle size={12} strokeWidth={3} />
            </span>
            TalentShare
          </Link>
          <button
            onClick={share}
            className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Lien copié !" : "Partager"}
          </button>
        </header>

        {/* ✅ Badge Young Talent flottant */}
        {mergedProfile.is_young_talent && (
          <div className="fixed right-4 top-20 z-40 flex flex-col gap-2">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/90 px-3 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur">
              🎓 Young Talent
            </span>
            {mergedProfile.looking_for_opportunity && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/90 px-3 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur">
                🔍 En recherche
              </span>
            )}
          </div>
        )}

        <ThemeComponent
          portfolio={portfolio}
          profile={mergedProfile}
          accent={portfolio.accent_color || "#6EE7C8"}
        />
      </div>
    );
  }

  // ============================================
  // VUE PROPRIÉTAIRE
  // ============================================
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-end gap-2 mb-4">
          <Link to="/profile" className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-navy">
            <LayoutDashboard size={14} /> Mon espace
          </Link>
          <button onClick={share} className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Lien copié !" : "Partager"}
          </button>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
          <ThemeComponent
            portfolio={portfolio}
            profile={mergedProfile}
            accent={portfolio.accent_color || "#6EE7C8"}
          />
        </div>
      </div>
    </AppShell>
  );
}