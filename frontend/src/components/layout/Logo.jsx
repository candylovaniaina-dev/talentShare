// src/components/layout/Logo.jsx
import React, { useEffect, useId } from "react";

/* Police de marque (style techno arrondi, comme "Automated Skill Alignment") */
export const BRAND_FONT =
  "'Orbitron', 'Exo 2', ui-sans-serif, system-ui, sans-serif";

const FONT_LINK_ID = "ts-brand-font";

export function useBrandFont() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Symbole : trois nœuds reliés qui montent                           */
/*  Share (petit) → Connect (moyen) → Grow (grand)                     */
/* ------------------------------------------------------------------ */
export function LogoMark({ size = 44, className = "" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Logo TalentShare"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#17405F" />
          <stop offset="1" stopColor="#0B1F33" />
        </linearGradient>
        <linearGradient id={`line-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#16B8B1" />
          <stop offset="1" stopColor="#8DF0DC" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8DF0DC" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8DF0DC" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="14"
        fill={`url(#bg-${uid})`}
        stroke="#16B8B1"
        strokeOpacity="0.45"
      />

      {/* halo sur le nœud "Grow" */}
      <circle cx="35" cy="14" r="12" fill={`url(#glow-${uid})`} />

      {/* trajectoire */}
      <path
        d="M12 35 C 19 35, 19 24, 25 24 S 31 14, 35 14"
        fill="none"
        stroke={`url(#line-${uid})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* nœuds */}
      <circle cx="12" cy="35" r="3.6" fill="#FFFFFF" />
      <circle cx="25" cy="24" r="4.4" fill="#16B8B1" />
      <circle cx="35" cy="14" r="5.6" fill="#8DF0DC" />
      <circle cx="35" cy="14" r="2" fill="#0B1F33" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Slogan : Share Connect Grow  (initiales en couleur)                */
/* ------------------------------------------------------------------ */
export function Slogan({ onDark = true, className = "" }) {
  useBrandFont();
  const accent = onDark ? "#16B8B1" : "#0E9F8E";
  const base = onDark ? "rgba(255,255,255,0.72)" : "#526B83";

  return (
    <span
      className={`inline-flex items-baseline gap-[0.55em] font-semibold tracking-[0.04em] ${className}`}
      style={{ fontFamily: BRAND_FONT, color: base }}
    >
      {["Share", "Connect", "Grow"].map((word) => (
        <span key={word}>
          <span style={{ color: accent }} className="font-extrabold">
            {word[0]}
          </span>
          {word.slice(1)}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo complet                                                       */
/*  onDark = true  → fond sombre (sidebar)                             */
/*  onDark = false → fond clair (navbar publique, footer)              */
/* ------------------------------------------------------------------ */
export default function Logo({
  size = 44,
  compact = false,
  onDark = true,
  showSlogan = true,
  className = "",
}) {
  useBrandFont();
  const accent = onDark ? "#16B8B1" : "#0E9F8E";
  const ink = onDark ? "#FFFFFF" : "#0B1F33";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />

      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className="text-[18px] font-bold tracking-[0.02em]"
            style={{ fontFamily: BRAND_FONT, color: ink }}
          >
            <span style={{ color: accent }}>T</span>alent
            <span style={{ color: accent }}>S</span>hare
          </span>

          {showSlogan && (
            <Slogan onDark={onDark} className="mt-1.5 text-[8.5px]" />
          )}
        </span>
      )}
    </span>
  );
}