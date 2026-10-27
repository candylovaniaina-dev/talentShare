import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { X, Share2, Download, Check, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // ✅ Pour détecter le thème actuel

import MinimalTheme from "../components/portfolio-themes/MinimalTheme";
import BoldTheme from "../components/portfolio-themes/BoldTheme";
import CorporateTheme from "../components/portfolio-themes/CorporateTheme";
import VibrantTheme from "../components/portfolio-themes/VibrantTheme";
import CVPortfolio from "../components/portfolio-themes/CVPortfolio";

const THEMES = {
  minimal: MinimalTheme,
  bold: BoldTheme,
  corporate: CorporateTheme,
  vibrant: VibrantTheme,
};

export default function PublicPortfolio({
  asModal = false,
  onClose,
  data: providedData = null,
  slug: propSlug = null,
}) {
  const { slug: routeSlug } = useParams();
  const slug = propSlug || routeSlug;
  
  // ✅ On récupère le thème actuel de l'application
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [portfolio, setPortfolio] = useState(providedData);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!providedData);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cvRef = useRef(null);

  useEffect(() => {
    let active = true;

    if (providedData) {
      setPortfolio(providedData);
      setError(false);
      setLoading(false);
      return () => { active = false; };
    }

    if (!slug) {
      setPortfolio(null);
      setError(true);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(false);
    setPortfolio(null);

    api
      .get(`/portfolio/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!active) return;
        const payload = res?.data?.data ?? res?.data;
        if (!payload || typeof payload !== "object") {
          setError(true);
          return;
        }
        setPortfolio(payload);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Erreur de chargement du portfolio public :", err.response?.data || err.message);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [slug, providedData]);

  useEffect(() => {
    if (!asModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [asModal]);

  useEffect(() => {
    if (!asModal || !onClose) return undefined;
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [asModal, onClose]);

  const publicSlug = portfolio?.public_slug || portfolio?.slug || slug || "";
  const publicUrl = publicSlug ? `${window.location.origin}/portfolio/${encodeURIComponent(publicSlug)}` : window.location.href;

  const share = async () => {
    if (!portfolio) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: portfolio.title || "Mon portfolio",
          text: `Découvrez le portfolio de ${portfolio?.profile_data?.name || portfolio?.profile?.name || "ce talent"}`,
          url: publicUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (err?.name !== "AbortError") console.error("Erreur de partage :", err);
    }
  };

  const downloadPDF = async () => {
    if (!cvRef.current || downloading || !portfolio) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const element = cvRef.current;
      const images = element.querySelectorAll("img");
      await Promise.all(Array.from(images).map((img) => new Promise((resolve) => {
        if (img.complete) resolve(); else { img.onload = resolve; img.onerror = resolve; }
      })));
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false,
        width: element.scrollWidth, height: element.scrollHeight, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      remainingHeight -= pageHeight;
      while (remainingHeight > 0) {
        position = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
      const name = (portfolio?.profile_data?.name || portfolio?.profile?.name || "portfolio").toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
      pdf.save(`${name || "portfolio"}-portfolio.pdf`);
    } catch (err) {
      console.error("Erreur de génération du PDF :", err);
      window.alert("Impossible de générer le PDF. Réessaie dans un instant.");
    } finally {
      setDownloading(false);
    }
  };

  const profileData = portfolio?.profile_data || portfolio?.profile || {};
  const mergedProfile = portfolio ? {
    ...profileData,
    projects: portfolio.projects || profileData.projects || [],
    is_young_talent: Boolean(profileData.is_young_talent),
    looking_for_opportunity: Boolean(profileData.looking_for_opportunity),
    university: profileData.university || null,
    field_of_study: profileData.field_of_study || null,
    study_level: profileData.study_level || null,
  } : null;

  const accent = portfolio?.accent_color || "#16B8B1";
  const ThemeComponent = portfolio?.theme && THEMES[portfolio.theme] ? THEMES[portfolio.theme] : MinimalTheme;

  const loadingView = (
    <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
      Chargement du portfolio public...
    </div>
  );

  const errorView = (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
        <X size={26} />
      </div>
      <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Portfolio introuvable</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Ce portfolio n'existe pas, n'est plus disponible ou n'est pas public.
      </p>
      {!asModal && (
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300">
          <ArrowLeft size={15} /> Retour à l'accueil
        </Link>
      )}
    </div>
  );

  const hiddenCV = mergedProfile ? (
    <div ref={cvRef} data-cv-ref aria-hidden="true" style={{ position: "fixed", top: 0, left: "-10000px", width: "900px", background: "#ffffff", zIndex: -1, pointerEvents: "none" }}>
      <CVPortfolio portfolio={portfolio} profile={mergedProfile} accent={accent} />
    </div>
  ) : null;

  // ✅ On passe le variant au thème en fonction du mode actuel
  const themeVariant = isDark ? "dark" : "light";

  if (asModal) {
    return (
      <>
        {hiddenCV}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/80 p-3 backdrop-blur-md dark:bg-black/80 sm:p-6" role="dialog" aria-modal="true" aria-label="Aperçu du portfolio public">
          <button type="button" aria-label="Fermer l'aperçu" onClick={onClose} className="absolute inset-0 cursor-default" />

          <div className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#071521] sm:rounded-3xl">
            {/* ✅ Header de la modale en mode sombre */}
            <header className="relative z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#0B1F33] sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">TalentShare</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Portfolio public</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={share} title={copied ? "Lien copié" : "Partager"} aria-label={copied ? "Lien copié" : "Partager le portfolio"} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300">
                  {copied ? <Check size={17} /> : <Share2 size={17} />}
                </button>

                <button type="button" onClick={downloadPDF} disabled={downloading || loading || !!error} title="Télécharger le portfolio en PDF" aria-label="Télécharger le portfolio en PDF" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F33] text-white transition hover:bg-[#16354E] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300">
                  {downloading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : <Download size={17} />}
                </button>

                <button type="button" onClick={onClose} aria-label="Fermer l'aperçu" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300">
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* ✅ Fond de la modale en mode sombre */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 dark:bg-[#071521]">
              {loading ? loadingView : error || !portfolio ? errorView : (
                <ThemeComponent portfolio={portfolio} profile={mergedProfile} accent={accent} variant={themeVariant} />
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#071521]">{loadingView}</main>;
  if (error || !portfolio) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#071521]">{errorView}</main>;

  return (
    <>
      {hiddenCV}
      {/* ✅ Fond de la page publique en mode sombre */}
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071521] dark:text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#071521]/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link to="/" className="flex min-w-0 items-center gap-2 font-extrabold tracking-tight text-[#0B1F33] dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#071521]"><BriefcaseIcon /></span>
              <span>TalentShare</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={downloadPDF} disabled={downloading} className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300 sm:inline-flex">
                <Download size={15} /> {downloading ? "Génération..." : "Télécharger PDF"}
              </button>
              <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300 sm:px-4">
                {copied ? <Check size={15} /> : <Share2 size={15} />} <span className="hidden sm:inline">{copied ? "Lien copié" : "Partager"}</span>
              </button>
            </div>
          </div>
        </header>
        {mergedProfile?.is_young_talent && (
          <div className="fixed right-3 top-20 z-30 flex flex-col items-end gap-2 sm:right-5">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">Young Talent</span>
            {mergedProfile.looking_for_opportunity && <span className="rounded-full border border-amber-400/40 bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">En recherche</span>}
          </div>
        )}
        <ThemeComponent portfolio={portfolio} profile={mergedProfile} accent={accent} variant={themeVariant} />
      </div>
    </>
  );
}

function BriefcaseIcon() {
  return <span className="text-lg leading-none">T</span>;
}