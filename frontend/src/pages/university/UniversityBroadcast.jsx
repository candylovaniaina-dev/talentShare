import React, { useState } from "react";
import api from "../../services/api";
import { Btn, Field, Input, Modal, Select, Textarea, useToast } from "./ui";

export default function UniversityBroadcast({ programs = [] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();

  const [form, setForm] = useState({
    title: "",
    type: "stage",
    program_id: "",
    description: "",
    deadline: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return notify("Le titre est obligatoire.", "err");

    setSaving(true);
    try {
      // On envoie la requête vers la route qu'on a ajoutée dans api.php
      await api.post("/university/broadcasts", form);
      notify("Offre diffusée avec succès aux étudiants !");
      setOpen(false);
      setForm({ title: "", type: "stage", program_id: "", description: "", deadline: "" });
    } catch (err) {
      notify(err.response?.data?.message || "Erreur lors de la diffusion", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Btn variant="dark" onClick={() => setOpen(true)}>
        Diffuser une offre
      </Btn>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Diffuser une offre"
        subtitle="Envoyez une offre à tous vos étudiants ou à une filière spécifique."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Annuler</Btn>
            <Btn onClick={handleSubmit} loading={saving}>Diffuser l'offre</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Titre de l'offre *">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Stage en développement web"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type d'offre">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="stage">Stage</option>
                <option value="alternance">Alternance</option>
                <option value="premier_emploi">Premier emploi</option>
                <option value="autre">Autre</option>
              </Select>
            </Field>

            <Field label="Filière ciblée (optionnel)">
              <Select
                value={form.program_id}
                onChange={(e) => setForm({ ...form, program_id: e.target.value })}
              >
                <option value="">Toutes les filières</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Date limite (optionnel)">
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </Field>

          <Field label="Description de l'offre">
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez la mission, les compétences recherchées..."
            />
          </Field>
        </div>
      </Modal>
      {toast}
    </>
  );
}