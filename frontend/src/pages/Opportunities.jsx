import React, { useEffect, useState } from "react";
import { MapPin, Wifi } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";

export default function Opportunities() {
  const [type, setType] = useState("missions");
  const [items, setItems] = useState([]);
  const [remote, setRemote] = useState(false);

  const load = () => {
    const url = type === "missions" ? "/resource-offers" : "/job-offers";
    api.get(url, { params: { remote: remote ? 1 : undefined } })
      .then((res) => setItems(res.data.data || res.data));
  };
  useEffect(load, [type, remote]);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Opportunités</h1>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex rounded-full border border-slate-200 p-1">
          {[["missions", "Missions"], ["jobs", "Stages & emplois"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === v ? "bg-navy text-white" : "text-slate-500"}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Télétravail
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-mint">{item.company?.name}</p>
            <h3 className="mt-1 font-bold">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(item.skills || []).map((s) => (
                <span key={s.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{s.name}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
              {item.city && <span className="flex items-center gap-1"><MapPin size={12} />{item.city}</span>}
              {item.remote && <span className="flex items-center gap-1"><Wifi size={12} />Remote</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400">Aucune opportunité pour le moment.</p>}
      </div>
    </AppShell>
  );
}