import React, { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export default function InterviewRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null); // ✅ On garde une référence à l'API Jitsi

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
          // ✅ DÉSACTIVE L'ÉCRAN DE PRÉVISUALISATION (Pre-join screen)
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_JITSI_WATERMARK: false,
          // ✅ ON CACHE LA BARRE D'EN-TÊTE DE JITSI (logo, nom de la salle)
          DEFAULT_BACKGROUND: "#0B1F33",
          HIDE_INVITE_MORE_HEADER: true,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        },
        userInfo: {
          email: candidateEmail,
          displayName: candidateName,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Écouter l'événement de fermeture pour rediriger
      apiRef.current.addEventListener("videoConferenceLeft", () => {
        navigate(-1);
      });
    };

    document.body.appendChild(script);

    return () => {
      // ✅ Nettoyage propre : on supprime le script et on détruit l'API Jitsi
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomId, candidateName, candidateEmail, navigate]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0B1F33]">
      {/* Barre d'info en haut (la tienne) */}
      <div className="flex items-center justify-between bg-[#0B1F33] px-6 py-3 text-white shadow-md z-10">
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