import React from "react";

/**
 * Icône Messenger (logo rond avec éclair blanc).
 * Props :
 *  - size : taille en px (défaut 20)
 *  - withGradient : si true → affiche le dégradé bleu/violet du logo officiel
 *                   si false → utilise currentColor (utile dans un bouton gris)
 */
export default function MessengerIcon({ size = 20, withGradient = true, className = "" }) {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {withGradient && (
        <defs>
          <linearGradient id={gradientId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#00B2FF" />
            <stop offset="50%" stopColor="#006AFF" />
            <stop offset="100%" stopColor="#A033FF" />
          </linearGradient>
        </defs>
      )}
      <circle
        cx="18"
        cy="18"
        r="18"
        fill={withGradient ? `url(#${gradientId})` : "currentColor"}
      />
      {/* Éclair blanc */}
      <path
        d="M8.5 21.5L14.5 15L19 19.5L27.5 11L21.5 17.5L17 13L8.5 21.5Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}