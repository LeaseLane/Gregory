'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Baux dans le nouvel admin (Grégory, 2026-11-08) : une seule fenêtre pour les trois gestes.
   - ajouter  : nouveau bail. Depuis un logement libre (nouveau locataire) ou depuis une fiche locataire (choix du logement).
   - changer  : l'ancien locataire part (date, motif), le nouveau arrive avec son loyer; tout ou rien (lanceur_logement_changer_locataire).
   - terminer : fin du bail (loyers après la fin retirés, logement libéré à la date). */
export type BailMode =
  | { mode: 'ajouter'; unitId: string; libelle: string; loyer?: number | null }
  | { mode: 'ajouter'; tenantId: string; nom: string }
  | { mode: 'changer'; unitId: string; libelle: string; ancien: string; loyer?: number | null }
  | { mode: 'terminer'; leaseId: string; libelle: string; nom: string };

const MOTIFS = [['depart', 'Départ du locataire'], ['non_renouvellement', 'Non-renouvellement'], ['resiliation', 'Résiliation'], ['entente', 'Entente'], ['autre', 'Autre']] as const;
const auj = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const lendemain = (d: string) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + 1); return x.toLocaleDateString('en-CA'); };

export function BailFenetre({ quoi, fermer, fait }: { quoi: BailMode; fermer: () => void; fait: (message: string) => void }) {
  const router = useRouter();
  const nouveauLocataire = quoi.mode === 'changer' || (quoi.mode === 'ajouter' && 'unitId' in quoi);
  const [f, setF] = useState({ unit_id: 'unitId' in quoi ? quoi.unitId : '', nom: '', courriel: '', telephone: '',
    loyer: 'loyer' in quoi && quoi.loyer ? String(quoi.loyer) : '', debut: quoi.mode === 'changer' ? '' : auj(), fin: '', depart: '', motif: 'depart', note: '' });
  const [logements, setLogements] = useState<{ id: string; libelle: string; loyer: number | null }[] | null>(null);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const choixLogement = quoi.mode === 'ajouter' && 'tenantId' in quoi;
  useEffect(() => {
    if (!choixLogement) return;
    supabaseNavigateur().rpc('lanceur_logements', { p: {} }).then(({ data, error }) => {
      if (error) return setErreur(error.message);
      setLogements(((data as { vacants: { id: string; libelle: string; loyer: number | null }[] } | null)?.vacants) ?? []);
    });
  }, [choixLogement]);
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function ok() {
    setEnvoi(true); setErreur(null);
    const sb = supabaseNavigateur();
    const locataire = 'tenantId' in quoi ? { tenant_id: quoi.tenantId } : { nom: f.nom, courriel: f.courriel, telephone: f.telephone };
    const r = quoi.mode === 'terminer'
      ? await sb.rpc('lanceur_bail_terminer', { p: { lease_id: quoi.leaseId, fin: f.depart, motif: f.motif, note: f.note } })
      : quoi.mode === 'changer'
        ? await sb.rpc('lanceur_logement_changer_locataire', { p: { unit_id: quoi.unitId, fin: f.depart, motif: f.motif, note: f.note, ...locataire, loyer: f.loyer, debut: f.debut || null } })
        : await sb.rpc('lanceur_bail_creer', { p: { unit_id: f.unit_id, ...locataire, loyer: f.loyer, debut: f.debut, fin: f.fin || null } });
    setEnvoi(false);
    if (r.error) return setErreur(r.error.message);
    const statut = quoi.mode === 'changer' ? (r.data as { nouveau: { statut: string } }).nouveau.statut : quoi.mode === 'ajouter' ? (r.data as { statut: string }).statut : null;
    fait(quoi.mode === 'terminer' ? `Fin du bail inscrite au ${f.depart}.`
      : quoi.mode === 'changer' ? `${quoi.ancien} part le ${f.depart}; ${f.nom.trim()} arrive le ${f.debut || lendemain(f.depart)} à ${f.loyer} $ par mois.`
      : statut === 'a_venir' ? `Bail créé : il commence le ${f.debut}.` : 'Bail créé : le logement est loué.');
    router.refresh();
  }

  const titre = quoi.mode === 'terminer' ? 'Mettre fin au bail' : quoi.mode === 'changer' ? 'Changer de locataire' : 'unitId' in quoi ? 'Ajouter un locataire' : 'Ajouter un bail';
  const texte = quoi.mode === 'terminer' ? `${quoi.nom} · ${quoi.libelle}. Les loyers après la fin sont retirés (ou ramenés au montant déjà reçu); le logement se libère à la date de fin.`
    : quoi.mode === 'changer' ? `${quoi.libelle} · ${quoi.ancien} part, le nouveau locataire arrive avec son loyer. Les deux se font ensemble.`
    : 'unitId' in quoi ? `${quoi.libelle} · un nouveau locataire et son bail. Les loyers se créent tout seuls chaque mois.`
    : `Pour ${quoi.nom} : choisissez le logement, le loyer et les dates.`;
  const champ = (k: keyof typeof f, l: string, type = 'text', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) =>
    <label className="fenetre-lib">{l}<input className="e70-raison" type={type} value={f[k]} onChange={maj(k)} {...extra} /></label>;
  const pret = quoi.mode === 'terminer' ? !!f.depart
    : (!nouveauLocataire || f.nom.trim().length >= 2) && Number(f.loyer.replace(/[^\d.,]/g, '').replace(',', '.')) > 0
      && (quoi.mode === 'changer' ? !!f.depart : !!f.debut && !!f.unit_id);
  return (
    <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="bail-t" onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <header className="tiroir-tete"><h2 id="bail-t">{titre}</h2><button type="button" className="haut-ibtn" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
        <div className="tiroir-corps">
          <p className="gris texte-13" style={{ marginTop: 0 }}>{texte}</p>
          {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
          {(quoi.mode === 'terminer' || quoi.mode === 'changer') && <>
            {quoi.mode === 'changer' && <h3 className="titre-carte" style={{ fontSize: 15 }}>Départ de {quoi.ancien}</h3>}
            <div className="po-deux">{champ('depart', quoi.mode === 'changer' ? 'Dernier jour du bail' : 'Date de fin', 'date')}
              <label className="fenetre-lib">Motif<select className="e70-raison" value={f.motif} onChange={maj('motif')}>{MOTIFS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></div>
            <label className="fenetre-lib">Note (facultatif)<textarea className="e70-raison" rows={2} value={f.note} onChange={maj('note')} /></label></>}
          {quoi.mode !== 'terminer' && <>
            {quoi.mode === 'changer' && <h3 className="titre-carte" style={{ fontSize: 15, marginTop: 20 }}>Nouveau locataire</h3>}
            {choixLogement && <label className="fenetre-lib">Logement<select className="e70-raison" value={f.unit_id} onChange={(e) => {
              const l = logements?.find((x) => x.id === e.target.value); setF({ ...f, unit_id: e.target.value, loyer: f.loyer || (l?.loyer ? String(l.loyer) : '') }); }}>
              <option value="">{logements === null ? 'Chargement…' : logements.length ? 'Choisir un logement libre ou en préavis' : 'Aucun logement libre'}</option>
              {logements?.map((l) => <option key={l.id} value={l.id}>{l.libelle}</option>)}</select></label>}
            {nouveauLocataire && <>{champ('nom', 'Nom')}<div className="po-deux">{champ('courriel', 'Courriel (facultatif)', 'email')}{champ('telephone', 'Téléphone (facultatif)', 'tel')}</div></>}
            <div className="po-deux">{champ('loyer', 'Loyer mensuel ($)', 'text', { inputMode: 'decimal' })}
              {champ('debut', quoi.mode === 'changer' ? `Début (par défaut le ${f.depart ? lendemain(f.depart) : 'lendemain du départ'})` : 'Début du bail', 'date')}
              {quoi.mode === 'ajouter' && champ('fin', 'Fin du bail (facultatif)', 'date')}</div>
            {nouveauLocataire && <p className="gris texte-13">Le portail s’offre ensuite depuis la fiche du locataire (« Inviter au portail »).</p>}</>}
        </div>
        <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className={quoi.mode === 'terminer' ? 'bouton bouton-danger' : 'bouton bouton-principal'} disabled={envoi || !pret}>{envoi ? 'Enregistrement…' : titre}</button></footer>
      </form>
    </div>
  );
}
