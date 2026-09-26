import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, MapPin, Globe, CheckCircle, Building2, Loader2 } from "lucide-react";
import universityService from "../services/universityService";

export default function Universities() {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        fetchUniversities();
    }, [page]);

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            const data = await universityService.list({ page, per_page: 12, search });
            setUniversities(data.data || []);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                total: data.total,
            });
        } catch (err) {
            console.error("Erreur:", err);
            setError("Impossible de charger les universités.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUniversities();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Universités
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Découvrez les établissements et leurs formations
                        </p>
                    </div>
                    <Link
                        to="/universities/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        Ajouter une université
                    </Link>
                </div>

                {/* Barre de recherche */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, ville ou pays..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </form>

                {/* Contenu */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-800 dark:text-red-200">
                        {error}
                    </div>
                ) : universities.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 size={60} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Aucune université trouvée.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Grille */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {universities.map((uni) => (
                                <UniversityCard key={uni.id} university={uni} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={pagination.current_page === 1}
                                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Précédent
                                </button>
                                <span className="text-slate-600 dark:text-slate-400">
                                    Page {pagination.current_page} / {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}

                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                            {pagination?.total} université(s) au total
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Carte université ────────────────────────────────── */
function UniversityCard({ university }) {
    return (
        <Link
            to={`/universities/${university.id}`}
            className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition group"
        >
            {/* Bandeau logo */}
            <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                {university.logo_path ? (
                    <img
                        src={university.logo_path}
                        alt={university.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Building2 size={48} className="text-white/80" />
                    </div>
                )}
                {university.is_verified && (
                    <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 rounded-full p-1.5">
                        <CheckCircle size={18} className="text-green-500" />
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div className="p-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {university.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {university.description || "Aucune description"}
                </p>

                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{university.city}, {university.country}</span>
                    </div>
                    {university.website && (
                        <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span className="truncate">{university.website}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}