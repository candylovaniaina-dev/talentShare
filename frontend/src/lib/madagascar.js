// Ville -> région (Madagascar)
export const CITY_REGION = {
  "Antananarivo": "Analamanga",
  "Antsirabe": "Vakinankaratra",
  "Miarinarivo": "Itasy",
  "Tsiroanomandidy": "Bongolava",
  "Fianarantsoa": "Haute Matsiatra",
  "Ambositra": "Amoron'i Mania",
  "Mananjary": "Vatovavy",
  "Manakara": "Fitovinany",
  "Farafangana": "Atsimo-Atsinanana",
  "Ihosy": "Ihorombe",
  "Morondava": "Menabe",
  "Toliara": "Atsimo-Andrefana",
  "Ambovombe": "Androy",
  "Tolagnaro": "Anosy",
  "Ambatondrazaka": "Alaotra-Mangoro",
  "Moramanga": "Alaotra-Mangoro",
  "Toamasina": "Atsinanana",
  "Fenoarivo Atsinanana": "Analanjirofo",
  "Maroantsetra": "Analanjirofo",
  "Mahajanga": "Boeny",
  "Antsohihy": "Sofia",
  "Maevatanana": "Betsiboka",
  "Maintirano": "Melaky",
  "Antsiranana": "Diana",
  "Nosy Be": "Diana",
  "Sambava": "Sava",
  "Antalaha": "Sava",
  "Vohémar": "Sava",
};

export const CITIES = Object.keys(CITY_REGION).sort((a, b) => a.localeCompare(b, "fr"));
export const REGIONS = [...new Set(Object.values(CITY_REGION))].sort((a, b) => a.localeCompare(b, "fr"));

// Téléphone : +261 34 56 789 00
export function formatPhoneMG(input) {
  let d = String(input).replace(/\D/g, "");
  if (d.startsWith("0")) d = "261" + d.slice(1);       // 034... -> 26134...
  else if (!d.startsWith("261")) d = "261" + d;
  d = d.slice(0, 12);                                   // 261 + 9 chiffres
  const n = d.slice(3);
  const parts = [n.slice(0, 2), n.slice(2, 4), n.slice(4, 7), n.slice(7, 9)].filter(Boolean);
  return ["+261", ...parts].join(" ");
}
// mobiles 32/33/34/37/38 ou fixe 20
export const isPhoneMG = (v) => /^\+261 (3[23478]|20) \d{2} \d{3} \d{2}$/.test(v);

// Liens
export function normalizeUrl(v) {
  const s = String(v).trim().replace(/\s+/g, "");
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
export function isUrl(v) {
  try {
    const u = new URL(v);
    return ["http:", "https:"].includes(u.protocol) && /^[^.\s]+(\.[^.\s]+)+$/.test(u.hostname);
  } catch { return false; }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);