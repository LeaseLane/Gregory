/* « Rester connecté sur cet appareil » : coché, les témoins de session durent (400 jours, défaut Supabase);
   décoché, ils deviennent des témoins de session du navigateur (effacés à sa fermeture). */
export const TEMOIN_MEMOIRE = 'll-memoriser';
export const optionsTemoins = (valeur: string | undefined) => (valeur === '1' ? {} : { maxAge: undefined });
