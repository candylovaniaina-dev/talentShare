import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function JobOffers() {
  const { user } = useAuth();
  const isCompany = user.role === "company";
  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", offer_type: "internship", remote: true, country: "Madagascar", status: "published" });

  useEffect(() => {
    if (isCompany) api.get("/companies").then((res) => setCompany(res.data.find((c) => c.owner_user_id === user.id)));
  }, [isCompany, user.id]);

  const load = () => api.get("/job-offers").then((res) => setOffers(res.data.data || res.data));
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/job-offers", { ...form, company_id: company.id });
    setForm({ ...form, title: "", description: "" });
    load();
  };

  const [applyModal, setApplyModal] = useState(null); // contient l'offre en cours de candidature

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Offres de stages & emplois</h1>

      {isCompany && company && (
        <form onSubmit={submit} className="mt-6 max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <input required placeholder="Titre de l'offre" className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required placeholder="Description" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value })}>
            <option value="internship">Stage</option>
            <option value="apprenticeship">Alternance</option>
            <option value="junior_mission">Mission junior</option>
            <option value="first_job">Premier emploi</option>
          </select>
          <button className="rounded-xl bg-navy px-5 py-2.5 font-semibold text-white">Publier l'offre</button>
        </form>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (
          <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-mint">{o.offer_type}</p>
            <h3 className="mt-1 font-bold">{o.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{o.description}</p>
          {!isCompany && (
  <button onClick={() => setApplyModal(o)} className="mt-4 rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white">
    Postuler
  </button>
)}
{applyModal && <ApplyModal offer={applyModal} onClose={() => setApplyModal(null)} />}
          </div>
        ))}
      </div>
    </AppShell>
  );
  function ApplyModal({ offer, onClose }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/profile/me").then((res) => setPortfolio(res.data?.portfolio || null));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: coverLetter,
        portfolio_id: portfolio?.id || null,
      });
      alert("Candidature envoyée !");
      onClose();
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
        <p className="font-semibold">Postuler à "{offer.title}"</p>

        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          {portfolio ? (
            <p>Portfolio joint : <b>{portfolio.title}</b></p>
          ) : (
            <p className="text-amber-600">Aucun portfolio créé — ta candidature partira sans portfolio joint.</p>
          )}
        </div>

        <textarea
          required rows={4} placeholder="Lettre de motivation"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-500">Annuler</button>
          <button disabled={sending} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {sending ? "Envoi..." : "Envoyer la candidature"}
          </button>
        </div>
      </form>
    </div>
  );
}
}