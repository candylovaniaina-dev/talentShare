import UniversityForm from "../components/UniversityForm";
import universityService from "../services/universityService";

export default function CreateUniversity() {
    const handleSubmit = async (data) => {
        return await universityService.create(data);
    };

    return (
        <UniversityForm
            onSubmit={handleSubmit}
            submitLabel="Créer l'université"
            isEdit={false}
        />
    );
}