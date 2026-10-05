import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Users, UserCheck, UserX, Clock, Search, Loader2,
    CheckCircle, XCircle, Mail, GraduationCap, Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import universityService from "../services/universityService";
import Toast from "../components/ui/Toast";

export default function UniversityStudents() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [universityId, setUniversityId] = useState(null);

    // Étape 1 : Récupérer l'université de l'utilisateur connecté
    useEffect(() => {
        const fetchMyUniversity = async () => {
            if (!user) return;
            try {
                const universities = await universityService.getMyUniversities();
                if (universities && universities.length > 0) {
                    setUniversityId(universities[0].id);
                } else {
                    setError("Vous n'avez aucune université.");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Erreur:", err);
                setError("Erreur lors du chargement de votre université.");
                setLoading(false);
            }
        };
        fetchMyUniversity();
    }, [user]);

    // Étape 2 : Une fois l'université récupérée, charger les étudiants
    useEffect(() => {
        if (universityId) {
            fetchData();
        }
    }, [universityId, statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const [studentsData, statsData] = await Promise.all([
                universityService.listStudents(universityId, params),
                universityService.getStudentStats(universityId),
            ]);

            setStudents(studentsData.data || []);
            setStats(statsData);
        } catch (err) {
            console.error("Erreur:", err);
            setError("Impossible de charger les étudiants.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleApprove = async (studentId) => {
        try {
            await universityService.approveStudent(universityId, studentId);
            setToast({ message: "Étudiant validé avec succès.", type: "success" });
            fetchData();
        } catch (err) {
            setToast({ message: "Erreur lors de la validation.", type: "error" });
        }
    };

    const handleReject = async (studentId) => {
        try {
            await universityService.rejectStudent(universityId, studentId);
            setToast({ message: "Étudiant refusé.", type: "info" });
            fetchData();
        } catch (err) {
            setToast({ message: "Erreur lors du refus.", type: "error" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <GraduationCap size={32} className="text-blue-600" />
                        Mes étudiants
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Gérez les étudiants rattachés à votre université
                    </p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={<Users size={24} />}
                            label="Total"
                            value={stats.total}
                            color="blue"
                        />
                        <StatCard
                            icon={<Clock size={24} />}
                            label="En attente"
                            value={stats.pending}
                            color="amber"
                        />
                        <StatCard
                            icon={<UserCheck size={24} />}
                            label="Validés"
                            value={stats.approved}
                            color="green"
                        />
                        <StatCard
                            icon={<UserX size={24} />}
                            label="Refusés"
                            value={stats.rejected}
                            color="red"
                        />
                    </div>
                )}

                {/* Filtres + Recherche */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </form>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="approved">Validés</option>
                                <option value="rejected">Refusés</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contenu */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-800 dark:text-red-200">
                        {error}
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Users size={60} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Aucun étudiant {statusFilter && "avec ce statut"}.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Étudiant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {students.map((student) => (
                                    <StudentRow
                                        key={student.id}
                                        student={student}
                                        onApprove={() => handleApprove(student.id)}
                                        onReject={() => handleReject(student.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

/* ─── Carte de statistique ────────────────────────────── */
function StatCard({ icon, label, value, color }) {
    const colors = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
        green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
        red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Ligne étudiant ──────────────────────────────────── */
function StudentRow({ student, onApprove, onReject }) {
    const statusConfig = {
        pending:  { label: "En attente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
        approved: { label: "Validé",     color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        rejected: { label: "Refusé",     color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    };

    const config = statusConfig[student.university_status] || { label: "Inconnu", color: "bg-slate-100 text-slate-800" };

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {student.name}
                        </p>
                        {student.professional_profile?.headline && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {student.professional_profile.headline}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={14} />
                    {student.email}
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {student.university_status === "approved" && <CheckCircle size={12} />}
                    {student.university_status === "rejected" && <XCircle size={12} />}
                    {student.university_status === "pending" && <Clock size={12} />}
                    {config.label}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                {student.university_status === "pending" && (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onApprove}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                            Approuver
                        </button>
                        <button
                            onClick={onReject}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                            Refuser
                        </button>
                    </div>
                )}
                {student.university_status === "approved" && (
                    <button
                        onClick={onReject}
                        className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                    >
                        Révoquer
                    </button>
                )}
                {student.university_status === "rejected" && (
                    <button
                        onClick={onApprove}
                        className="px-3 py-1.5 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                    >
                        Valider
                    </button>
                )}
            </td>
        </tr>
    );
}