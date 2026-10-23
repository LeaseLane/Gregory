'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';

/* e08 · Nouvelle demande (tiroir de 600 px, ouvert par le bouton de l'en-tête : /operations?nouveau=1) : logement, catégorie, urgence, description, déclarant.
   La demande suit ensuite le même chemin que celles du portail (analyse de Cléo, file « À traiter »).
   ponytail: photos, avis SMS et suggestion de Cléo de la maquette non repris ici — ils arrivent avec l'analyse, sur la fiche de la demande. */
type Logement = { id: string; libelle: string; locataire: string | null };
const CATEGORIES = ['Plomberie', 'Électricité', 'Chauffage', 'Serrurerie', 'Électroménagers', 'Portes et fenêtres', 'Structure', 'Extermination', 'Autre'];
const URGENCES = [['normale', 'Normale'], ['elevee', 'Prioritaire'], ['urgence', 'Urgence']] as const;

export function NouvelleDemande({ ouvrir }: { ouvrir: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(ouvrir), [logements, setLogements] = useState<Logement[] | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [f, setF] = useState({ unit_id: '', categorie: '', urgence: 'normale', description: '', declaree_par: 'locataire' });
  useEffect(() => { if (ouvrir) setOuvert(true); }, [ouvrir]);
  useEffect(() => {
    if (!ouvert || logements) return;
    supabaseNavigateur().rpc('lanceur_bon_contexte', { p_demande: null }).then(({ data, error }) => error ? setErreur(error.message) : setLogements((data as { logements: Logement[] }).logements));
  }, [ouvert, logements]);
  const fermer = () => { setOuvert(false); router.replace('/operations'); };
  async function creer() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_creer_demande', { p: f });
    setEnvoi(false); if (error) return setErreur(error.message);
    setF({ unit_id: '', categorie: '', urgence: 'normale', description: '', declaree_par: 'locataire' }); fermer(); router.refresh();
  }
  if (!ouvert) return null;
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="nd-t" onSubmit={(e) => { e.preventDefault(); creer(); }}>
        <header className="tiroir-tete"><h2 id="nd-t">Nouvelle demande</h2>
          <button type="button" className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-corps">
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
          {!logements ? <p className="gris">Chargement…</p> : <>
            <label className="fenetre-lib" htmlFor="nd-l">Logement <span className="gris texte-12">obligatoire</span></label>
            <select id="nd-l" className="e70-raison" value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}><option value="">Choisir un logement</option>
              {logements.map((l) => <option key={l.id} value={l.id}>{adresse(l.libelle)}{l.locataire ? ` · ${l.locataire}` : ''}</option>)}</select>
            <label className="fenetre-lib" htmlFor="nd-c">Catégorie <span className="gris texte-12">obligatoire</span></label>
            <select id="nd-c" className="e70-raison" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}><option value="">Choisir une catégorie</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <p className="fenetre-lib">Urgence <span className="gris texte-12">obligatoire</span></p>
            <div className="lo-segments" style={{ maxWidth: 282 }}>{URGENCES.map(([k, l]) => <button type="button" key={k} className={f.urgence === k ? 'actif' : ''} onClick={() => setF({ ...f, urgence: k })}>{l}</button>)}</div>
            <p className="gris texte-13" style={{ margin: '8px 0 24px' }}>Urgence : danger pour les personnes ou le bâtiment; intervention immédiate</p>
            <label className="fenetre-lib" htmlFor="nd-d">Description <span className="gris texte-12">obligatoire</span></label>
            <textarea id="nd-d" className="e70-raison" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ce qui se passe, depuis quand, ce qui est touché." />
            <p className="fenetre-lib">Déclarée par</p>
            <div className="lo-segments" style={{ maxWidth: 180 }}>{([['locataire', 'Locataire'], ['equipe', 'Équipe']] as const).map(([k, l]) => <button type="button" key={k} className={f.declaree_par === k ? 'actif' : ''} onClick={() => setF({ ...f, declaree_par: k })}>{l}</button>)}</div>
          </>}
        </div>
        <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !f.unit_id || !f.categorie || f.description.trim().length < 10}>{envoi ? 'Création…' : 'Créer la demande'}</button></footer>
      </form>
    </div>
  );
}
