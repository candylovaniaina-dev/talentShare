
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Loader2, Users, Sparkles } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TalentProfileModal from "./TalentProfileModal";

function Avatar({ path, name, size = "sm" }) {
  const sizes = {
    xs: "h-8 w-8 text-xs",
    sm: "h-10 w-10 text-xs",
    md: "h-12 w-12 text-sm",
  };

  const initials = (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`/storage/${path}`}
        alt={name || "Avatar"}
        className={`${sizes[size]} shrink-0 rounded-xl border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 font-bold text-white`}
    >
      {initials}
    </div>
  );
}

export default function SuggestedTalentsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalent, setSelectedTalent] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/professional-profiles", {
        params: { per_page: 20 },
      })
      .then((res) => {
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

        const filtered = list.filter((profile) => {
          const profileUser = profile.user || {};

          if (
            profileUser.role === "company" ||
            profileUser.role === "university"
          ) {
            return false;
          }

          if (!profileUser.id || profileUser.id === user?.id) {
            return false;
          }

          return (
            profileUser.role === "employee" ||
            profileUser.role === "student"
          );
        });

        if (active) {
          setTalents(filtered.slice(0, 5));
        }
      })
      .catch((err) => {
        console.error("Erreur chargement talents suggérés :", err);

        if (active) {
          setTalents([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Sparkles size={17} />
              </span>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Talents suggérés
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Des profils à découvrir
                </p>
              </div>
            </div>
          </div>

          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-50 px-2 text-xs font-semibold text-slate-600">
            {loading ? "…" : talents.length}
          </span>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="flex h-36 flex-col items-center justify-center gap-3">
              <Loader2 size={22} className="animate-spin text-teal-600" />
              <p className="text-xs text-slate-500">
                Chargement des talents…
              </p>
            </div>
          ) : talents.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Users size={22} />
              </span>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun talent disponible
              </p>

              <p className="mt-1 max-w-52 text-xs leading-5 text-slate-500">
                Les nouveaux profils apparaîtront ici lorsqu’ils seront
                disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {talents.map((talent) => {
                const profileUser = talent.user || {};
                const name = profileUser.name || "Talent";
                const headline = talent.headline || "Profil talent";
                const avatar = talent.avatar_path || profileUser.avatar_path;

                return (
                  <div
                    key={talent.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openProfile(talent)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProfile(talent);
                      }
                    }}
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-slate-50"
                  >
                    <Avatar path={avatar} name={name} size="sm" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-teal-700">
                        {name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {headline}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openMessage(talent);
                      }}
                      title="Envoyer un message"
                      aria-label={`Envoyer un message à ${name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => navigate("/explore-dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Découvrir tous les talents
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

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
