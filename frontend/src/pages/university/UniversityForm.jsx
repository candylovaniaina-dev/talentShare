import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Building2, ImagePlus, LocateFixed, MapPin, Phone } from "lucide-react";
import { Avatar, Btn, Card, Field, Input, LABELS, Select, Textarea, cx, fileUrl, useToast } from "./ui";

const pin = L.divIcon({
  className: "",
  html: '<span style="display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#16B8B1;border:3px solid #0B1F33;box-shadow:0 6px 14px rgba(0,0,0,.35)"></span>',
  iconSize: [24, 24], iconAnchor: [12, 24],
});
const DEFAULT_CENTER = [-21.45267, 47.08569]; // Fianarantsoa par défaut

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, Math.max(map.getZoom(), 15), { animate: true }); }, [center, map]);
  return null;
}

export function LocationMap({ pos, onPick, height = 320 }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl ring-1 ring-[#E4EBF1] dark:ring-white/10">
      <MapContainer center={pos || DEFAULT_CENTER} zoom={pos ? 15 : 6} scrollWheelZoom={!!onPick} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {onPick && <ClickToPlace onPick={onPick} />}
        {pos && (
          <>
            <Marker position={pos} icon={pin} draggable={!!onPick}
              eventHandlers={onPick ? { dragend: (e) => { const p = e.target.getLatLng(); onPick(p.lat, p.lng); } } : undefined} />
            <Recenter center={pos} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

const EMPTY = {
  name: "", type: "public", sector: "", size: "", founded_year: "", accreditation: "", description: "",
  address: "", city: "", region: "", country: "Madagascar", campus: "", // Ajout de campus
  contact_email: "", phone: "", website: "", latitude: null, longitude: null,
};

// --- BASE DE DONNÉES DES RÉGIONS ET VILLES DE MADAGASCAR ---
const REGIONS_VILLES = {
  "Analamanga": ["Antananarivo", "Ambohidratrimo", "Andramasina", "Anjozorobe", "Ankazobe", "Manjakandriana"],
  "Vakinankaratra": ["Antsirabe", "Ambatolampy", "Antanifotsy", "Betafo", "Faratsiho", "Mandoto"],
  "Itasy": ["Miarinarivo", "Arivonimamo", "Soavinandriana"],
  "Bongolava": ["Tsiroanomandidy", "Fenoarivo Afovoany"],
  "Haute Matsiatra": ["Fianarantsoa", "Ambalavao", "Ambohimahasoa", "Ikalamavony", "Isandra", "Vohibato"],
  "Amoron'i Mania": ["Ambositra", "Fandriana", "Manandriana", "Ambatofinandrahana"],
  "Vatovavy": ["Manakara", "Nosy-Varika", "Ifanadiana"],
  "Fitovinany": ["Manakara", "Ikongo", "Vohipeno"],
  "Atsimo-Atsinanana": ["Farafangana", "Vangaindrano", "Befotaka", "Midongy-Atsimo"],
  "Ihorombe": ["Ihosy", "Ivohibe"],
  "Atsinanana": ["Toamasina", "Brickaville", "Fenoarivo Atsinanana", "Mahanoro", "Marolambo", "Vatomandry"],
  "Analanjirofo": ["Fenoarivo Atsinanana", "Mananara Nord", "Maroantsetra", "Sainte-Marie", "Soanierana Ivongo", "Vavatenina"],
  "Alaotra-Mangoro": ["Ambatondrazaka", "Amparafaravola", "Andilamena", "Anosibe An'ala", "Moramanga"],
  "Boeny": ["Mahajanga", "Ambato-Boeny", "Marovoay", "Mitsinjo", "Soalala"],
  "Sofia": ["Antsohihy", "Bealanana", "Befandriana-Nord", "Boriziny", "Mampikony", "Mandritsara"],
  "Betsiboka": ["Maevatanana", "Tsaratanana"],
  "Melaky": ["Maintirano", "Ambatomainty", "Antsalova", "Besalampy", "Morafenobe"],
  "Diana": ["Antsiranana", "Ambanja", "Ambilobe", "Antsohimbondrona"],
  "Sava": ["Sambava", "Antalaha", "Andapa", "Vohémar"],
  "Atsimo-Andrefana": ["Toliara", "Ampanihy", "Ankazoabo", "Benenitra", "Beroroha", "Betioky", "Morombe", "Sakaraha"],
  "Androy": ["Ambovombe", "Bekily", "Beloha", "Tsihombe"],
  "Anosy": ["Tolagnaro (Fort-Dauphin)", "Amboasary", "Betroka"],
  "Menabe": ["Morondava", "Belo-sur-Tsiribihina", "Mahabo", "Manja"]
};

// Regex pour le téléphone malgache : accepte +261 ou 0 suivi de 32/33/34/37/38/20
const PHONE_REGEX = /^(?:\+261|0)\s?(?:3[23478]|20)\s?\d{2}\s?\d{3}\s?\d{2}$/;

function Section({ icon: Icon, title, hint, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]"><Icon size={17} /></span>
        <div>
          <h3 className="text-[14.5px] font-bold text-[#0B1F33] dark:text-white">{title}</h3>
          {hint && <p className="text-[12px] text-slate-400">{hint}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function UniversityForm({ initial, onSubmit, submitting, submitLabel = "Enregistrer", onCancel, compact = false }) {
  const [f, setF] = useState({ ...EMPTY, ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, v ?? EMPTY[k] ?? ""])) });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, notify] = useToast();
  const fileRef = useRef();
  
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  
  // Quand on change la région, on vide la ville
  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setF(s => ({ ...s, region: selectedRegion, city: "" }));
  };

  // Quand on change la ville, on met à jour la région automatiquement
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    let foundRegion = f.region;
    for (const [region, cities] of Object.entries(REGIONS_VILLES)) {
      if (cities.includes(selectedCity)) {
        foundRegion = region;
        break;
      }
    }
    setF(s => ({ ...s, city: selectedCity, region: foundRegion }));
  };

  const pos = f.latitude !== null && f.latitude !== "" && f.longitude !== null && f.longitude !== "" ? [Number(f.latitude), Number(f.longitude)] : null;

  useEffect(() => () => logoPreview && URL.revokeObjectURL(logoPreview), [logoPreview]);

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return notify("Le logo ne doit pas dépasser 3 Mo.", "err");
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const setPos = (la, ln) => setF((s) => ({ ...s, latitude: Number(la.toFixed(7)), longitude: Number(ln.toFixed(7)) }));

  const geocode = async () => {
    const q = [f.address, f.campus, f.city, f.region, f.country].filter(Boolean).join(", ");
    if (!q) return notify("Renseignez d'abord une adresse ou une ville.", "err");
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const j = await res.json();
      if (j[0]) setPos(Number(j[0].lat), Number(j[0].lon));
      else notify("Adresse introuvable. Placez le repère directement sur la carte.", "err");
    } catch { notify("Recherche indisponible. Placez le repère sur la carte.", "err"); }
    finally { setSearching(false); }
  };

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "La raison sociale est obligatoire.";
    if (!f.city.trim()) e.city = "La ville est obligatoire.";
    if (!f.region.trim()) e.region = "La région est obligatoire.";
    
    // Validation stricte de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (f.contact_email && !emailRegex.test(f.contact_email)) {
      e.contact_email = "Adresse e-mail invalide (ex: contact@domaine.mg).";
    }
    
    // Validation du téléphone
    if (f.phone && !PHONE_REGEX.test(f.phone.trim())) {
      e.phone = "Format attendu : 034 56 789 00 ou +261 34 56 789 00.";
    }

    if (f.website && !/^https?:\/\/\S+\.\S+/.test(f.website)) e.website = "Le site doit commencer par http:// ou https://";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return notify("Vérifiez les champs signalés.", "err");
    const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));
    delete body.logo_path;
    onSubmit(body, logo);
  };

  const err = (k) => errors[k] && <span className="mt-1 block text-[11px] font-medium text-rose-600">{errors[k]}</span>;
  const logoSrc = logoPreview || fileUrl(initial?.logo_path);

  // Récupérer la liste des villes pour la région sélectionnée
  const availableCities = f.region && REGIONS_VILLES[f.region] ? REGIONS_VILLES[f.region] : [];

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={cx("grid gap-4", !compact && "xl:grid-cols-[1fr_420px]")}>
        <div className="space-y-4">
          <Section icon={Building2} title="Identité de l'établissement" hint="Ces informations sont visibles par les entreprises et les étudiants.">
            <div className="mb-5 flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choisir un logo"
                className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#F3F6FC] ring-1 ring-dashed ring-[#16B8B1]/50 transition hover:bg-[#16B8B1]/10 dark:bg-white/5">
                {logoSrc ? <img src={logoSrc} alt="Logo" className="h-full w-full object-cover" /> : <ImagePlus size={24} className="text-[#16B8B1]" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickLogo} />
              <div>
                <p className="text-[13px] font-semibold text-[#0B1F33] dark:text-white">Logo</p>
                <p className="text-[12px] text-slate-400">PNG, JPG ou SVG — 3 Mo maximum.</p>
                <Btn type="button" variant="soft" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>{logoSrc ? "Changer le logo" : "Ajouter un logo"}</Btn>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Raison sociale *" className="sm:col-span-2"><Input value={f.name} onChange={set("name")} placeholder="Université d'Antananarivo" autoFocus />{err("name")}</Field>
              <Field label="Type d'établissement">
                <Select value={f.type} onChange={set("type")}>{Object.entries(LABELS.uniType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
              </Field>
              <Field label="Secteur d'activité" hint="Domaines de formation principaux"><Input value={f.sector} onChange={set("sector")} placeholder="Informatique, gestion, santé…" /></Field>
              <Field label="Taille">
                <Select value={f.size} onChange={set("size")}><option value="">Non renseignée</option>{Object.entries(LABELS.uniSize).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
              </Field>
              <Field label="Année de création"><Input type="number" min="1800" max={new Date().getFullYear()} value={f.founded_year} onChange={set("founded_year")} placeholder="1961" /></Field>
              <Field label="Accréditation / habilitation" className="sm:col-span-2"><Input value={f.accreditation} onChange={set("accreditation")} placeholder="Ex. habilité par le MESUPRES" /></Field>
              <Field label="Description" className="sm:col-span-2"><Textarea rows={5} value={f.description} onChange={set("description")} placeholder="Missions, domaines de formation, relations avec le monde professionnel…" /></Field>
            </div>
          </Section>

          <Section icon={Phone} title="Coordonnées" hint="Service des stages ou relations entreprises.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de contact"><Input type="email" value={f.contact_email} onChange={set("contact_email")} placeholder="stages@universite.mg" />{err("contact_email")}</Field>
              <Field label="Téléphone" hint="Format : 034 56 789 00 ou +261 34 56 789 00">
                <Input value={f.phone} onChange={set("phone")} placeholder="+261 34 56 789 00" />
                {err("phone")}
              </Field>
              <Field label="Site web" className="sm:col-span-2"><Input value={f.website} onChange={set("website")} placeholder="https://www.universite.mg" />{err("website")}</Field>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section icon={MapPin} title="Adresse et géolocalisation" hint="Cliquez sur la carte ou faites glisser le repère pour un emplacement précis.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Campus / Faculté" className="sm:col-span-2"><Input value={f.campus} onChange={set("campus")} placeholder="Ex. Campus d'Ankatso, Faculté des Sciences" /></Field>
              
              <Field label="Région *">
                <Select value={f.region} onChange={handleRegionChange}>
                  <option value="">Sélectionnez une région</option>
                  {Object.keys(REGIONS_VILLES).map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
                {err("region")}
              </Field>

              <Field label="Ville *">
                <Select value={f.city} onChange={handleCityChange} disabled={!f.region}>
                  <option value="">Sélectionnez une ville</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                {err("city")}
              </Field>

              <Field label="Adresse (quartier, rue)" className="sm:col-span-2"><Input value={f.address} onChange={set("address")} placeholder="Ex. Tanambao, Rue du 26 Juin" /></Field>
              <Field label="Pays" className="sm:col-span-2"><Input value={f.country} onChange={set("country")} readOnly className="bg-slate-50 dark:bg-white/5 cursor-not-allowed" /></Field>
            </div>
            <div className="mt-4"><LocationMap pos={pos} onPick={setPos} height={280} /></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Latitude"><Input inputMode="decimal" value={f.latitude ?? ""} onChange={(e) => setF((s) => ({ ...s, latitude: e.target.value === "" ? null : e.target.value }))} placeholder="-18.8792" /></Field>
              <Field label="Longitude"><Input inputMode="decimal" value={f.longitude ?? ""} onChange={(e) => setF((s) => ({ ...s, longitude: e.target.value === "" ? null : e.target.value }))} placeholder="47.5079" /></Field>
            </div>
            <Btn type="button" variant="soft" className="mt-3 w-full" onClick={geocode} loading={searching}><LocateFixed size={15} className="mr-2" />Localiser l'adresse sur la carte</Btn>
          </Section>

          {!compact && (
            <Card className="flex items-center gap-4 bg-gradient-to-br from-[#0B1F33] to-[#0F3B4A] p-5 text-white ring-0">
              <Avatar name={f.name || "?"} src={logoPreview ? undefined : initial?.logo_path} size={52} round="rounded-2xl" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">{f.name || "Votre établissement"}</p>
                <p className="truncate text-[12px] text-white/60">{[f.type && LABELS.uniType[f.type], f.city].filter(Boolean).join(" · ") || "Aperçu de votre fiche"}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className={cx("mt-5 flex flex-wrap justify-end gap-2", compact && "sticky bottom-0 -mx-1 bg-white/90 px-1 py-3 backdrop-blur dark:bg-[#131E47]/90")}>
        {onCancel && <Btn variant="ghost" onClick={onCancel}>Annuler</Btn>}
        <Btn onClick={submit} loading={submitting} className="min-w-[200px]">{submitLabel}</Btn>
      </div>
      {toast}
    </div>
  );
}