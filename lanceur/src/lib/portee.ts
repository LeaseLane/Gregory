/* Portée « client → immeuble » de l'administration (phase 1, D01) : le choix vit dans un témoin et part dans l'en-tête
   « x-ll-portee » de chaque appel à la base, qui ne rend alors que les données de ce client (vues portee.*). */
export const TEMOIN_PORTEE = 'll_portee';
export const EN_TETE_PORTEE = 'x-ll-portee';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const porteeValide = (v: string | undefined | null) => (v && new RegExp(`^${UUID}(:${UUID})?$`).test(v) ? v : null);
