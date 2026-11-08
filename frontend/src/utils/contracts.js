export const CONTRACTS = {
  internship:     { label: "Stage",             short: "Stagiaire",     group: "interns" },
  apprenticeship: { label: "Alternance",        short: "Alternant",     group: "interns" },
  fixed_term:     { label: "CDD",               short: "Salarié CDD",   group: "fixed" },
  permanent:      { label: "CDI",               short: "Salarié CDI",   group: "permanent" },
  sharing:        { label: "Partage de talent", short: "Talent prêté",  group: null },
};

const OFFER_TO_CONTRACT = {
  internship: "internship",
  apprenticeship: "apprenticeship",
  fixed_term: "fixed_term",
  permanent: "permanent",
  first_job: "permanent",
  junior_mission: "fixed_term",
  freelance: "fixed_term",
  student_project: "fixed_term",
};

/** Type de contrat d'une mission (avec repli pour les anciennes données) */
export function getContractType(mission) {
  if (!mission) return null;
  if (mission.contract_type && CONTRACTS[mission.contract_type]) return mission.contract_type;
  const fromOffer = OFFER_TO_CONTRACT[mission.job_offer?.offer_type];
  if (fromOffer) return fromOffer;
  if (mission.is_trial || mission.proposal?.contract_kind === "job") return "permanent";
  if (mission.supplying_company_id) return "sharing";
  return null;
}

/** Libellé du statut "en cours" selon le contrat */
export function activeLabel(type) {
  return {
    internship: "Stage en cours",
    apprenticeship: "Alternance en cours",
    fixed_term: "CDD en cours",
    permanent: "CDI en cours",
  }[type] || "En cours";
}

export function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "À définir";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "À définir" : d.toLocaleDateString("fr-FR", options);
}

/** "Fin prévue : …" ou "Sans date de fin (CDI)" */
export function endDateText(mission, type = getContractType(mission)) {
  if (mission?.end_at) return formatDate(mission.end_at);
  return type === "permanent" ? "Sans date de fin (CDI)" : "À définir";
}

export function monthsBetween(start, end) {
  if (!start || !end) return null;
  const a = new Date(start), b = new Date(end);
  const m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return m > 0 ? m : null;
}