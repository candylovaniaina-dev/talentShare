import React, { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminVerifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/verification-requests");
      console.log("Réponse API:", res.data); // 👈 Vérifie la structure
      
      // La réponse est un tableau directement
      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else if (res.data.data) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      load();
    }
  }, [user]);

  const review = async (id, status) => {
    const note = status === "rejected" ? prompt("Raison du refus (optionnel) :") || "" : "";
    setProcessing(id);
    try {
      await api.patch(`/admin/verification-requests/${id}/review`, { status, review_note: note });
      load();
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setProcessing(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-red-600">Accès non autorisé</h2>
          <p className="text-slate-500 mt-2">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">📋 Demandes de vérification</h1>
      <p className="mt-1 text-sm text-slate-500">Examinez les demandes de vérification des entreprises et universités.</p>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-navy" size={40} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500">✅ Aucune demande en attente.</p>
            </div>
          ) : (
            items.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-semibold">
                    {v.verifiable?.name || v.verifiable_type?.split("\\").pop() || "Entreprise"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Demandé par {v.requester?.name || "Utilisateur inconnu"} ({v.requester?.email})
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(v.created_at).toLocaleDateString()}
                  </p>
                  <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    ⏳ En attente
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => review(v.id, "approved")}
                    disabled={processing === v.id}
                    className="rounded-full bg-green-100 p-2 text-green-600 hover:bg-green-200 disabled:opacity-50"
                  >
                    {processing === v.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => review(v.id, "rejected")}
                    disabled={processing === v.id}
                    className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200 disabled:opacity-50"
                  >
                    {processing === v.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}