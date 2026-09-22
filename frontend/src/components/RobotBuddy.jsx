import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";

const EMERALD = "#34d399";
const AMBER = "#fbbf24";
const ROSE = "#fb7185";

const ROLE_META = {
  company: { icon: Building2, label: "Entreprise" },
  employee: { icon: Users, label: "Talent / salarié" },
  student: { icon: GraduationCap, label: "Étudiant / diplômé" },
  university: { icon: Sparkles, label: "Université" },
};

const MESSAGES = {
  look: "Je vous écoute…",
  closed: "Mot de passe : je ferme les yeux.",
  confirm: "Encore une fois, pour être sûr.",
  match: "Parfait, ils correspondent !",
  mismatch: "Hmm, ils ne correspondent pas.",
  error: "Oups, une erreur est survenue.",
  loading: "Je crée votre accès…",
};

export default function RobotBuddy({ mode = "idle", role = "employee" }) {
  const svgRef = useRef(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  // Les yeux suivent la souris
  useEffect(() => {
    const onMove = (e) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const power = Math.min(dist / 250, 1) * 7;
      setLook({ x: (dx / dist) * power, y: (dy / dist) * power * 0.7 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const meta = ROLE_META[role] || ROLE_META.employee;
  const message = mode === "idle" ? `Profil choisi : ${meta.label}` : MESSAGES[mode];

  const color = mode === "error" ? ROSE : mode === "mismatch" ? AMBER : EMERALD;

  // Position des pupilles selon l'état
  let eye = look;
  if (mode === "look") eye = { x: 7, y: 2 };
  if (mode === "confirm") eye = { x: 5, y: 6 };
  if (mode === "mismatch") eye = { x: 0, y: 3 };

  // Icône de la puce holographique
  let ChipIcon = meta.icon;
  if (mode === "closed") ChipIcon = Lock;
  if (mode === "match") ChipIcon = Check;
  if (mode === "mismatch" || mode === "error") ChipIcon = AlertCircle;

  const renderEye = (s) => {
    const cx = 150 + s * 34;
    let shape;

    if (mode === "match") {
      shape = (
        <path d="M-14 6 Q0 -14 14 6" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
      );
    } else if (mode === "error") {
      shape = (
        <path
          d={`M${12 * s} -11 L${-10 * s} 0 L${12 * s} 11`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    } else if (mode === "closed") {
      shape = (
        <line x1="-13" y1="2" x2="13" y2="2" stroke={color} strokeWidth="7" strokeLinecap="round" />
      );
    } else {
      shape = (
        <g className={mode === "loading" ? "rb2-scan" : ""}>
          <g
            style={{
              transform: `translate(${eye.x}px, ${eye.y}px) rotate(${
                mode === "mismatch" ? -s * 14 : 0
              }deg)`,
              transition: "transform .15s ease-out",
            }}
          >
            <g className="rb2-blink">
              <rect x="-11" y="-17" width="22" height="34" rx="11" fill={color} style={{ transition: "fill .3s" }} />
              <rect x="-6" y="-12" width="5" height="9" rx="2.5" fill="#fff" opacity=".8" />
            </g>
          </g>
        </g>
      );
    }

    return (
      <g key={s} transform={`translate(${cx} 115)`}>
        {shape}
      </g>
    );
  };

  const cheer = mode === "match";

  return (
    <div className="relative flex flex-col items-center">
      <style>{`
        @keyframes rb2-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
        @keyframes rb2-shadow { 0%,100% { transform: scaleX(1); opacity: .35 } 50% { transform: scaleX(.8); opacity: .2 } }
        @keyframes rb2-blink { 0%,93%,100% { transform: scaleY(1) } 96% { transform: scaleY(.1) } }
        @keyframes rb2-scan { from { transform: translateX(-8px) } to { transform: translateX(8px) } }
        @keyframes rb2-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        @keyframes rb2-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-10px) } 40% { transform: translateX(10px) } 60% { transform: translateX(-6px) } 80% { transform: translateX(6px) } }
        @keyframes rb2-pop { from { opacity: 0; transform: translateY(6px) scale(.9) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes rb2-wave {
          0%,55%,100% { transform: rotate(0deg) }
          62% { transform: rotate(-115deg) }
          70% { transform: rotate(-92deg) }
          78% { transform: rotate(-120deg) }
          86% { transform: rotate(-92deg) }
          94% { transform: rotate(-115deg) }
        }
        @keyframes rb2-cheer-r { from { transform: rotate(-105deg) } to { transform: rotate(-135deg) } }
        @keyframes rb2-cheer-l { from { transform: rotate(105deg) } to { transform: rotate(135deg) } }
        .rb2-float { animation: rb2-float 4s ease-in-out infinite; }
        .rb2-shadow { transform-box: fill-box; transform-origin: center; animation: rb2-shadow 4s ease-in-out infinite; }
        .rb2-blink { transform-box: fill-box; transform-origin: center; animation: rb2-blink 5s infinite; }
        .rb2-scan { animation: rb2-scan .8s ease-in-out infinite alternate; }
        .rb2-pulse { animation: rb2-pulse 1.8s ease-in-out infinite; }
        .rb2-shake { animation: rb2-shake .5s ease-in-out; }
        .rb2-pop { animation: rb2-pop .35s ease-out; }
        .rb2-arm { transform-origin: 0 0; }
        .rb2-wave { animation: rb2-wave 6s ease-in-out infinite; }
        .rb2-cheer-r { animation: rb2-cheer-r .45s ease-in-out infinite alternate; }
        .rb2-cheer-l { animation: rb2-cheer-l .45s ease-in-out infinite alternate; }
      `}</style>

      {/* Glow derrière le robot */}
      <div className="pointer-events-none absolute top-12 h-64 w-64 rounded-full bg-emerald-500/15 blur-[80px]" />

      {/* Bulle de texte */}
      <div
        key={`${mode}-${role}`}
        className="rb2-pop relative z-10 mb-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-xl"
      >
        {message}
      </div>

      <div className={`relative ${mode === "error" ? "rb2-shake" : ""}`}>
        {/* Puce holographique (rôle / état) */}
        <div
          key={`chip-${mode}-${role}`}
          className="rb2-pop absolute -right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border bg-[#0A1229]/70 backdrop-blur-md"
          style={{ borderColor: `${color}66`, color, boxShadow: `0 0 24px ${color}33` }}
        >
          <ChipIcon size={20} />
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 300 330"
          className="relative z-10 w-[190px] drop-shadow-2xl xl:w-[210px]"
        >
          <defs>
            <linearGradient id="rb2Shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#b6c2d6" />
            </linearGradient>
          </defs>

          {/* Ombre au sol */}
          <ellipse className="rb2-shadow" cx="150" cy="316" rx="62" ry="7" fill="#000" />

          <g className="rb2-float">
            {/* Cou */}
            <rect x="136" y="182" width="28" height="18" fill="#8391ab" />

            {/* Corps */}
            <rect x="108" y="196" width="84" height="94" rx="42" fill="url(#rb2Shell)" />
            <rect x="126" y="228" width="48" height="28" rx="14" fill="#0F1E45" stroke={color} strokeOpacity=".5" />
            <circle cx="150" cy="242" r="5" fill={color} className="rb2-pulse" style={{ transition: "fill .3s" }} />

            {/* Bras gauche */}
            <g transform="translate(112 216) rotate(14)">
              <g className={`rb2-arm ${cheer ? "rb2-cheer-l" : ""}`}>
                <rect x="-9" y="0" width="18" height="52" rx="9" fill="url(#rb2Shell)" />
                <circle cx="0" cy="56" r="11" fill="#e2e8f0" stroke={color} strokeOpacity=".6" />
              </g>
            </g>

            {/* Bras droit (salue) */}
            <g transform="translate(188 216) rotate(-14)">
              <g className={`rb2-arm ${cheer ? "rb2-cheer-r" : mode === "idle" ? "rb2-wave" : ""}`}>
                <rect x="-9" y="0" width="18" height="52" rx="9" fill="url(#rb2Shell)" />
                <circle cx="0" cy="56" r="11" fill="#e2e8f0" stroke={color} strokeOpacity=".6" />
              </g>
            </g>

            {/* Oreilles */}
            <circle cx="50" cy="117" r="12" fill="#e2e8f0" />
            <circle cx="50" cy="117" r="4.5" fill={color} className="rb2-pulse" />
            <circle cx="250" cy="117" r="12" fill="#e2e8f0" />
            <circle cx="250" cy="117" r="4.5" fill={color} className="rb2-pulse" />

            {/* Tête */}
            <rect x="56" y="48" width="188" height="138" rx="66" fill="url(#rb2Shell)" />

            {/* Visière */}
            <rect x="78" y="78" width="144" height="78" rx="39" fill="#050B1E" stroke={color} strokeOpacity=".3" style={{ transition: "stroke .3s" }} />
            <path d="M98 92 Q150 80 202 92" stroke="#fff" strokeOpacity=".08" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Joues (quand content) */}
            {mode === "match" && (
              <>
                <ellipse cx="104" cy="140" rx="9" ry="5" fill={ROSE} opacity=".35" />
                <ellipse cx="196" cy="140" rx="9" ry="5" fill={ROSE} opacity=".35" />
              </>
            )}

            {/* Yeux */}
            {renderEye(-1)}
            {renderEye(1)}
          </g>
        </svg>
      </div>
    </div>
  );
}