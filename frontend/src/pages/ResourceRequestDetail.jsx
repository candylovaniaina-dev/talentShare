import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import RequestDetailModal from "../components/requests/RequestDetailModal";

export default function ResourceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const autoOpenCandidates = searchParams.get("candidates") === "1";

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        {/* 
          On place le modal ici, il va s'ouvrir automatiquement. 
          On n'a pas besoin du texte "Ouverture de la demande..." 
          car le modal va charger ses propres données.
        */}
        <RequestDetailModal
          requestId={id}
          autoOpenCandidates={autoOpenCandidates}
          onClose={() => navigate(-1)}
        />
      </div>
    </AppShell>
  );
}