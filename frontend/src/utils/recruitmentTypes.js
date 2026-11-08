// Types proposés à la création d'un recrutement
export const RECRUITMENT_TYPES = [
  { value: "internship",     label: "Stage",                 hint: "Durée déterminée",     group: "internship" },
  { value: "apprenticeship", label: "Alternance",            hint: "Durée déterminée",     group: "internship" },
  { value: "junior_mission", label: "Mission junior",        hint: "Ponctuelle",           group: "mission" },
  { value: "first_job",      label: "Emploi à plein temps",  hint: "CDI · essai d'1 mois", group: "permanent" }, // ✅ Modifié ici
  { value: "permanent",      label: "Recrutement permanent", hint: "CDI · tous profils",   group: "permanent" },
];

// Types encore acceptés par le backend mais non proposés à la création
const LEGACY_TYPES = [
  { value: "student_project", label: "Projet étudiant", group: "internship" },
  { value: "freelance",       label: "Freelance",       group: "mission" },
  { value: "fixed_term",      label: "CDD",             group: "mission" },
];

const ALL_TYPES = [...RECRUITMENT_TYPES, ...LEGACY_TYPES];

export const RECRUITMENT_LABELS = Object.fromEntries(ALL_TYPES.map((t) => [t.value, t.label]));

export const getRecruitmentLabel = (value) => RECRUITMENT_LABELS[value] || value || "Recrutement";

// Groupes utilisés par les filtres : internship | mission | permanent
export const getRecruitmentGroup = (value) =>
  ALL_TYPES.find((t) => t.value === value)?.group || "permanent";