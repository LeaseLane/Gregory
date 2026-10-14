// T8c · Réponse de Cléo : on ne garde que ce qui est fondé sur le contexte lu avec le jeton de la personne.
//   sources : seulement des liens présents dans les faits; action : une proposition en attente du contexte, ou un lien du contexte.
export type Fait = Record<string, unknown> & { source?: { libelle: string; lien: string } };
export type Carte = { titre: string; sous?: string; montant?: string; puce?: string; ton?: "action" | "neutral"; lien?: string };
export type Brouillon = { titre: string; piece?: string; urgence: "normale" | "elevee" | "urgence"; description: string };
export type Action = { type: "proposition" | "lien" | "depense" | "intervention" | "demande"; titre: string; apercu?: string; note?: string; proposition_id?: string; autorisation_id?: string;
  intervention_id?: string; lien?: string; operation?: string; montant?: number; quand?: string; fournisseur?: string; brouillon?: Brouillon };
export type Reponse = { constat: string; cartes: Carte[]; sources: { libelle: string; lien: string }[]; action: Action | null; suggestions: string[] };

export function valider(brut: Partial<Reponse>, faits: Fait[]): Reponse {
  const liens = new Map<string, string>();
  for (const f of faits) if (f.source?.lien) liens.set(f.source.lien, f.source.libelle);
  const props = new Set(faits.filter((f) => f.proposition_id).map((f) => String(f.proposition_id)));
  const depenses = new Map(faits.filter((f) => f.autorisation_id).map((f) => [String(f.autorisation_id), f]));
  const interventions = new Map(faits.filter((f) => f.intervention_id).map((f) => [String(f.intervention_id), f]));
  const sources = (brut.sources ?? []).filter((s) => s && liens.has(s.lien)).map((s) => ({ libelle: liens.get(s.lien)!, lien: s.lien }))
    .filter((s, i, a) => a.findIndex((x) => x.lien === s.lien) === i).slice(0, 4);
  const cartes = (brut.cartes ?? []).slice(0, 5).map((c) => ({ ...c, lien: c.lien && liens.has(c.lien) ? c.lien : undefined }));
  let action: Action | null = brut.action ?? null;
  if (action && !(action.type === "proposition" && action.proposition_id && props.has(action.proposition_id)) && !(action.type === "lien" && action.lien && liens.has(action.lien))
      && !(action.type === "depense" && action.autorisation_id && depenses.has(action.autorisation_id))
      && !(action.type === "intervention" && action.intervention_id && interventions.has(action.intervention_id))
      && !(action.type === "demande" && action.brouillon)) action = null;
  if (action?.type === "intervention") {        // fournisseur, moment et lien viennent de la base
    const f = interventions.get(action.intervention_id!)!;
    action = { ...action, fournisseur: String(f.fournisseur ?? ""), quand: String(f.quand ?? ""), lien: f.source?.lien };
  }
  if (action?.type === "demande") {             // brouillon : le locataire le relit et le soumet lui-même
    const b = action.brouillon!, u = ["normale", "elevee", "urgence"].includes(b.urgence) ? b.urgence : "normale";
    const titre = String(b.titre ?? "").trim().slice(0, 120), description = String(b.description ?? "").trim().slice(0, 4000);
    action = titre.length >= 3 && description.length >= 5
      ? { type: "demande", titre: action.titre || "Demande prête", brouillon: { titre, piece: b.piece ? String(b.piece).slice(0, 40) : undefined, urgence: u as Brouillon["urgence"], description } } : null;
  }
  if (action?.type === "depense") {             // montant et lien viennent de la base
    const f = depenses.get(action.autorisation_id!)!;
    action = { ...action, montant: Number(f.montant), lien: f.source?.lien };
  }
  if (action && !String(action.titre ?? "").trim()) action = { ...action, titre: action.lien && liens.has(action.lien) ? `Ouvrir : ${liens.get(action.lien)}` : "Ouvrir la proposition" };
  if (action?.type === "proposition") {        // l'opération et le lien viennent de la base, pas du modèle
    const f = faits.find((x) => String(x.proposition_id) === action!.proposition_id)!;
    action = { ...action, operation: String(f.operation ?? ""), lien: f.source?.lien };
  }
  return { constat: String(brut.constat ?? "").slice(0, 600) || "Je n’ai pas de réponse fondée sur les données.", cartes, sources, action,
    suggestions: (brut.suggestions ?? []).filter((s) => typeof s === "string").slice(0, 2).map((s) => s.slice(0, 60)) };
}
