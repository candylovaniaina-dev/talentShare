import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

export default function SuccessModal({
  open,
  onClose,
  title = "Candidature envoyée !",
  message,
  primaryLabel = "Voir mes candidatures",
  primaryLink = "/my-activity",
}) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (!open) return;
    // ✅ Couleurs des confettis (Turquoise, Bleu Marine, Ambre, Violet...)
    const colors = ["#16B8B1", "#0F9691", "#0B1F33", "#F59E0B", "#8B5CF6", "#3B82F6", "#EC4899"];
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }));
    setConfetti(items);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay sombre */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/70 backdrop-blur-sm"
      />

      {/* Confettis 🎉 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute animate-confetti"
            style={{
              left: `${c.left}%`,
              top: "-20px",
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: c.shape === "circle" ? "50%" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      {/* Contenu de la modale */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#131E47]">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA] dark:text-slate-400 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
          {/* ✅ Check animé */}
          <div className="relative mb-6">
            {/* Anneaux pulsants */}
            <span className="absolute inset-0 animate-ping-slow rounded-full bg-[#16B8B1]/30" />
            <span className="absolute inset-0 animate-ping-slower rounded-full bg-[#16B8B1]/20" />

            {/* Check principal avec dégradé Turquoise */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#16B8B1] to-[#0F9691] shadow-2xl shadow-[#16B8B1]/40 animate-pop">
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B1F33"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
              >
                <polyline points="4 12 10 18 20 6" />
              </svg>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white">
            {title}
          </h2>

          {/* Message */}
          {message && (
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#64788C] dark:text-slate-400">
              {message}
            </p>
          )}

          {/* Badge "Bonne chance" en Turquoise */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#16B8B1]/30 bg-[#16B8B1]/10 px-3 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9691] dark:text-[#16B8B1]">
              Bonne chance !
            </span>
          </div>

          {/* Boutons */}
          <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={primaryLink}
              onClick={onClose}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16B8B1] hover:text-[#0B1F33] dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]"
            >
              {primaryLabel}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DDE7EF] bg-white px-5 py-3 text-sm font-bold text-[#334B63] transition hover:bg-[#F6F9FB] dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}