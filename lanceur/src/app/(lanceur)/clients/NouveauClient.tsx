'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e24 · Nouveau client (tiroir de 600 px) : propriétaire ou locataire, coordonnées, immeubles (nouveaux), consentements LCAP cochés seulement sur
   accord exprès (date, source et auteur au journal), invitation au portail (code par courriel, LOC-01 ou PRO-14). */
type BailLu = { locataires: { nom: string; courriel: string | null; telephone: string | null }[]; adresse: string | null; logement: string | null; unit_id: string | null;
  loyer: number | null; debut: string | null; fin: string | null; remarques: string | null };
const jourLong = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export function NouveauClient({ type: type0 = 'proprietaire' }: { type?: 'proprietaire' | 'locataire' }) {
  const router = useRouter();
  const vide = { type: type0, nom: '', entreprise: '', courriel: '', telephone: '', langue: 'fr', consentement_courriel: false, consentement_sms: false, inviter: true };
  const [logement, setLogement] = useState<string | null>(null), [ouvert, setOuvert] = useState(false), [f, setF] = useState(vide), [imm, setImm] = useState<{ adresse: string; logements: string; secteur: string }[]>([]);

  // Bouton d'en-tête d'espace (CadreEspace) : ?nouveau=1 ouvre le tiroir à l'arrivée.
  useEffect(() => { const q = new URLSearchParams(window.location.search); if (q.get('nouveau') !== '1') return;
    // Depuis un candidat validé (fiche propriétaire) : nom, courriel et téléphone déjà connus.
    if (q.get('nom')) setF((v) => ({ ...v, type: type0, nom: q.get('nom') ?? '', courriel: q.get('courriel') ?? '', telephone: q.get('telephone') ?? '' }));
    setLogement(q.get('logement'));
    setOuvert(true); }, [type0]);
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  // « Importer le bail » (Greg, 2026-11-09) : le bail lu préremplit la fiche; rien n'est créé avant « Créer le client ».
  const [lu, setLu] = useState<BailLu | null>(null), [fichierBail, setFichierBail] = useState<File | null>(null), [lecture, setLecture] = useState(false);
  async function lireBail(fichier: File) {
    if (fichier.size > 10 * 1024 * 1024) return setErreur('Le bail dépasse 10 Mo : envoyez une copie plus légère.');
    setLecture(true); setErreur(null);
    const corps = new FormData(); corps.append('fichier', fichier);
    const r = await fetch('/api/bail/lire', { method: 'POST', body: corps }).then(async (x) => ({ ok: x.ok, j: await x.json().catch(() => ({})) })).catch(() => ({ ok: false, j: {} as { error?: string } }));
    setLecture(false);
    if (!r.ok || !r.j.bail) return setErreur(r.j.error ?? 'Le bail n’a pas pu être lu.');
    const b = r.j.bail as BailLu, p = b.locataires[0];
    setLu(b); setFichierBail(fichier); setLogement(b.unit_id);
    setF((v) => ({ ...v, type: 'locataire', nom: p?.nom ?? v.nom, courriel: p?.courriel ?? v.courriel, telephone: p?.telephone ?? v.telephone, inviter: p?.courriel ? v.inviter : false }));
  }
  async function creer() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_creer_client', { p: { ...f, immeubles: f.type === 'proprietaire' ? imm.filter((i) => i.adresse.trim()).map((i) => ({ ...i, logements: Number(i.logements) || 1 })) : [] } });
    setEnvoi(false); if (error) return setErreur(error.message);
    const id = (data as { id: string }).id, sb = supabaseNavigateur();
    // Le bail importé est rangé dans les documents du locataire (même dossier que la fiche locataire).
    if (fichierBail && f.type === 'locataire') {
      const chemin = `locataires/${id}/documents/${crypto.randomUUID().slice(0, 8)}-bail.${fichierBail.type === 'application/pdf' ? 'pdf' : fichierBail.type.split('/')[1]}`;
      const { error: e1 } = await sb.storage.from('portail').upload(chemin, fichierBail, { contentType: fichierBail.type, upsert: false });
      if (!e1) await sb.rpc('lanceur_locataire_document_ajouter', { p: { tenant_id: id, titre: 'Bail', chemin, taille: fichierBail.size } });
    }
    const q = new URLSearchParams();
    if (f.type === 'locataire' && (logement || lu)) {
      q.set('bail', logement ?? 'choisir');
      if (lu?.loyer) q.set('loyer', String(lu.loyer)); if (lu?.debut) q.set('debut', lu.debut); if (lu?.fin) q.set('fin', lu.fin);
    }
    setOuvert(false); setF(vide); setImm([]); setLu(null); setFichierBail(null);
    router.push(`/clients/${f.type === 'proprietaire' ? 'proprietaires' : 'locataires'}/${id}${q.size ? `?${q}` : ''}`);
  }
  const champ = (k: keyof typeof f, l: string, opt?: { type?: string; ph?: string }) => <div><label className="fenetre-lib" htmlFor={`nc-${k}`}>{l}</label>
    <input id={`nc-${k}`} className="e70-raison" type={opt?.type ?? 'text'} placeholder={opt?.ph} value={f[k] as string} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setOuvert(true)}><Icone nom="plus" taille={16} couleur="#fff" />Nouveau client</button>
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="nc-t" onSubmit={(e) => { e.preventDefault(); creer(); }}>
          <header className="tiroir-tete"><div><h2 id="nc-t">Nouveau client</h2><p className="gris texte-13" style={{ margin: 0 }}>Propriétaire ou locataire · inscrit au journal à la création</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            <p className="fenetre-lib">Type de client</p>
            <div className="lo-segments" style={{ maxWidth: 320 }}>{([['proprietaire', 'Propriétaire'], ['locataire', 'Locataire']] as const).map(([k, l]) =>
              <button type="button" key={k} className={f.type === k ? 'actif' : ''} onClick={() => setF({ ...f, type: k })}>{l}</button>)}</div>
            <p className="gris texte-12">Un locataire se crée aussi depuis une candidature acceptée.</p>
            {f.type === 'locataire' && <div className="nc-bail" style={{ margin: '12px 0 4px' }}>
              <label className={`bouton bouton-contour${lecture ? ' desactive' : ''}`} style={{ width: 'auto', padding: '0 16px', cursor: lecture ? 'wait' : 'pointer' }}>
                <Icone nom="upload" taille={16} couleur="#0C2147" />{lecture ? 'Lecture du bail… (environ 30 secondes)' : lu ? 'Importer un autre bail' : 'Importer le bail (PDF ou photo)'}
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden disabled={lecture} onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ''; if (x) lireBail(x); }} /></label>
              {lu && <div className="bandeau info" role="status" style={{ marginTop: 12 }}>
                <strong>Bail lu, à vérifier avant de créer.</strong>{' '}
                {[lu.adresse && `${lu.adresse}${lu.logement ? ` — logement ${lu.logement}` : ''}`, lu.loyer && `${lu.loyer.toLocaleString('fr-CA')} $ par mois`,
                  lu.debut && `du ${jourLong(lu.debut)}${lu.fin ? ` au ${jourLong(lu.fin)}` : ' (durée indéterminée)'}`].filter(Boolean).join(' · ')}.
                {' '}{logement ? 'Le bail s’ouvrira sur ce logement après la création.' : 'Logement non trouvé parmi les logements libres : vous le choisirez à l’étape du bail.'}
                {lu.locataires.length > 1 && <> Autres locataires au bail : {lu.locataires.slice(1).map((l) => l.nom).join(', ')} (à ajouter comme colocataires).</>}
                {lu.remarques && <> À vérifier : {lu.remarques}</>}</div>}
            </div>}
            <div className="po-deux">{champ('nom', 'Nom')}{f.type === 'proprietaire' ? champ('entreprise', 'Entreprise (facultatif)', { ph: 'Ex. : Placements Nguyen inc.' }) : <div />}
              {champ('courriel', f.type === 'locataire' && !f.inviter ? 'Courriel (facultatif)' : 'Courriel', { type: 'email' })}{champ('telephone', 'Téléphone', { type: 'tel' })}
              <div><label className="fenetre-lib" htmlFor="nc-l">Langue</label><select id="nc-l" className="e70-raison" value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></div></div>
            {f.type === 'proprietaire' && <><p className="fenetre-lib">Immeubles</p>
              {imm.map((i, k) => <div key={k} className="nc-imm"><input className="e70-raison" placeholder="Adresse" value={i.adresse} onChange={(e) => setImm(imm.map((x, j) => j === k ? { ...x, adresse: e.target.value } : x))} />
                <input className="e70-raison" placeholder="Logements" inputMode="numeric" value={i.logements} onChange={(e) => setImm(imm.map((x, j) => j === k ? { ...x, logements: e.target.value } : x))} />
                <input className="e70-raison" placeholder="Secteur" value={i.secteur} onChange={(e) => setImm(imm.map((x, j) => j === k ? { ...x, secteur: e.target.value } : x))} />
                <button type="button" className="haut-ibtn" onClick={() => setImm(imm.filter((_, j) => j !== k))} aria-label="Retirer"><Icone nom="close" taille={16} couleur="#3E4A59" /></button></div>)}
              <button type="button" className="lien ligne-ic" onClick={() => setImm([...imm, { adresse: '', logements: '', secteur: '' }])}><Icone nom="plus" taille={16} couleur="#2E5788" />Ajouter un immeuble</button></>}
            <p className="fenetre-lib" style={{ marginTop: 20 }}>Consentements LCAP</p>
            <label className="case"><input type="checkbox" checked={f.consentement_courriel} onChange={(e) => setF({ ...f, consentement_courriel: e.target.checked })} />Courriel · accord exprès reçu</label>
            <label className="case"><input type="checkbox" checked={f.consentement_sms} onChange={(e) => setF({ ...f, consentement_sms: e.target.checked })} />SMS · accord exprès reçu</label>
            <p className="gris texte-12">Cochez seulement si la personne a donné son accord exprès. La date et la source sont inscrites au journal.</p>
            <label className="lo-bascule nc-invite"><input type="checkbox" role="switch" checked={f.inviter} onChange={(e) => setF({ ...f, inviter: e.target.checked })} /><i />
              <div><strong>Inviter au portail {f.type === 'proprietaire' ? 'propriétaire' : 'locataire'}</strong><span className="gris texte-13">Un courriel avec un code personnel part à la création du client.</span></div></label>
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || f.nom.trim().length < 2 || ((f.type === 'proprietaire' || f.inviter) ? !f.courriel.includes('@') : !!f.courriel.trim() && !f.courriel.includes('@'))}>{envoi ? 'Création…' : 'Créer le client'}</button></footer>
        </form></div>}
    </>
  );
}
