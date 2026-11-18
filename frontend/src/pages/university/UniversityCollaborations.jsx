import React from "react";
import { useSearchParams } from "react-router-dom";
import { Embedded, PageHead, Tabs } from "./ui";
import UniversityPartners from "./UniversityPartners";
import UniversityConventions from "./UniversityConventions";
import UniversityOpportunities from "./UniversityOpportunities";

/** Une seule page « Collaborations » : partenaires, conventions et offres diffusées en onglets. */
export default function UniversityCollaborations() {
  const [sp, setSp] = useSearchParams();
  const tab = ["partners", "conventions", "offers"].includes(sp.get("tab")) ? sp.get("tab") : "partners";
  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHead title="Collaborations" subtitle="Vos entreprises partenaires, les conventions de stage et les offres diffusées à vos étudiants." />
      <Tabs value={tab} onChange={(t) => setSp({ tab: t })} tabs={[{ id: "partners", label: "Entreprises partenaires" }, { id: "conventions", label: "Conventions" }, { id: "offers", label: "Offres diffusées" }]} />
      <div className="mt-5">
        <Embedded.Provider value={true}>
          {tab === "partners" && <UniversityPartners />}
          {tab === "conventions" && <UniversityConventions />}
          {tab === "offers" && <UniversityOpportunities />}
        </Embedded.Provider>
      </div>
    </div>
  );
}
