import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TalentProfileModal from "./TalentProfileModal";

/* ============================================
   AVATAR
============================================ */
function Avatar({ path, name, size = "sm" }) {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
  };
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`http://localhost:8000/storage/${path}`}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full border border-[var(--border-app)] object-cover`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white`}>
      {initials}
    </div>
  );
}

/* ============================================
   COMPOSANT PRINCIPAL
============================================ */
export default function SuggestedTalentsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalent, setSelectedTalent] = useState(null);

  useEffect(() => {
    api.get("/professional-profiles", { params: { per_page: 20 } })
      .then((res) => {
        const list = res.data.data || res.data || [];

        // ✅ FILTRES : exclure entreprises + mon propre profil
        const filtered = list.filter((p) => {
          const profileUser = p.user || {};

          // ❌ Exclure les entreprises et universités
          if (profileUser.role === "company" || profileUser.role === "university") return false;

          // ❌ Exclure mon propre profil
          if (profileUser.id === user?.id) return false;

          // ❌ Exclure si aucun user lié
          if (!profileUser.id) return false;

          // ✅ Garder uniquement les talents (employee, student)
          return profileUser.role === "employee" || profileUser.role === "student";
        });

        setTalents(filtered.slice(0, 5));
      })
      .catch((err) => {
        console.error("Erreur chargement talents suggérés:", err);
        setTalents([]);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const openProfile = (talent) => {
    setSelectedTalent(talent);
  };

  const openMessage = (talent) => {
    const userId = talent.user?.id || talent.user_id;
    if (userId) {
      navigate(`/messages?to=${userId}`);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
        <p className="text-sm font-bold text-[var(--text-app)]">Talents suggérés</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
          Découvrez des profils qui pourraient vous intéresser
        </p>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-emerald-400" />
          </div>
        ) : talents.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-[var(--text-faint)]">
              Aucun talent disponible pour le moment
            </p>
          </div>
        ) : (
          /* ✅ LISTE COMPACTE */
          <div className="mt-3 space-y-1.5">
            {talents.map((talent) => {
              const u = talent.user || {};
              const name = u.name || "Talent";
              const headline = talent.headline || "Profil talent";
              const avatar = talent.avatar_path || u.avatar_path;

              return (
                <div
                  key={talent.id}
                  onClick={() => openProfile(talent)}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[var(--bg-surface-hover)]"
                >
                  <Avatar path={avatar} name={name} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--text-app)] transition group-hover:text-emerald-400">
                      {name}
                    </p>
                    <p className="truncate text-[10px] text-[var(--text-faint)]">
                      {headline}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openMessage(talent);
                    }}
                    title="Envoyer un message"
                    className="shrink-0 rounded-full bg-emerald-500/10 p-1 text-emerald-400 opacity-0 transition hover:bg-emerald-500/20 group-hover:opacity-100"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/explore-dashboard")}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-app)] py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition hover:text-emerald-400"
        >
          Voir tous les talents <ArrowRight size={11} />
        </button>
      </div>

      {selectedTalent && (
        <TalentProfileModal
          profileId={selectedTalent.id}
          onClose={() => setSelectedTalent(null)}
          onMessage={(userId) => {
            setSelectedTalent(null);
            navigate(`/messages?to=${userId}`);
          }}
        />
      )}
    </>
  );
}