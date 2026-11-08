import fs from "node:fs";

const FILES = ["src/pages/JobOffers.jsx", "src/pages/BrowseResourceRequests.jsx"];
const MARK = "/* navy-theme */";

const SHADES = {
  50: "#E8F8F7", 100: "#D2F1EF", 200: "#A9E3E0", 300: "#7FD3CF", 400: "#16B8B1",
  500: "#16B8B1", 600: "#0F9691", 700: "#0F9691", 800: "#0B6F6B", 900: "#0B4F4C",
};

// Anciens fonds sombres (#0B1F33 / #112A3A) -> fonds sombres du menu : traités EN PREMIER
const DARK = [
  ["#0B1F33", "#131E47"],
  ["#112A3A", "#1A2650"],
];

const HEX = [
  ["#F2F7F5", "#F3F6FC"], ["#0B2A30", "#0B1F33"], ["#16463F", "#16324F"], ["#092D2D", "#0B1F33"],
  ["#173A39", "#0B1F33"], ["#23483A", "#1F3550"], ["#294840", "#1F3550"], ["#36594A", "#1F3550"],
  ["#10B981", "#16B8B1"],
  ["#10A66A", "#0F9691"], ["#0D9663", "#0F9691"], ["#139765", "#0F9691"], ["#118957", "#0F9691"],
  ["#159663", "#0F9691"], ["#11875B", "#0F9691"], ["#167C52", "#0F9691"], ["#148052", "#0F9691"],
  ["#176E4B", "#0F9691"], ["#08754D", "#0B6F6B"],
  ["#EAF7EF", "#E8F8F7"], ["#E8F7EE", "#E8F8F7"], ["#E8F4ED", "#E8F8F7"], ["#EDF8F0", "#E8F8F7"], ["#EFF8F2", "#E8F8F7"],
  ["#E0EAE5", "#E4EBF1"], ["#E0EAE6", "#E4EBF1"], ["#DFEAE4", "#E4EBF1"], ["#DFEBE3", "#E4EBF1"],
  ["#E1EBE5", "#E4EBF1"], ["#E2EEE6", "#E4EBF1"], ["#E6EFE9", "#E4EBF1"], ["#E6EEE9", "#E4EBF1"],
  ["#E7EFE9", "#E4EBF1"], ["#EAF0EC", "#E4EBF1"], ["#DDE9E1", "#E4EBF1"], ["#EAF2ED", "#E4EBF1"],
  ["#F9FCFA", "#F5F8FC"], ["#F6FAF7", "#F5F8FC"], ["#F5F9F6", "#F5F8FC"], ["#F0F6F2", "#F5F8FC"],
  ["#6F877E", "#6B7F95"], ["#648076", "#6B7F95"], ["#648074", "#6B7F95"], ["#5C786A", "#6B7F95"],
  ["#5C7769", "#6B7F95"], ["#698277", "#6B7F95"], ["#7D958A", "#6B7F95"], ["#7A9186", "#6B7F95"],
  ["#82968B", "#6B7F95"], ["#82968A", "#6B7F95"], ["#8AA097", "#6B7F95"], ["#8BA096", "#6B7F95"],
  ["#8A9D92", "#6B7F95"], ["#93A6A0", "#94A3B8"],
  ["#A8D9BD", "#BFE3E0"], ["#B4DEC3", "#BFE3E0"], ["#B5DEC5", "#BFE3E0"], ["#CDEBDD", "#BFE3E0"], ["#CFE0D5", "#BFE3E0"],
];

const TEXTS = {
  "src/pages/JobOffers.jsx": [
    ['"Toutes les offres"', '"Tous les recrutements"'],
    ['"Emplois et missions"', '"Emplois permanents"'],
    ["Type d'offre", "Type de recrutement"],
    ["Emploi à plein temps", "Recrutement permanent"],
  ],
  "src/pages/BrowseResourceRequests.jsx": [],
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const swap = (src, from, to) => src.replace(new RegExp(esc(from), "gi"), to);

for (const file of FILES) {
  if (!fs.existsSync(file)) { console.warn(`⚠ introuvable : ${file}`); continue; }
  let src = fs.readFileSync(file, "utf8");
  if (src.includes(MARK)) { console.log(`↷ déjà traité : ${file}`); continue; }
  fs.writeFileSync(`${file}.bak`, src);

  // 1) JobOffers : retirer la 2e copie de CreateOfferModal + brancher la modale partagée
  if (file.endsWith("JobOffers.jsx")) {
    const idx = src.indexOf("MODAL DE CRÉATION D'OFFRE");
    if (idx > -1) src = src.slice(0, src.lastIndexOf("/*", idx)).trimEnd() + "\n";
    else console.warn("⚠ bloc CreateOfferModal introuvable dans JobOffers.jsx");
    src = src.replace(
      'import JobOfferDetail from "./JobOfferDetail";',
      'import JobOfferDetail from "./JobOfferDetail";\nimport CreateOfferModal from "../components/publications/CreateJobOfferModal";'
    );
    src = src.replace(/(<Plus size=\{14\} \/>\s*)Créer/, "$1Publier une offre");
  } else {
    src = src.replace(/(<Plus size=\{14\} \/>\s*)Publier/, "$1Nouvelle demande");
  }

  // 2) Fond de page transparent (le fond vient déjà du menu)
  src = src.replace("bg-[#F2F7F5] text-[#0B2A30] dark:bg-[#0B1F33]", "bg-transparent text-[#0B1F33] dark:bg-transparent");

  // 3) Couleurs
  for (const [a, b] of DARK) src = swap(src, a, b);
  for (const [a, b] of HEX) src = swap(src, a, b);

  // 4) Classes Tailwind emerald-* -> turquoise du menu
  src = src.replace(
    /((?:[a-z0-9-]+:)*)(text|bg|border|ring|from|to|via|fill|stroke|accent|shadow|outline|divide|placeholder)-emerald-(\d{2,3})(\/\d+)?/g,
    (_m, pre, util, shade, op) => `${pre}${util}-[${SHADES[shade] || "#16B8B1"}]${op || ""}`
  );

  // 5) Police : on garde celle du site
  src = src.replace(/font-mono /g, "");

  // 6) Libellés
  for (const [a, b] of TEXTS[file] || []) src = src.split(a).join(b);

  fs.writeFileSync(file, `${MARK}\n${src}`);
  console.log(`✔ ${file}`);
}