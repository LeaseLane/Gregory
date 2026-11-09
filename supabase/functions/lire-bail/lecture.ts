// Mise en forme de ce que le modèle a lu dans le bail (testé sans réseau : index_test.ts).
export type Logement = { id: string; libelle: string; loyer: number | null };
export type BailLu = {
  locataires: { nom: string; courriel: string | null; telephone: string | null }[];
  adresse: string | null; logement: string | null; unit_id: string | null;
  loyer: number | null; debut: string | null; fin: string | null; remarques: string | null;
};

// Le modèle rend du JSON; on ne garde que ce qui a la bonne forme (un logement hors liste est écarté, jamais deviné).
export function nettoyer(brut: unknown, logements: Logement[]): BailLu {
  const o = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const courriel = (v: unknown) => { const t = txt(v)?.toLowerCase() ?? null; return t && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) ? t : null; };
  const loyer = typeof o.loyer === "number" && o.loyer > 0 && o.loyer < 100000 ? Math.round(o.loyer * 100) / 100 : null;
  const locataires = (Array.isArray(o.locataires) ? o.locataires : [])
    .map((l) => (l && typeof l === "object" ? l as Record<string, unknown> : {}))
    .map((l) => ({ nom: txt(l.nom) ?? "", courriel: courriel(l.courriel), telephone: txt(l.telephone) }))
    .filter((l) => l.nom.length >= 2).slice(0, 6);
  const unit = txt(o.unit_id);
  return { locataires, adresse: txt(o.adresse), logement: txt(o.logement), unit_id: unit && logements.some((l) => l.id === unit) ? unit : null,
    loyer, debut: date(o.debut), fin: date(o.fin), remarques: txt(o.remarques) };
}

// Le modèle dit d'abord si le document EST un bail résidentiel; seul un « true » explicite passe (absent, « oui », null : refusé).
export const estUnBail = (brut: unknown): boolean => !!brut && typeof brut === "object" && (brut as Record<string, unknown>).est_un_bail === true;

export function extraireJson(texte: string): unknown {
  const i = texte.indexOf("{"), j = texte.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(texte.slice(i, j + 1)); } catch { return null; }
}

