import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../../../onglets';
import { Editeur, type ArticleComplet } from './Editeur';

/* Studio › Article (AR-03 à AR-05) : éditeur pleine page. « nouveau » ouvre un article vide (enregistré au premier « Enregistrer »). */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ champ?: string; mot_cle?: string; titre?: string; groupe?: string; langue?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { data, error } = id === 'nouveau' ? { data: null, error: null } : await (await supabaseServeur()).rpc('lanceur_article', { p_id: id });
  const vide: ArticleComplet = { id: null, groupe: sp.groupe ?? null, langue: sp.langue ?? 'fr', slug: null, titre: sp.titre ?? '', meta: '', mot_cle: sp.mot_cle ?? '', categorie: 'proprietaires', auteur: 'Lease Lane', extrait: null,
    corps: '', image: null, image_alt: null, statut: 'brouillon', relu_par: null, relu_le: null, publie_le: null, updated_at: new Date().toISOString(), jumelle: null };
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      {error ? <div className="bandeau erreur" role="alert">{error.code === 'PT403' || error.code === 'PT404' ? error.message : 'L’article n’a pas pu être lu.'}</div>
        : <Editeur article={(data as ArticleComplet | null) ?? vide} champ={sp.champ} maintenant={Date.now()} />}
    </CadreEspace>
  );
}
