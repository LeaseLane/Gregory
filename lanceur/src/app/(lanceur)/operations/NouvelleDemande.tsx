'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';

/* e08 · Nouvelle demande (tiroir de 600 px, ouvert par le bouton de l'en-tête : /operations?nouveau=1) : logement, catégorie, urgence, description,
   photos, déclarant, avis SMS au locataire (LOC-02), suggestion de Cléo pendant la saisie (classer-demande).
   La demande suit ensuite le même chemin que celles du portail (analyse de Cléo, file « À traiter »). */
type Logement = { id: string; libelle: string; locataire: string | null };
type Locataire = { dossier: string; nom: string | null; telephone: boolean; stop: boolean; consentement: boolean; gabarit_actif: boolean };
type Suggestion = { categorie: string; urgence: string; raison: string };
const CATEGORIES = ['Plomberie', 'Électricité', 'Chauffage', 'Serrurerie', 'Électroménagers', 'Portes et fenêtres', 'Structure', 'Extermination', 'Autre'];
const URGENCES = [['normale', 'Normale'], ['elevee', 'Prioritaire'], ['urgence', 'Urgence']] as const;
const VIDE = { unit_id: '', categorie: '', urgence: 'normale', description: '', declaree_par: 'locataire' };

export function NouvelleDemande({ ouvrir }: { ouvrir: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(ouvrir), [logements, setLogements] = useState<Logement[] | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [f, setF] = useState(VIDE), [loc, setLoc] = useState<Locataire | null>(null), [aviser, setAviser] = useState(true);
  const [photos, setPhotos] = useState<{ nom: string; chemin?: string; erreur?: string }[]>([]), [survol, setSurvol] = useState(false);
  const [sugg, setSugg] = useState<Suggestion | null>(null), [cleoPense, setCleoPense] = useState(false), [catParCleo, setCatParCleo] = useState(false);
  useEffect(() => { if (ouvrir) setOuvert(true); }, [ouvrir]);
  useEffect(() => {
    if (!ouvert || logements) return;
    supabaseNavigateur().rpc('lanceur_bon_contexte', { p_demande: null }).then(({ data, error }) => error ? setErreur(error.message) : setLogements((data as { logements: Logement[] }).logements));
  }, [ouvert, logements]);
  // Locataire du logement : dossier des photos et état de l'avis SMS
  useEffect(() => {
    setLoc(null); setPhotos([]);
    if (!f.unit_id) return;
    supabaseNavigateur().rpc('lanceur_demande_locataire', { p_unit: f.unit_id }).then(({ data }) => setLoc((data as Locataire | null) ?? null));
  }, [f.unit_id]);
  // Suggestion de Cléo, une seconde après la dernière frappe
  useEffect(() => {
    const d = f.description.trim();
    if (d.length < 25) { setSugg(null); return; }
    const t = setTimeout(async () => {
      setCleoPense(true);
      const r = await fetch('/api/cleo/classer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: d }) }).catch(() => null);
      const s = r?.ok ? await r.json().catch(() => null) as Suggestion | null : null;
      setCleoPense(false); setSugg(s);
      if (s) setF((x) => { if (x.categorie && !catParCleo) return x; setCatParCleo(true); return { ...x, categorie: s.categorie }; });
    }, 1000);
    return () => clearTimeout(t);
  }, [f.description]); // eslint-disable-line react-hooks/exhaustive-deps

  async function ajouter(fs: FileList | null) {
    if (!loc) return;
    for (const fi of [...(fs ?? [])].slice(0, 10 - photos.length)) {
      if (!/^image\/(jpeg|png)$/.test(fi.type) || fi.size > 10 * 1024 * 1024) { setPhotos((p) => [...p, { nom: fi.name, erreur: 'JPG ou PNG, 10 Mo au plus' }]); continue; }
      const chemin = `${loc.dossier}/${crypto.randomUUID()}.${fi.type === 'image/png' ? 'png' : 'jpg'}`;
      setPhotos((p) => [...p, { nom: fi.name }]);
      const { error } = await supabaseNavigateur().storage.from('service-request-photos').upload(chemin, fi, { contentType: fi.type });
      setPhotos((p) => p.map((x) => x.nom === fi.name && !x.chemin && !x.erreur ? (error ? { ...x, erreur: 'Dépôt refusé' } : { ...x, chemin }) : x));
    }
  }
  const fermer = () => { setOuvert(false); router.replace('/operations'); };
  const smsPossible = !!loc?.nom && loc.telephone && !loc.stop;
  async function creer() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_creer_demande', { p: { ...f, photos: photos.filter((x) => x.chemin).map((x) => x.chemin), aviser: smsPossible && aviser,
      suggestion: sugg ? { ...sugg, suivie: f.categorie === sugg.categorie && f.urgence === sugg.urgence } : null } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setF(VIDE); setPhotos([]); setSugg(null); setCatParCleo(false); fermer(); router.refresh();
  }
  if (!ouvert) return null;
  const urgLib = (u: string) => URGENCES.find(([k]) => k === u)?.[1].toLowerCase() ?? u;
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
            <div className={'champ-cleo' + (catParCleo ? ' par-cleo' : '')}>
              <select id="nd-c" className="e70-raison" value={f.categorie} onChange={(e) => { setCatParCleo(false); setF({ ...f, categorie: e.target.value }); }}><option value="">Choisir une catégorie</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              {catParCleo && <span className="champ-cleo-ic" title="Suggérée par Cléo"><Icone nom="spark" taille={18} couleur="#4581CB" /></span>}</div>
            <p className="fenetre-lib">Urgence <span className="gris texte-12">obligatoire</span></p>
            <div className="lo-segments" style={{ maxWidth: 282 }}>{URGENCES.map(([k, l]) => <button type="button" key={k} className={f.urgence === k ? 'actif' : ''} onClick={() => setF({ ...f, urgence: k })}>{l}</button>)}</div>
            <p className="gris texte-13" style={{ margin: '8px 0 24px' }}>Urgence : danger pour les personnes ou le bâtiment; intervention immédiate</p>
            <label className="fenetre-lib" htmlFor="nd-d">Description <span className="gris texte-12">obligatoire</span></label>
            <textarea id="nd-d" className="e70-raison" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ce qui se passe, depuis quand, ce qui est touché." />
            <p className="fenetre-lib">Photos <span className="gris texte-12">facultatif</span></p>
            <label className={'zone-depot' + (survol ? ' survol' : '') + (!loc ? ' inactive' : '')} onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)}
              onDrop={(e) => { e.preventDefault(); setSurvol(false); ajouter(e.dataTransfer.files); }}>
              <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={(e) => ajouter(e.target.files)} hidden disabled={!loc} />
              <span className="ligne-ic"><Icone nom="upload" taille={18} couleur="#3E4A59" />Glissez des photos ou <b>parcourez</b></span>
              <span className="gris texte-12">{loc ? 'JPG ou PNG, 10 Mo au plus' : 'Choisissez d’abord le logement'}</span></label>
            {!!photos.length && <ul className="lo-docs" style={{ marginTop: 8 }}>{photos.map((x, i) => <li key={i} className="texte-13"><Icone nom="image" taille={16} couleur="#58697F" /><span style={{ flex: 1 }}>{x.nom}</span>
              <span className={x.erreur ? 'rouge-txt' : 'gris'}>{x.erreur ?? (x.chemin ? 'déposée' : 'dépôt…')}</span>
              <button type="button" className="lien" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>Retirer</button></li>)}</ul>}
            <p className="fenetre-lib">Déclarée par</p>
            <div className="lo-segments" style={{ maxWidth: 180 }}>{([['locataire', 'Locataire'], ['equipe', 'Équipe']] as const).map(([k, l]) => <button type="button" key={k} className={f.declaree_par === k ? 'actif' : ''} onClick={() => setF({ ...f, declaree_par: k })}>{l}</button>)}</div>
            {f.unit_id && loc && <label className="ligne-sms">
              <input type="checkbox" className="bascule" checked={smsPossible && aviser} disabled={!smsPossible} onChange={(e) => setAviser(e.target.checked)} />
              <span><b>Aviser le locataire par SMS</b><span className="bloc gris texte-13">{!loc.nom ? 'Logement sans locataire' : !loc.telephone ? `${loc.nom} · aucun téléphone au dossier` : loc.stop ? `${loc.nom} · a répondu STOP aux SMS`
                : `${loc.nom} · ${loc.consentement ? 'consentement SMS valide' : 'avis transactionnel (LCAP)'}${loc.gabarit_actif ? '' : ' · gabarit LOC-02 pas encore activé : rien ne part'}`}</span></span></label>}
            {(sugg || cleoPense) && <div className="cleo-suggere"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />
              {sugg ? <div><b>Cléo suggère : {sugg.categorie} · {urgLib(sugg.urgence)}</b><span className="bloc texte-13">{sugg.raison}</span>
                {(f.categorie !== sugg.categorie || f.urgence !== sugg.urgence) && <button type="button" className="lien" onClick={() => { setF({ ...f, categorie: sugg.categorie, urgence: sugg.urgence }); setCatParCleo(true); }}>Appliquer</button>}</div>
                : <div className="gris texte-13">Cléo lit la description…</div>}</div>}
          </>}
        </div>
        <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !f.unit_id || !f.categorie || f.description.trim().length < 10 || photos.some((x) => !x.chemin && !x.erreur)}>{envoi ? 'Création…' : 'Créer la demande'}</button></footer>
      </form>
    </div>
  );
}
