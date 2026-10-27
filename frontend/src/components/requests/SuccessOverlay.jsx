import React, { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

/**
 * ✅ Overlay plein écran de succès avec coche animée
 *
 * Props :
 * - title      : string  → ex "Proposition envoyée !"
 * - subtitle   : string  → sous-titre (ex "Le recruteur sera notifié")
 * - duration   : number  → durée en ms avant auto-close (default 2500)
 * - onComplete : function → appelé après la durée
 */
export default function SuccessOverlay({
  title = "Succès !",
  subtitle = "",
  duration = 2500,
  onComplete,
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Fait apparaître avec un léger délai pour déclencher l'animation
    const showTimer = setTimeout(() => setVisible(true), 50);

    // Lance la sortie
    const leaveTimer = setTimeout(() => setLeaving(true), duration);

    // Termine et appelle le callback
    const endTimer = setTimeout(() => {
      onComplete?.();
    }, duration + 400);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(leaveTimer);
      clearTimeout(endTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md transition-opacity duration-400 dark:bg-black/70 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`relative flex flex-col items-center gap-6 transition-all duration-500 ${
          visible && !leaving
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0"
        }`}
      >
        {/* CERCLE VERRE */}
        <div className="relative">
          {/* Halo pulsé */}
          <div className="absolute inset-0 -m-6 animate-ping rounded-full bg-emerald-400/20 dark:bg-emerald-500/20" />

          {/* Cercle principal */}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] dark:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] sm:h-40 sm:w-40">
            {/* Coche blanche */}
            <Check
              size={72}
              strokeWidth={3.5}
              className="text-white drop-shadow-lg animate-[checkPop_0.6s_ease-out] sm:h-24 sm:w-24"
            />

            {/* Petite étincelle */}
            <Sparkles
              size={22}
              className="absolute -right-2 -top-2 text-amber-300 animate-[sparkle_1.5s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* TEXTE */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-3 max-w-md px-4 text-sm font-medium text-emerald-100 sm:text-base dark:text-slate-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ✅ Styles d'animation */}
      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(0); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0); opacity: 0.8; }
          50% { transform: scale(1.3) rotate(20deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}