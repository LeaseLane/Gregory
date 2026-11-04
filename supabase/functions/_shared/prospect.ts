// Création d'un prospect : mêmes règles pour l'admin (crm-api « create ») et le prospecteur téléphonique (caller-api « create_prospect »).
// Nom requis, revenu potentiel = portes × loyer moyen × 6 %, notes nettoyées; la base ajoute le reste (étape « new », dates).
type Entree = Record<string, unknown>;
const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);
const nombre = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };

export function nouveauProspect(b: Entree, source = "manuel"): { ligne: Entree } | { erreur: string } {
  const full_name = texte(b.full_name, 200);
  if (!full_name) return { erreur: "Le nom du prospect est requis." };
  const email = texte(b.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erreur: "Courriel invalide." };
  const num_doors = nombre(b.num_doors), avg_rent = nombre(b.avg_rent);
  return {
    ligne: {
      full_name, email, phone: texte(b.phone, 40), company_name: texte(b.company_name, 200),
      num_doors, avg_rent,
      potential_monthly_revenue: num_doors && avg_rent ? Math.round(num_doors * avg_rent * 0.06 * 100) / 100 : null,
      stage: "new",
      lead_source: texte(b.lead_source, 60) ?? source,
      acquisition_cost: nombre(b.acquisition_cost),
      notes: texte(b.notes, 5000),
    },
  };
}
