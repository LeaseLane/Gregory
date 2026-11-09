'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { adresse, piece } from '@/lib/format';
import { BailFenetre, type BailMode } from '../../../immeubles/BailFenetre';

/* e22 · Fiche locataire : dossier de recouvrement ouvert en tête; paiements des 12 derniers mois (un carré par mois); demandes d'entretien;
   bail; documents et avis; consentements LCAP. Chaque ouverture est inscrite au journal (lecture sensible). */
export type DonneesLocataire = { id: string; nom: string; courriel: string | null; telephone: string | null; langue: string | null; anonymise: boolean; portail: boolean; depuis: string | null;
  dossier: { id: string; numero: string; etape: string } | null;
  bail: { id: string; logement: string; type: string | null; secteur: string | null; loyer: number; debut: string; fin: string | null; mode: string; fenetre: string | null } | null;
  paiements: { mois: string; retard: number | null; paye: boolean | null }[]; impaye: { montant: number; jours: number } | null;
  demandes: { id: string; numero: string; titre: string; statut: string; recue: string; rdv: { qui: string | null; quand: string | null; fait: string | null } | null }[];
  documents: { id: string; titre: string; categorie: string | null; le: string }[]; avis: { id: string; type: string; statut: string; le: string; dossier: string }[];
  consentements: { canal: string; but: string; base: string; le: string; retire: string | null }[] };
export type LoyersDus = { peut_inscrire: boolean; loyers: { id: string; echeance: string; montant: number; recu: number }[] };
export type Colocataire = { id: string; nom: string; courriel: string | null; telephone: string | null; principal: boolean };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} $`;
const date = (iso: string, an = true) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', an ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
const ETAPE: Record<string, string> = { ouvert: 'Recouvrement en cours', mise_en_demeure: 'Mise en demeure envoyée', tal: 'Au TAL' };
const STATUT: Record<string, string> = { new: 'Reçue', open: 'Ouverte', assigned: 'Assignée', in_progress: 'En cours', scheduled: 'Planifiée', completed: 'Terminée', closed: 'Fermée' };

export function FicheLocataire({ donnees: D, colocataires = [], loyers = null, erreurLecture, admin = false, payerLoyer = null, bailLogement = null, bailLu = null, invitation = null }: { bailLogement?: string | null; bailLu?: { loyer: number | null; debut?: string; fin?: string } | null; invitation?: string | null; donnees: DonneesLocataire | null; colocataires?: Colocataire[]; loyers?: LoyersDus | null; erreurLecture: string | null; admin?: boolean; payerLoyer?: string | null }) {
  const router = useRouter();
  const [bail, setBail] = useState<BailMode | null>(bailLogement && D && !D.bail ? { mode: 'ajouter', tenantId: D.id, nom: D.nom, logement: bailLogement === 'choisir' ? undefined : bailLogement, ...bailLu } : null), [supprimer, setSupprimer] = useState(false);
  const [payer, setPayer] = useState(!!payerLoyer && !!loyers?.peut_inscrire && !!loyers.loyers.some((l) => l.id === payerLoyer)), [coloc, setColoc] = useState(false), [nc, setNc] = useState({ nom: '', courriel: '', telephone: '' });
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ nom: D?.nom ?? '', courriel: D?.courriel ?? '', telephone: D?.telephone ?? '', langue: D?.langue ?? 'fr' });
  if (!D) return <><Link className="lien po-retour" href="/clients/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Locataires</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  async function enregistrer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_locataire_maj', { p: { id: D!.id, ...f } });
    setEnvoi(false); if (error) return setBandeau(error.message); setEdit(false); setOk('Fiche mise à jour.'); router.refresh();
  }
  async function inviter() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_inviter_portail', { p: { tenant_id: D!.id } });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Invitation au portail envoyée.');
  }
  // Colocataires (lease_tenants) et documents du locataire (bucket « portail », dossier locataires/<id>/documents/).
  async function ajouterColoc() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_bail_colocataire_ajouter', { p: { lease_id: D!.bail!.id, ...nc } });
    setEnvoi(false); if (error) return setBandeau(error.message); setColoc(false); setNc({ nom: '', courriel: '', telephone: '' }); setOk('Colocataire ajouté au bail.'); router.refresh();
  }
  async function retirerColoc(c: Colocataire) {
    if (!confirm(`Retirer ${c.nom} du bail ?`)) return;
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_bail_colocataire_retirer', { p: { lease_id: D!.bail!.id, tenant_id: c.id } });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk(`${c.nom} n’est plus sur le bail.`); router.refresh();
  }
  async function deposer(f: File): Promise<{ chemin: string; taille: number } | null> {
    if (f.size > 25 * 1024 * 1024) { setBandeau(`${f.name} dépasse 25 Mo.`); return null; }
    const chemin = `locataires/${D!.id}/documents/${crypto.randomUUID().slice(0, 8)}-${f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase()}`;
    const { error } = await supabaseNavigateur().storage.from('portail').upload(chemin, f, { contentType: f.type || undefined, upsert: false });
    if (error) { setBandeau(`${f.name} n’a pas été déposé : ${error.message}`); return null; }
    return { chemin, taille: f.size };
  }
  async function ajouterDoc(f: File) {
    setEnvoi(true); setBandeau(null);
    const x = await deposer(f); if (!x) return setEnvoi(false);
    const { error } = await supabaseNavigateur().rpc('lanceur_locataire_document_ajouter', { p: { tenant_id: D!.id, titre: f.name.replace(/\.[a-z0-9]+$/i, ''), ...x } });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Document ajouté.'); router.refresh();
  }
  async function remplacerDoc(id: string, f: File) {
    setEnvoi(true); setBandeau(null);
    const x = await deposer(f); if (!x) return setEnvoi(false);
    const sb = supabaseNavigateur(), { data: ancien, error } = await sb.rpc('lanceur_locataire_document_remplacer', { p: { id, ...x } });
    if (!error && ancien) await sb.storage.from('portail').remove([ancien as string]);
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Document remplacé.'); router.refresh();
  }
  async function supprimerDoc(id: string, titre: string) {
    if (!confirm(`Supprimer « ${titre} » ? Le fichier sera effacé.`)) return;
    setEnvoi(true); setBandeau(null);
    const sb = supabaseNavigateur(), { data: chemin, error } = await sb.rpc('lanceur_locataire_document_supprimer', { p_id: id });
    if (!error && chemin) await sb.storage.from('portail').remove([chemin as string]);
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Document supprimé.'); router.refresh();
  }
  const fichier = (rappel: (f: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) rappel(f); };
  // crm.bail_locataire rend aussi le dernier bail terminé (historique du portail) : passé sa date de fin, il n'est plus « en cours ».
  const termine = !!D.bail?.fin && D.bail.fin < new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const B = D.bail, champ = (k: keyof typeof f, l: string, type = 'text') => <div><label className="fenetre-lib" htmlFor={`fl-${k}`}>{l}</label><input id={`fl-${k}`} className="e70-raison" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/clients/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Locataires</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18 fiche-tete" aria-label="Locataire">
        <span className="ini" style={{ width: 56, height: 56, fontSize: 18 }}>{initiales(D.nom)}</span>
        <div><div className="ligne-ic"><h2 className="releve-titre" style={{ margin: 0 }}>{D.nom}</h2>{D.dossier && <span className="puce todo">{ETAPE[D.dossier.etape] ?? 'Dossier ouvert'}</span>}{D.anonymise && <span className="puce neutral">Anonymisé</span>}</div>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{[B?.logement && adresse(B.logement), D.depuis && `locataire depuis ${new Date(`${D.depuis}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`, D.courriel, D.telephone].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13" style={{ margin: '6px 0 0' }}><i className={`point-etat ${D.portail ? 'ok' : invitation ? 'att' : 'off'}`} />{D.portail ? 'Portail actif' : invitation ? `Invitation au portail envoyée le ${new Date(invitation).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}` : 'Sans portail'}<span className="gris">· consultation inscrite au journal</span></p></div>
        <div className="fiche-actions">
          {!D.portail && !D.anonymise && D.courriel && <button className="bouton bouton-contour" disabled={envoi} onClick={inviter}><Icone nom="send" taille={16} couleur="#0C2147" />{invitation ? 'Renvoyer l’invitation' : 'Inviter au portail'}</button>}
          {!D.anonymise && <button className="bouton bouton-contour" onClick={() => setEdit(true)}><Icone nom="pencil" taille={16} couleur="#0C2147" />Modifier</button>}
          {D.dossier && <Link className="bouton bouton-contour" href={`/juridique?d=${D.dossier.id}`}><Icone nom="flag" taille={16} couleur="#0C2147" />Ouvrir le dossier {D.dossier.numero}</Link>}
          {D.telephone && <a className="bouton bouton-principal" href={`tel:${D.telephone}`}><Icone nom="phone" taille={16} couleur="#fff" />Appeler</a>}
          {admin && (!B || termine) && <button className="haut-ibtn" style={{ width: 44, height: 44 }} onClick={() => setSupprimer(true)} aria-label="Supprimer le locataire" title="Supprimer le locataire"><Icone nom="trash" taille={18} couleur="#9B2E28" /></button>}</div>
      </section>
      <div className="grille-2-1" style={{ marginTop: 24 }}>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Paiements"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Paiements · 12 derniers mois</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{B?.mode ?? '—'} · payés chez le propriétaire</p></div>
            <div className="droite">{D.impaye && <><b style={{ fontSize: 22, color: '#9B2E28' }}>{argent(D.impaye.montant)}</b><p className="gris texte-13" style={{ margin: 0 }}>impayé depuis {D.impaye.jours} j</p></>}
              {loyers?.peut_inscrire && loyers.loyers.length > 0 && <button className="bouton bouton-contour" style={{ width: 'auto', height: 36, padding: '0 14px', marginTop: 8, fontSize: 13 }} onClick={() => setPayer(true)}>
                <Icone nom="check" taille={16} couleur="#0C2147" />Marquer un loyer payé</button>}</div></div>
            <div className="mois-carres">{D.paiements.map((m) => { const c = m.paye === null ? 'vide' : !m.paye ? 'refus' : (m.retard ?? 0) > 5 ? 'retard' : 'ok';
              return <div key={m.mois} title={m.paye === null ? 'Aucun loyer' : !m.paye ? `Impayé · ${m.retard} j` : m.retard ? `Payé avec ${m.retard} j de retard` : 'Payé à temps'}><i className={c} /><small>{new Date(`${m.mois}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'narrow' })}</small></div>; })}</div>
            <ul className="legende"><li><i className="ok" />À temps</li><li><i className="retard" />En retard</li><li><i className="refus" />Impayé</li></ul></section>
          <section className="carte-l18" aria-label="Demandes d’entretien"><h2 className="titre-carte">Demandes d’entretien</h2>
            <ul className="lo-docs">{D.demandes.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="wrench" taille={18} couleur="#0C2147" /></span>
              <div><span className="tete-action"><strong>{d.titre}</strong><span className="puce neutral">{STATUT[d.statut] ?? d.statut}</span></span>
                <span className="gris texte-13">{d.numero} · reçue le {date(d.recue, false)}{d.rdv?.qui ? ` · ${d.rdv.qui}` : ''}{d.rdv?.fait ? ` · fait le ${date(d.rdv.fait, false)}` : d.rdv?.quand ? ` · rendez-vous le ${date(d.rdv.quand, false)}` : ''}</span></div></li>)}
              {!D.demandes.length && <li className="gris texte-13">Aucune demande dans les 12 derniers mois.</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Bail"><div className="tete-action"><h2 className="titre-carte">Bail{termine && <span className="puce neutral" style={{ marginLeft: 8 }}>Terminé</span>}</h2>
            {!D.anonymise && (B && !termine ? <button type="button" className="lien" style={{ color: '#9B2E28' }} onClick={() => setBail({ mode: 'terminer', leaseId: B.id, libelle: adresse(B.logement), nom: D.nom })}>Mettre fin au bail</button>
              : <button type="button" className="lien" onClick={() => setBail({ mode: 'ajouter', tenantId: D.id, nom: D.nom })}>Ajouter un bail</button>)}</div>
            {B ? <dl className="fiche-dl"><div><dt>Logement</dt><dd>{adresse(B.logement)}{B.type ? ` · ${piece(B.type)}` : ''}</dd></div><div><dt>Loyer</dt><dd>{argent(B.loyer)} / mois</dd></div>
              <div><dt>Période</dt><dd>{date(B.debut)} au {B.fin ? date(B.fin) : 'indéterminée'}</dd></div><div><dt>Paiement</dt><dd>{B.mode}</dd></div>
              {B.fenetre && /\d/.test(B.fenetre) && <div><dt>Avis de modification</dt><dd>{(([a, b]) => b ? `du ${date(a)} au ${date(b)}` : B.fenetre)(B.fenetre.replace(/[\[\]()]/g, '').split(','))}</dd></div>}</dl> : <p className="gris" style={{ margin: 0 }}>Aucun bail actif.</p>}
            {B && <div style={{ marginTop: 16 }}><div className="tete-action"><h3 className="titre-carte" style={{ fontSize: 15, margin: 0 }}>Locataires du bail</h3>
              {!D.anonymise && <button type="button" className="lien" onClick={() => setColoc(true)}>Ajouter un colocataire</button>}</div>
              <ul className="lo-docs">{colocataires.map((c) => <li key={c.id}><span className="a-faire-ic"><Icone nom="users" taille={18} couleur="#0C2147" /></span>
                <div><span className="tete-action"><span>{c.id === D.id ? <strong>{c.nom}</strong> : <Link className="fort" href={`/clients/locataires/${c.id}`}>{c.nom}</Link>}{c.principal ? <span className="puce neutral" style={{ marginLeft: 8 }}>Principal</span> : null}</span>
                  {!c.principal && <button type="button" className="lien" disabled={envoi} onClick={() => retirerColoc(c)}>Retirer</button>}</span>
                  <span className="gris texte-13">{[c.courriel, c.telephone].filter(Boolean).join(' · ') || 'Sans coordonnées'}</span></div></li>)}</ul></div>}</section>
          <section className="carte-l18" aria-label="Documents"><div className="tete-action"><h2 className="titre-carte">Documents</h2>
              {!D.anonymise && <label className="lien" style={{ cursor: 'pointer' }}>Ajouter<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.docx,.xlsx" disabled={envoi} onChange={fichier(ajouterDoc)} /></label>}</div>
            <ul className="lo-docs">{D.avis.map((a) => <li key={a.id}><span className="a-faire-ic"><Icone nom="alert" taille={18} couleur="#9B2E28" /></span><div><strong>{a.type}</strong><span className="gris texte-13">{a.dossier} · {date(a.le, false)}</span></div></li>)}
              {D.documents.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><span className="tete-action"><strong>{d.titre}</strong>
                {!D.anonymise && <span className="ligne-ic texte-13"><label className="lien" style={{ cursor: 'pointer' }}>Remplacer<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.docx,.xlsx" disabled={envoi} onChange={fichier((f) => remplacerDoc(d.id, f))} /></label>
                  <button type="button" className="lien" style={{ color: '#9B2E28' }} disabled={envoi} onClick={() => supprimerDoc(d.id, d.titre)}>Supprimer</button></span>}</span>
                <span className="gris texte-13">{d.categorie ? `${d.categorie} · ` : ''}{date(d.le, false)}</span></div></li>)}
              {!D.documents.length && !D.avis.length && <li className="gris texte-13">Aucun document.</li>}</ul></section>
          <section className="carte-l18" aria-label="Consentements"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Consentements LCAP</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les messages liés au bail partent sans consentement.</p>
            <ul className="lo-docs">{D.consentements.map((c, k) => <li key={k}><span className="a-faire-ic"><Icone nom={c.canal === 'sms' ? 'message' : 'mail'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{c.canal === 'sms' ? 'SMS' : 'Courriel'} · {c.base === 'express' ? 'exprès' : 'tacite'}</strong><span className="gris texte-13">{c.retire ? `Retiré le ${date(c.retire, false)}` : `Depuis le ${date(c.le)}`}</span></div></li>)}
              {!D.consentements.length && <li className="gris texte-13">Aucun consentement commercial.</li>}</ul></section>
        </div>
      </div>
      {coloc && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setColoc(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="co-t" onSubmit={(e) => { e.preventDefault(); ajouterColoc(); }}>
          <header className="tiroir-tete"><h2 id="co-t">Ajouter un colocataire</h2><button type="button" className="haut-ibtn" onClick={() => setColoc(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps"><p className="gris texte-13" style={{ marginTop: 0 }}>La personne est ajoutée au bail de {B?.logement ? adresse(B.logement) : 'ce logement'}, avec sa propre fiche.</p>
            {(['nom', 'courriel', 'telephone'] as const).map((k) => <div key={k}><label className="fenetre-lib" htmlFor={`co-${k}`}>{{ nom: 'Nom', courriel: 'Courriel', telephone: 'Téléphone' }[k]}</label>
              <input id={`co-${k}`} className="e70-raison" type={k === 'courriel' ? 'email' : k === 'telephone' ? 'tel' : 'text'} value={nc[k]} onChange={(e) => setNc({ ...nc, [k]: e.target.value })} /></div>)}</div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setColoc(false)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || nc.nom.trim().length < 2}>Ajouter</button></footer>
        </form></div>}
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fl-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="fl-t">Modifier le locataire</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">{champ('nom', 'Nom')}{champ('courriel', 'Courriel', 'email')}{champ('telephone', 'Téléphone', 'tel')}
            <label className="fenetre-lib" htmlFor="fl-l">Langue</label><select id="fl-l" className="e70-raison" value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || f.nom.trim().length < 2}>Enregistrer</button></footer>
        </form></div>}
      {bail && <BailFenetre quoi={bail} fermer={() => setBail(null)} fait={(m) => { setBail(null); setBandeau(null); setOk(m); }} />}
      {supprimer && <SupprimerLocataire id={D.id} nom={D.nom} fermer={() => setSupprimer(false)} />}
      {payer && loyers && <MarquerPaye initial={payerLoyer} loyers={loyers.loyers} mode={B?.mode ?? ''} fermer={() => setPayer(false)} fait={(m) => { setPayer(false); setBandeau(null); setOk(m); router.refresh(); }} />}
    </>
  );
}

// Marquer un loyer payé à la main (payé au propriétaire, chèque, comptant…) : montant partiel permis, le solde reste dû. Inscrit au journal.
function MarquerPaye({ loyers, mode, fermer, fait, initial = null }: { loyers: LoyersDus['loyers']; mode: string; fermer: () => void; fait: (message: string) => void; initial?: string | null }) {
  const reste = (l: LoyersDus['loyers'][number]) => Math.round((Number(l.montant) - Number(l.recu)) * 100) / 100;
  const auj = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const premier = loyers.find((l) => l.id === initial) ?? loyers[0];
  const [id, setId] = useState(premier.id), [montant, setMontant] = useState(String(reste(premier))), [le, setLe] = useState(auj);
  const [moyen, setMoyen] = useState(/ch[eè]que/i.test(mode) ? 'cheque' : /pr[ée]l/i.test(mode) ? 'prelevement' : /comptant/i.test(mode) ? 'comptant' : 'virement');
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const choisi = loyers.find((l) => l.id === id)!;
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_paiement_payer', { p: { id, montant: montant.replace(/\s/g, '').replace(',', '.'), le, mode: moyen } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    const m = Number(montant.replace(',', '.'));
    fait(m >= reste(choisi) ? `Loyer du ${date(choisi.echeance)} marqué payé.` : `${argent(m)} inscrit sur le loyer du ${date(choisi.echeance)} : il reste ${argent(reste(choisi) - m)} à payer.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="mp-t" style={{ marginTop: 100, width: 'min(480px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="mp-t">Marquer un loyer payé</h2><button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Inscrivez ce qui a été reçu. Un montant partiel laisse le solde dû; les relances s’arrêtent quand le loyer est payé en entier.</p>
        <label className="fenetre-lib">Loyer<select className="e70-raison" value={id} onChange={(e) => { setId(e.target.value); setMontant(String(reste(loyers.find((l) => l.id === e.target.value)!))); }}>
          {loyers.map((l) => <option key={l.id} value={l.id}>Échéance du {date(l.echeance)} · {argent(reste(l))} à payer</option>)}</select></label>
        <div className="nt-grille">
          <label className="fenetre-lib">Montant reçu ($)<input className="e70-raison" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value.replace(/[^\d.,]/g, ''))} /></label>
          <label className="fenetre-lib">Payé le<input type="date" className="e70-raison" max={auj} value={le} onChange={(e) => setLe(e.target.value)} /></label>
        </div>
        <label className="fenetre-lib">Mode<select className="e70-raison" value={moyen} onChange={(e) => setMoyen(e.target.value)}>
          <option value="virement">Virement Interac</option><option value="cheque">Chèque</option><option value="prelevement">Prélèvement</option><option value="comptant">Comptant</option></select></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || !(Number(montant.replace(',', '.')) > 0) || !le}>{envoi ? 'Enregistrement…' : 'Marquer payé'}</button></div>
      </form>
    </div>
  );
}

// Supprimer un locataire (administrateur, nom tapé) : refusé avec un bail en cours ou à venir, ou une trace à conserver (fidéicommis, prélèvements, relevés 31).
function SupprimerLocataire({ id, nom, fermer }: { id: string; nom: string; fermer: () => void }) {
  const router = useRouter();
  const [saisie, setSaisie] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_locataire_supprimer', { p: { id, confirmation: saisie } });
    setEnvoi(false); if (error) return setErreur(error.message);
    router.push('/clients/locataires'); router.refresh();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="sl-t" style={{ marginTop: 120, width: 'min(520px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="sl-t">Supprimer {nom} ?</h2><button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Part définitivement : la fiche, ses baux terminés et leurs loyers, ses demandes d’entretien et les documents de ses baux. Refusé si un bail est en cours ou à venir (mettez-y fin d’abord).</p>
        <label className="fenetre-lib">Tapez {nom} pour confirmer<input className="e70-raison" value={saisie} onChange={(e) => setSaisie(e.target.value)} autoFocus /></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-danger" disabled={envoi || saisie.trim().toLowerCase() !== nom.trim().toLowerCase()}>{envoi ? 'Suppression…' : 'Supprimer définitivement'}</button></div>
      </form>
    </div>
  );
}
