import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function UniversityForm({ initialData = {}, onSubmit, submitLabel = "Enregistrer", isEdit = false }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        description: initialData.description || "",
        country: initialData.country || "Madagascar",
        city: initialData.city || "",
        address: initialData.address || "",
        latitude: initialData.latitude || "",
        longitude: initialData.longitude || "",
        website: initialData.website || "",
        is_verified: initialData.is_verified || false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        // Efface l'erreur du champ modifié
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Convertir lat/lng en nombre ou null
            const payload = {
                ...formData,
                latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
                longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
            };

            const result = await onSubmit(payload);
            navigate(`/universities/${result.id}`);
        } catch (err) {
            console.error("Erreur:", err);
            if (err.response?.status === 422) {
                // Erreurs de validation Laravel
                setErrors(err.response.data.errors || {});
            } else {
                setErrors({ global: "Une erreur est survenue. Veuillez réessayer." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-4"
                    >
                        <ArrowLeft size={18} />
                        Retour
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? "Modifier l'université" : "Ajouter une université"}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {isEdit ? "Modifiez les informations ci-dessous" : "Remplissez les informations ci-dessous"}
                    </p>
                </div>

                {/* Erreur globale */}
                {errors.global && (
                    <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
                        <p className="text-red-800 dark:text-red-200">{errors.global}</p>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6">

                    {/* Nom */}
                    <Field label="Nom de l'université" required error={errors.name?.[0]}>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Université d'Antananarivo"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </Field>

                    {/* Description */}
                    <Field label="Description" error={errors.description?.[0]}>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Présentation de l'université..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </Field>

                    {/* Pays + Ville */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Pays" required error={errors.country?.[0]}>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </Field>
                        <Field label="Ville" required error={errors.city?.[0]}>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Ex: Antananarivo"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </Field>
                    </div>

                    {/* Adresse */}
                    <Field label="Adresse" error={errors.address?.[0]}>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Ex: BP 566, Ankatso"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </Field>

                    {/* Latitude + Longitude */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Latitude" error={errors.latitude?.[0]} hint="Ex: -18.9137">
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="-18.9137"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </Field>
                        <Field label="Longitude" error={errors.longitude?.[0]} hint="Ex: 47.5361">
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="47.5361"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </Field>
                    </div>

                    {/* Site web */}
                    <Field label="Site web" error={errors.website?.[0]}>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://exemple.mg"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </Field>

                    {/* Vérifié */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_verified"
                            id="is_verified"
                            checked={formData.is_verified}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_verified" className="text-slate-700 dark:text-slate-300">
                            Université vérifiée (badge ✅)
                        </label>
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {submitLabel}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Champ de formulaire ────────────────────────────── */
function Field({ label, required, error, hint, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
            )}
        </div>
    );
}