
import React, { useEffect, useRef, useState } from "react";

const EMERALD = "#34d399";
const ROSE = "#fb7185";

const MESSAGES = {
  idle: "Salut ! Prêt à retrouver vos talents ?",
  email: "Je note votre adresse…",
  hide: "Je ne regarde pas, promis.",
  peek: "Bon, je jette juste un œil…",
  error: "Oups, identifiants incorrects.",
  loading: "Je vérifie ça, un instant…",
};

const MOUTHS = {
  idle: "M130 168 Q150 182 170 168",
  email: "M126 166 Q150 188 174 166",
  hide: "M138 172 Q150 178 162 172",
  peek: "M132 172 Q152 184 170 166",
  error: "M130 180 Q150 162 170 180",
  loading: "M144 174 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0",
};

export default function RobotMascot({ mode = "idle" }) {
  const svgRef = useRef(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event) => {
      const element = svgRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.4;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const power = Math.min(distance / 250, 1) * 9;

      setLook({
        x: (dx / distance) * power,
        y: (dy / distance) * power * 0.8,
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  let pupil = look;
  if (mode === "email") pupil = { x: 5, y: 6 };
  if (mode === "peek") pupil = { x: 6, y: 6 };
  if (mode === "error") pupil = { x: 0, y: 0 };

  const eyeColor = mode === "error" ? ROSE : EMERALD;
  const coverLeft = mode === "hide" || mode === "peek";
  const coverRight = mode === "hide";

  const handL = coverLeft ? { x: 115, y: 130 } : { x: 52, y: 262 };
  const handR = coverRight ? { x: 185, y: 130 } : { x: 248, y: 262 };

  const handStyle = (position) => ({
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: "transform .45s cubic-bezier(.34,1.4,.64,1)",
  });

  return (
    <div className="relative flex flex-col items-center">
      <style>{`
        @keyframes rb-float {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }
        @keyframes rb-blink {
          0%,92%,100% { transform: scaleY(1) }
          95% { transform: scaleY(.08) }
        }
        @keyframes rb-scan {
          from { transform: translateX(-8px) }
          to { transform: translateX(8px) }
        }
        @keyframes rb-pulse {
          0%,100% { opacity: 1 }
          50% { opacity: .35 }
        }
        @keyframes rb-shake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-10px) }
          40% { transform: translateX(10px) }
          60% { transform: translateX(-6px) }
          80% { transform: translateX(6px) }
        }
        @keyframes rb-pop {
          from { opacity: 0; transform: translateY(6px) }
          to { opacity: 1; transform: translateY(0) }
        }
        .rb-float { animation: rb-float 4s ease-in-out infinite }
        .rb-blink {
          transform-box: fill-box;
          transform-origin: center;
          animation: rb-blink 4.5s infinite;
        }
        .rb-scan { animation: rb-scan .9s ease-in-out infinite alternate }
        .rb-pulse { animation: rb-pulse 1.8s ease-in-out infinite }
        .rb-shake { animation: rb-shake .5s ease-in-out }
        .rb-pop { animation: rb-pop .35s ease-out }
        @media (prefers-reduced-motion: reduce) {
          .rb-float, .rb-blink, .rb-scan, .rb-pulse,
          .rb-shake, .rb-pop {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute top-12 h-52 w-52 rounded-full bg-emerald-500/15 blur-[70px] sm:top-16 sm:h-72 sm:w-72 sm:blur-[90px]" />

      <div
        key={mode}
        aria-live="polite"
        className="rb-pop relative z-10 mb-2 max-w-[90vw] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-center text-xs font-medium text-slate-200 shadow-lg backdrop-blur-xl sm:text-sm"
      >
        {MESSAGES[mode] || MESSAGES.idle}
      </div>

      <div className={mode === "error" ? "rb-shake" : ""}>
        <svg
          ref={svgRef}
          viewBox="0 0 300 345"
          role="img"
          aria-label={`Robot assistant : ${MESSAGES[mode] || MESSAGES.idle}`}
          className="relative z-10 w-[160px] drop-shadow-2xl sm:w-[190px] xl:w-[220px]"
        >
          <defs>
            <linearGradient id="rbHead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0F1E45" />
            </linearGradient>
            <linearGradient id="rbBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16295e" />
              <stop offset="100%" stopColor="#0c1836" />
            </linearGradient>
            <linearGradient id="rbHand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a4494" />
              <stop offset="100%" stopColor="#162a5e" />
            </linearGradient>
          </defs>

          <ellipse cx="150" cy="335" rx="70" ry="7" fill="#000" opacity=".35" />

          <g className="rb-float">
            <line
              x1="150"
              y1="62"
              x2="150"
              y2="34"
              stroke="#3b5cb8"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="150"
              cy="26"
              r="9"
              fill={eyeColor}
              className="rb-pulse"
            />

            <rect
              x="34"
              y="108"
              width="18"
              height="58"
              rx="9"
              fill="#1b2f6b"
              stroke={EMERALD}
              strokeOpacity=".35"
            />
            <rect
              x="248"
              y="108"
              width="18"
              height="58"
              rx="9"
              fill="#1b2f6b"
              stroke={EMERALD}
              strokeOpacity=".35"
            />

            <rect x="130" y="206" width="40" height="18" fill="#0F1E45" />
            <rect
              x="88"
              y="218"
              width="124"
              height="92"
              rx="34"
              fill="url(#rbBody)"
              stroke="#fff"
              strokeOpacity=".1"
            />
            <circle
              cx="150"
              cy="262"
              r="17"
              fill="#071028"
              stroke={EMERALD}
              strokeOpacity=".5"
            />
            <circle
              cx="150"
              cy="262"
              r="7"
              fill={EMERALD}
              className="rb-pulse"
            />

            <rect
              x="50"
              y="60"
              width="200"
              height="150"
              rx="46"
              fill="url(#rbHead)"
              stroke="#fff"
              strokeOpacity=".12"
              strokeWidth="2"
            />
            <rect
              x="72"
              y="86"
              width="156"
              height="104"
              rx="32"
              fill="#050B1E"
              stroke={EMERALD}
              strokeOpacity=".2"
            />

            {[115, 185].map((cx) => (
              <g key={cx} transform={`translate(${cx} 128)`}>
                <g className="rb-blink">
                  <circle
                    r="23"
                    fill="#0A1229"
                    stroke={eyeColor}
                    strokeOpacity=".35"
                  />
                  <g className={mode === "loading" ? "rb-scan" : ""}>
                    <g
                      style={{
                        transform: `translate(${pupil.x}px, ${pupil.y}px)`,
                        transition: "transform .15s ease-out",
                      }}
                    >
                      <circle r="11" fill={eyeColor} />
                      <circle
                        cx="-3.5"
                        cy="-3.5"
                        r="3.2"
                        fill="#fff"
                        opacity=".85"
                      />
                    </g>
                  </g>
                </g>
              </g>
            ))}

            <path
              d={MOUTHS[mode] || MOUTHS.idle}
              fill="none"
              stroke={eyeColor}
              strokeWidth="5"
              strokeLinecap="round"
            />

            <g style={handStyle(handL)}>
              <rect
                x="-26"
                y="-19"
                width="52"
                height="38"
                rx="17"
                fill="url(#rbHand)"
                stroke={EMERALD}
                strokeOpacity=".5"
              />
              <line
                x1="-9"
                y1="-7"
                x2="-9"
                y2="7"
                stroke={EMERALD}
                strokeOpacity=".4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="4"
                y1="-7"
                x2="4"
                y2="7"
                stroke={EMERALD}
                strokeOpacity=".4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            <g style={handStyle(handR)}>
              <rect
                x="-26"
                y="-19"
                width="52"
                height="38"
                rx="17"
                fill="url(#rbHand)"
                stroke={EMERALD}
                strokeOpacity=".5"
              />
              <line
                x1="-4"
                y1="-7"
                x2="-4"
                y2="7"
                stroke={EMERALD}
                strokeOpacity=".4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="-7"
                x2="9"
                y2="7"
                stroke={EMERALD}
                strokeOpacity=".4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
