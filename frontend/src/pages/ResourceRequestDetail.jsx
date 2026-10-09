import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import RequestDetailModal from "../components/requests/RequestDetailModal";

export default function ResourceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Si ?candidates=1 → ouvrir automatiquement les candidats
  const autoOpenCandidates = searchParams.get("candidates") === "1";

  return (
    <AppShell>
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">
          Ouverture de la demande...
        </p>
      </div>

      <RequestDetailModal
        requestId={id}
        autoOpenCandidates={autoOpenCandidates}
        onClose={() => navigate(-1)}
      />
    </AppShell>
  );
}