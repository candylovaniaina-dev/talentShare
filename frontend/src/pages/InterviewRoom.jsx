import React, { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export default function InterviewRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  
  const candidateName = searchParams.get("name") || "Candidat";
  const candidateEmail = searchParams.get("email") || "";
  const userRole = searchParams.get("role") || "candidate";

  useEffect(() => {
    // ✅ On charge le script de l'API Jitsi
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
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_JITSI_WATERMARK: false,
        },
        // ✅ C'EST ICI QUE TOUT SE JOUE
        userInfo: {
          email: candidateEmail,
          displayName: candidateName,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      // (Optionnel) Écouter l'événement de fermeture pour rediriger
      api.addEventListener("videoConferenceLeft", () => {
        navigate(-1);
      });

      return () => {
        api.dispose();
      };
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomId, candidateName, candidateEmail, navigate]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0B1F33]">
      {/* Barre d'info en haut (optionnelle mais sympa) */}
      <div className="flex items-center justify-between bg-[#0B1F33] px-6 py-3 text-white shadow-md">
        <div>
          <h1 className="text-sm font-bold">TalentShare — Entretien</h1>
          <p className="text-xs text-white/60">Connecté en tant que {candidateName}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20"
        >
          Quitter
        </button>
      </div>

      {/* Le conteneur où Jitsi va s'injecter */}
      <div ref={jitsiContainerRef} className="flex-1" />
    </div>
  );
}