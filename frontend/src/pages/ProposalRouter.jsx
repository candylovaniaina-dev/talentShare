import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import AppShell from "../components/layout/AppShell";
import { Spinner } from "../components/resource-sharing/shared";
import ProposalDetail from "./ProposalDetail";
import ResourceProposalDetail from "./ResourceProposalDetail";

/**
 * Route unique /proposals/:id :
 * - proposition entre entreprises (resource_offer_id) → nouvelle page
 * - tout le reste (flux classique / inversé)         → ProposalDetail inchangé
 */
const isCompanyToCompany = (p) => p && (p.resource_offer_id || (p.proposed_by_company_id && p.to_company_id));

export default function ProposalRouter() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, proposal: null });

  useEffect(() => {
    setState({ loading: true, proposal: null });
    api.get(`/proposals/${id}`)
      .then((r) => setState({ loading: false, proposal: r.data }))
      .catch(() => setState({ loading: false, proposal: null }));
  }, [id]);

  if (state.loading) return <AppShell><Spinner /></AppShell>;
  if (isCompanyToCompany(state.proposal)) {
    return <ResourceProposalDetail key={id} initial={state.proposal} />;
  }
  return <ProposalDetail />;
}