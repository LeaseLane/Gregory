'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent, jour } from '../onglets';
import { adresse } from '@/lib/format';

/* « Saisir un accord papier » : accord de DPA signé sur papier ou en PDF. L'original est déposé (dossier réservé aux finances),
   puis lanceur_dpa_papier vérifie tout, conserve le texte et journalise. Si la saisie échoue, le fichier déposé est effacé. */
type Bail = { lease_id: string; tenant_id: string; locataire: string; logement: string; loyer: number; premier: string };
const AUJ = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

export function AccordPapier({ fermer, fait }: { fermer: () => void; fait: (message: string) => void }) {
  const [baux, setBaux] = useState<Bail[] | null>(null), [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ lease_id: '', titulaire: '', institution: '', transit: '', compte: '', type: 'fixe', montant: '', signe_le: AUJ, premier: '' });
  const [fichier, setFichier] = useState<File | null>(null);
  useEffect(() => { supabaseNavigateur().rpc('lanceur_dpa_baux').then(({ data, error }) => error ? setErreur(error.message) : setBaux(data as Bail[])); }, []);
  const bail = baux?.find((b) => b.lease_id === f.lease_id);
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function enregistrer() {
    if (!bail || !fichier) return;
    setEnvoi(true); setErreur(null);
    const sb = supabaseNavigateur(), ext = (fichier.name.split('.').pop() ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
    const chemin = `locataires/${bail.tenant_id}/dpa/${crypto.randomUUID()}.${ext}`;
    const { error: e1 } = await sb.storage.from('portail').upload(chemin, fichier, { contentType: fichier.type || 'application/pdf' });
    if (e1) { setEnvoi(false); return setErreur(`Le fichier n’a pas pu être déposé : ${e1.message}`); }
    const { data, error } = await sb.rpc('lanceur_dpa_papier', { p: { ...f, montant: f.montant.replace(/\s/g, '').replace(',', '.'), chemin, taille: fichier.size } });
    setEnvoi(false);
    if (error) { await sb.storage.from('portail').remove([chemin]); return setErreur(error.message); }
    const r = data as { premier: string; montant: number };
    fait(`Accord saisi pour ${bail.locataire} : ${argent(r.montant, true)} par mois, premier débit le ${jour(r.premier)} ; le locataire le voit dans son portail.`);
  }
  const pret = bail && fichier && f.titulaire.trim().length >= 2 && /^\d{3}$/.test(f.institution) && /^\d{5}$/.test(f.transit) && /^\d{5,12}$/.test(f.compte)
    && (f.type === 'variable' || Number(f.montant.replace(',', '.')) > 0) && f.signe_le;
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ap-t" style={{ marginTop: 48, width: 'min(640px, 100%)' }} onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
        <div className="fenetre-tete"><h2 id="ap-t">Saisir un accord papier</h2><button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Accord de DPA signé sur papier ou en PDF. Recopiez-le tel quel et joignez l’original : il reste au dossier, visible des finances seulement.</p>
        <label className="fenetre-lib">Locataire et logement<select className="e70-raison" value={f.lease_id} onChange={maj('lease_id')}>
          <option value="">{baux ? (baux.length ? 'Choisir…' : 'Tous les baux ont déjà un prélèvement') : 'Chargement…'}</option>
          {baux?.map((b) => <option key={b.lease_id} value={b.lease_id}>{b.locataire} · {adresse(b.logement)}</option>)}</select></label>
        <label className="fenetre-lib">Titulaire du compte<span>tel qu’écrit sur l’accord</span><input className="e70-raison" maxLength={30} value={f.titulaire} onChange={maj('titulaire')} /></label>
        <div className="nt-grille" style={{ gridTemplateColumns: '1fr 1.3fr 2fr' }}>
          <label className="fenetre-lib">Institution<input className="e70-raison" inputMode="numeric" maxLength={3} placeholder="3 chiffres" value={f.institution} onChange={maj('institution')} /></label>
          <label className="fenetre-lib">Transit<input className="e70-raison" inputMode="numeric" maxLength={5} placeholder="5 chiffres" value={f.transit} onChange={maj('transit')} /></label>
          <label className="fenetre-lib">Compte<input className="e70-raison" inputMode="numeric" maxLength={12} placeholder="5 à 12 chiffres" value={f.compte} onChange={maj('compte')} /></label>
        </div>
        <span className="fenetre-lib">Montant</span>
        <div className="segment large" role="radiogroup" style={{ width: '100%', marginBottom: 12 }}>
          <button type="button" role="radio" aria-checked={f.type === 'fixe'} className={f.type === 'fixe' ? 'actif' : ''} onClick={() => setF({ ...f, type: 'fixe' })}>Montant fixe</button>
          <button type="button" role="radio" aria-checked={f.type === 'variable'} className={f.type === 'variable' ? 'actif' : ''} onClick={() => setF({ ...f, type: 'variable' })}>Montant variable (loyer du bail)</button>
        </div>
        {f.type === 'fixe'
          ? <label className="fenetre-lib">Montant mensuel ($)<input className="e70-raison" inputMode="decimal" value={f.montant} onChange={maj('montant')} placeholder={bail ? String(bail.loyer) : ''} /></label>
          : <p className="fenetre-aide">{bail ? `Loyer actuel du bail : ${argent(bail.loyer, true)}. ` : ''}Tout changement de montant est avisé au locataire 10 jours avant le débit.</p>}
        <div className="nt-grille">
          <label className="fenetre-lib">Signé le<input type="date" className="e70-raison" max={AUJ} value={f.signe_le} onChange={maj('signe_le')} /></label>
          <label className="fenetre-lib">Premier débit demandé<span>facultatif</span><input type="date" className="e70-raison" min={bail?.premier} value={f.premier} onChange={maj('premier')} /></label>
        </div>
        {bail && <p className="fenetre-aide">Premier débit possible au plus tôt le {jour(bail.premier)} (10 jours après la saisie, sur une échéance de loyer).</p>}
        <span className="fenetre-lib">Accord signé<span>PDF ou photo, obligatoire</span></span>
        <label className="bouton bouton-contour" style={{ width: '100%', justifyContent: 'flex-start', padding: '0 16px', cursor: 'pointer', marginBottom: 8 }}>
          <Icone nom={fichier ? 'check' : 'upload'} taille={18} couleur="#0C2147" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fichier ? fichier.name : 'Joindre l’accord signé'}</span>
          <input type="file" hidden accept="application/pdf,image/*" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} /></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !pret}>{envoi ? 'Enregistrement…' : 'Enregistrer l’accord'}</button></div>
      </form>
    </div>
  );
}
