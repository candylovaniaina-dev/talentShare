import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, LayoutDashboard, Circle, Check, Download, X, Loader2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/layout/AppShell";

/* Thèmes visuels */
import MinimalTheme from "../components/portfolio-themes/MinimalTheme";
import BoldTheme from "../components/portfolio-themes/BoldTheme";
import CorporateTheme from "../components/portfolio-themes/CorporateTheme";
import VibrantTheme from "../components/portfolio-themes/VibrantTheme";

/* CV compact (utilisé uniquement pour la capture PDF) */
import CVPortfolio from "../components/portfolio-themes/CVPortfolio";

const THEMES = {
  minimal: MinimalTheme,
  bold: BoldTheme,
  corporate: CorporateTheme,
  vibrant: VibrantTheme,
};

export default function PublicPortfolio({ asModal = false, onClose, data: providedData = null }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(providedData);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!providedData);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cvRef = useRef(null);

  useEffect(() => {
    if (providedData) {
      setPortfolio(providedData);
      setLoading(false);
      return;
    }
    if (!slug) {
      setError(true);
      setLoading(false);
      return;
    }
    api
      .get(`/portfolio/${slug}`)
      .then((res) => setPortfolio(res.data))
      .catch((err) => {
        console.error("Erreur portfolio:", err.response?.data);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug, providedData]);

  useEffect(() => {
    if (asModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [asModal]);

  useEffect(() => {
    if (!asModal || !onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asModal, onClose]);

  const share = async () => {
    const url = asModal
      ? `${window.location.origin}/portfolio/${portfolio?.public_slug || slug}`
      : window.location.href;
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
      }
    }
  };

  /* ---------- Téléchargement PDF ---------- */
  const downloadPDF = async () => {
    if (!cvRef.current || downloading) return;
    setDownloading(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = cvRef.current;

      // Attendre le chargement des images
      const images = element.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            })
        )
      );
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const name = (portfolio?.profile_data?.name || "portfolio")
        .toLowerCase()
        .replace(/\s+/g, "-");
      pdf.save(`${name}-portfolio.pdf`);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      alert("Impossible de générer le PDF. Réessaie dans un instant.");
    } finally {
      setDownloading(false);
    }
  };

  const loadingView = (
    <div className="flex min-h-[200px] flex-1 items-center justify-center text-slate-400">
      Chargement...
    </div>
  );

  const errorView = (
    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center text-slate-400">
      <p className="text-xl">Portfolio introuvable</p>
      <p className="mt-2 text-sm">Ce portfolio n'existe pas ou est privé.</p>
    </div>
  );

  const mergedProfile = portfolio
    ? {
        ...(portfolio.profile_data || portfolio.profile || {}),
        projects: portfolio.projects || [],
        is_young_talent: portfolio.profile_data?.is_young_talent || false,
        looking_for_opportunity: portfolio.profile_data?.looking_for_opportunity || false,
        university: portfolio.profile_data?.university || null,
        field_of_study: portfolio.profile_data?.field_of_study || null,
        study_level: portfolio.profile_data?.study_level || null,
      }
    : null;

  const accent = portfolio?.accent_color || "#16B8B1";
  const ThemeComponent =
    portfolio?.theme && THEMES[portfolio.theme] ? THEMES[portfolio.theme] : MinimalTheme;

  /* ============================================================
     MODE MODAL
     ============================================================ */
  if (asModal) {
    return (
      <>
        {/* ✅ CV caché (invisible) : uniquement pour la capture PDF */}
        {mergedProfile && (
          <div
            ref={cvRef}
            data-cv-ref
            aria-hidden="true"
            style={{
              position: "fixed",
              top: 0,
              left: "-10000px",
              width: 900,
              background: "#ffffff",
              zIndex: -1,
            }}
          >
            <CVPortfolio portfolio={portfolio} profile={mergedProfile} accent={accent} />
          </div>
        )}

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu public du portfolio"
        >
          <button
            type="button"
            aria-label="Fermer l'aperçu"
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1F33]/60 backdrop-blur-sm"
          />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Barre d'actions flottante */}
            <div className="flex items-center justify-end gap-2 border-b border-[#E8EEF3] bg-[#F9FBFC] px-4 py-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EBF1] bg-white px-3 py-1.5 text-xs font-semibold text-[#334B63] transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {copied ? <Check size={13} /> : <Share2 size={13} />}
                  {copied ? "Copié !" : "Partager"}
                </button>

                <button
                  type="button"
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F33] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#17284B] disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      Télécharger PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA] hover:text-[#0B1F33]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Corps scrollable — affiche le thème choisi */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F8FA]">
              {loading ? (
                loadingView
              ) : error || !portfolio ? (
                errorView
              ) : (
                <ThemeComponent
                  portfolio={portfolio}
                  profile={mergedProfile}
                  accent={accent}
                />
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------- États de chargement / erreur (mode page) ---------- */
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Chargement...
      </div>
    );

  if (error || !portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-slate-400">
        <p className="text-xl">Portfolio introuvable</p>
        <p className="mt-2 text-sm">Ce portfolio n'existe pas ou est privé.</p>
      </div>
    );
  }

  const isOwner =
    portfolio.is_owner || (user && user.id === portfolio.profile_data?.user_id);

  /* ============================================================
     VUE PROPRIÉTAIRE (page) — juste un bouton retour
     ============================================================ */
  if (isOwner) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[#E4EBF1] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-[#0B1F33]">Ton portfolio public</h1>
            <p className="mt-1 text-sm text-[#64788C]">
              Ouvre l'aperçu depuis ta page profil pour le voir en modal.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E4EBF1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F33] transition hover:bg-[#F5F8FA]"
            >
              <LayoutDashboard size={15} />
              Retour au profil
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ============================================================
     VUE PUBLIQUE (visiteur externe)
     ============================================================ */
  return (
    <>
      {/* ✅ CV caché : pour la génération PDF en mode page publique */}
      {mergedProfile && (
        <div
          ref={cvRef}
          data-cv-ref
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            width: 900,
            background: "#ffffff",
            zIndex: -1,
          }}
        >
          <CVPortfolio portfolio={portfolio} profile={mergedProfile} accent={accent} />
        </div>
      )}

      <div className="min-h-screen bg-[#F5F8FA]">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 text-[#0B1F33] backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <Circle size={12} strokeWidth={3} />
            </span>
            TalentShare
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-[#0B1F33] transition hover:border-emerald-300 disabled:opacity-60 sm:flex"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              PDF
            </button>

            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-full bg-[#0B1F33] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#17284B]"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}{" "}
              {copied ? "Lien copié !" : "Partager"}
            </button>
          </div>
        </header>

        {mergedProfile?.is_young_talent && (
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

        <ThemeComponent portfolio={portfolio} profile={mergedProfile} accent={accent} />
      </div>
    </>
  );
}