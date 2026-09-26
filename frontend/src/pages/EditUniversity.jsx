import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import UniversityForm from "../components/UniversityForm";
import universityService from "../services/universityService";

export default function EditUniversity() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [university, setUniversity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUniversity();
    }, [id]);

    const fetchUniversity = async () => {
        try {
            const data = await universityService.show(id);
            setUniversity(data);
        } catch (err) {
            setError("Université introuvable.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        return await universityService.update(id, data);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error || !university) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p className="text-red-600">{error || "Erreur"}</p>
            </div>
        );
    }

    return (
        <UniversityForm
            initialData={university}
            onSubmit={handleSubmit}
            submitLabel="Enregistrer les modifications"
            isEdit={true}
        />
    );
}