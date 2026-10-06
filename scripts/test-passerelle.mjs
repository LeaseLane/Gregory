// Vérifie que la passerelle IA relaie les quatre formes de requête que
// les fonctions edge lui envoient. Aucune base de données, aucune
// fonction déployée : uniquement des appels directs à la passerelle.
//
// Pourquoi avant de déployer : le pilote n'a éprouvé que du texte simple.
// Trois fonctions envoient des images ou des PDF (reçus de dépenses,
// documents téléversés, photos de demandes de service) — une forme que
// la passerelle n'a jamais relayée pour nous.
//
// Exécution (la clé reste dans ton terminal, jamais dans un fichier) :
//   TONIA_KEY=tonia_... node scripts/test-passerelle.mjs

const BASE = process.env.IA_BASE_URL || "https://pass.tonia.ca:8443";
const CLE = process.env.TONIA_KEY;
const MODELE = process.env.IA_MODELE || "claude-haiku-4-5";

if (!CLE) {
  console.error("TONIA_KEY manquant. Usage : TONIA_KEY=tonia_... node scripts/test-passerelle.mjs");
  process.exit(1);
}

// PNG 1×1 rouge et PDF d'une page contenant « LEASE LANE 42 ».
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
  "4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 20 40 Td (LEASE LANE 42) Tj ET\nendstream endobj\n" +
  "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
  "trailer<</Root 1 0 R>>\n%%EOF",
).toString("base64");

const cas = [
  {
    nom: "Texte simple (rappels, annonces, relances)",
    corps: { messages: [{ role: "user", content: "Réponds uniquement par le mot OK." }] },
    attendu: /ok/i,
  },
  {
    nom: "Prompt système (FAQ, rapprochement bancaire)",
    corps: {
      system: "Tu réponds toujours par le seul mot BONJOUR.",
      messages: [{ role: "user", content: "Salut." }],
    },
    attendu: /bonjour/i,
  },
  {
    nom: "Image (photos de demandes de service)",
    corps: {
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: PNG } },
          { type: "text", text: "De quelle couleur est ce pixel ? Un seul mot en français." },
        ],
      }],
    },
    attendu: /rouge/i,
  },
  {
    nom: "PDF (reçus, documents téléversés)",
    corps: {
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: PDF } },
          { type: "text", text: "Quel nombre apparaît dans ce document ? Réponds par le nombre seul." },
        ],
      }],
    },
    attendu: /42/,
  },
];

let echecs = 0;
for (const c of cas) {
  const res = await fetch(`${BASE}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODELE, max_tokens: 50, ...c.corps }),
  }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: { message: String(e) } }) }));
  const data = await res.json().catch(() => ({}));
  const texte = data?.content?.[0]?.text ?? "";
  // La passerelle bloque en HTTP 200 avec un message : le code seul ne
  // prouve rien, on vérifie que la réponse est bien celle du modèle.
  const ok = res.ok && c.attendu.test(texte) && !/non autorisé|not allowed/i.test(texte);
  if (!ok) echecs++;
  const detail = ok ? `« ${texte.trim().slice(0, 40)} »`
    : `HTTP ${res.status} — ${(texte || data?.error?.message || JSON.stringify(data)).slice(0, 160)}`;
  console.log(`${ok ? "✅" : "❌"} ${c.nom} — ${detail}`);
}
console.log(`\n${cas.length - echecs}/${cas.length} formes relayées correctement par la passerelle.`);
process.exit(echecs ? 1 : 0);
