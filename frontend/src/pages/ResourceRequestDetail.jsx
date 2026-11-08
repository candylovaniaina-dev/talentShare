import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import RequestDetailModal from "../components/requests/RequestDetailModal";

export default function ResourceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        <RequestDetailModal
          requestId={id}
          autoOpenCandidates={searchParams.get("candidates") === "1"}
          onClose={() => navigate(-1)}
        />
      </div>
    </AppShell>
  );
}