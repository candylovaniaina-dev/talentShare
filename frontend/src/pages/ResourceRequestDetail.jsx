import React from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import RequestDetailModal from "../components/requests/RequestDetailModal";

export default function ResourceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleClose = () => navigate(-1);

  return (
    <AppShell>
      {/* On garde un fond d'écran neutre ou l'AppShell en arrière-plan */}
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1F33]" />
      
      {/* ✅ TÉLÉPORTATION DU MODAL DANS LE BODY */}
      {createPortal(
        <div translate="no" className="relative z-[100]">
          <RequestDetailModal
            requestId={id}
            autoOpenCandidates={searchParams.get("candidates") === "1"}
            onClose={handleClose}
          />
        </div>,
        document.body
      )}
    </AppShell>
  );
}