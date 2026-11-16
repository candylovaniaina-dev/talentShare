import React, { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ On importe l'auth

export default function InterviewRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const { user } = useAuth(); // ✅ On récupère l'utilisateur connecté

  // On priorise les infos de l'URL (envoyées par le backend), sinon celles de l'utilisateur connecté
  const displayName = searchParams.get("name") || user?.name || "Participant";
  const displayEmail = searchParams.get("email") || user?.email || "";
  const userRole = searchParams.get("role") || "candidate";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    
    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;

      const domain = "meet.jit.si";
          const options = {
        roomName: roomId,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: false,
          enableEmailInStats: false,
          
          // ✅ Nouvelle syntaxe pour ignorer l'écran de pré-join
          prejoinConfig: {
            enabled: false
          },
          
          // ✅ Pour cacher ta propre miniature
          disableSelfView: true,
          disableSelfViewSettings: true,
        },
        interfaceConfigOverwrite: {
          // ... ton interfaceConfigOverwrite actuel
        },
        userInfo: {
          email: displayEmail,
          displayName: displayName,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListener("videoConferenceLeft", () => {
        navigate(-1);
      });
    };

    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomId, displayName, displayEmail, navigate]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0B1F33]">
      <div className="flex items-center justify-between bg-[#0B1F33] px-6 py-3 text-white shadow-md z-10">
        <div>
          <h1 className="text-sm font-bold">TalentShare — Entretien</h1>
          <p className="text-xs text-white/60">Connecté en tant que {displayName}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20"
        >
          Quitter
        </button>
      </div>

      <div ref={jitsiContainerRef} className="flex-1" />
    </div>
  );
}