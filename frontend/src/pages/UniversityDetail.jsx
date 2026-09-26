import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Globe, Mail, Phone, CheckCircle, Building2, ArrowLeft, Loader2, Pencil, GraduationCap } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import universityService from "../services/universityService";

// Fix pour les icônes Leaflet (bug connu avec Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function UniversityDetail() {
    const { id } = useParams();
    const [university, setUniversity] = useState(null);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [uniData, facData] = await Promise.all([
                universityService.show(id),
                universityService.listFaculties(id),
            ]);
            setUniversity(uniData);
            setFaculties(facData.data || []);
        } catch (err) {
            console.error("Erreur:", err);
            setError("Impossible de charger cette université.");
        } finally {
            setLoading(false);
        }
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
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || "Université introuvable."}</p>
                    <Link to="/universities" className="text-blue-600 hover:underline">
                        ← Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const hasLocation = university.latitude && university.longitude;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Bandeau */}
            <div className="h-64 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 size={80} className="text-white/40" />
                </div>
                <Link
                    to="/universities"
                    className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition"
                >
                    <ArrowLeft size={18} />
                    Retour
                </Link>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
                {/* En-tête */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {university.name}
                                </h1>
                                {university.is_verified && (
                                    <CheckCircle size={24} className="text-green-500" title="Vérifiée" />
                                )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                {university.description || "Aucune description"}
                            </p>
                        </div>
                        <Link
                            to={`/universities/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Pencil size={16} />
                            Modifier
                        </Link>
                    </div>

                    {/* Infos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <InfoItem icon={<MapPin size={18} />} label="Localisation" value={`${university.city}, ${university.country}`} />
                        {university.address && <InfoItem icon={<MapPin size={18} />} label="Adresse" value={university.address} />}
                        {university.website && <InfoItem icon={<Globe size={18} />} label="Site web" value={university.website} link={university.website} />}
                        {university.email && <InfoItem icon={<Mail size={18} />} label="Email" value={university.email} />}
                        {university.phone && <InfoItem icon={<Phone size={18} />} label="Téléphone" value={university.phone} />}
                    </div>
                </div>

                {/* Carte Leaflet */}
                {hasLocation && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Localisation</h2>
                        </div>
                        <div className="h-80">
                            <MapContainer
                                center={[university.latitude, university.longitude]}
                                zoom={13}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[university.latitude, university.longitude]}>
                                    <Popup>{university.name}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Facultés */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <GraduationCap size={20} />
                            Facultés ({faculties.length})
                        </h2>
                    </div>

                    {faculties.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                            Aucune faculté enregistrée pour cette université.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {faculties.map((faculty) => (
                                <div
                                    key={faculty.id}
                                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition"
                                >
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                        {faculty.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {faculty.description || "Aucune description"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value, link }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-slate-400 mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{label}</p>
                {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {value}
                    </a>
                ) : (
                    <p className="text-slate-900 dark:text-white">{value}</p>
                )}
            </div>
        </div>
    );
}