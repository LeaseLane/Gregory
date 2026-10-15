'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

/* e20 · Fiche propriétaire : loyers payés chez lui (6 mois, jamais « versé »), occupation, dépenses, demandes; logements par immeuble avec retards;
   relevés mensuels émis le 5; approbation en attente (relance); préférences de communication (LCAP); documents; journal récent. */
type Logement = { numero: string; type: string | null; locataire: string | null; tenant_id: string | null; loyer: number | null; statut: string; retard: number | null };
export type DonneesProprio = { id: string; nom: string; entreprise: string | null; courriel: string | null; telephone: string | null; langue: string | null; adresse: string | null; depuis: string;
  responsable: string | null; plafond: number | null; portail: string;
  indicateurs: { loyers_6: { mois: string; montant: number }[]; logements: number; occupes: number; depenses_12: number; loyers_12: number; demandes: number; demande: string | null };
  immeubles: { id: string; adresse: string; secteur: string | null; logements: Logement[] | null }[];
  releves: { mois: string; numero: string; total: string; facture: string; envoi: string | null; envoye_le: string | null }[];
  approbations: { id: string; quoi: string; montant: number; fournisseur: string | null; le: string }[];
  consentements: { courriel: { le: string; base: string } | null; sms: { le: string; base: string } | null };
  documents: { nombre: number; mandat: { titre: string; le: string } | null }; journal: { action: string; le: string; qui: string | null }[] };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const jour = (iso: string) => { const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${d.toLocaleDateString('fr-CA', { month: 'short' })}`; };
const moisLib = (iso: string, f: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', f);
const ACTIONS: Record<string, string> = { 'owner.created': 'Client créé', 'owner.updated': 'Fiche modifiée', 'owner.reminded': 'Relance envoyée', 'approval.decided': 'Approbation décidée', 'statement.issued': 'Relevé émis', 'statement.resent': 'Relevé renvoyé',
  'owner_statement.issued': 'Relevé émis', 'owner_statement.resent': 'Relevé renvoyé', 'owner.profile_updated': 'Profil modifié dans le portail', 'owner.preferences_updated': 'Préférences modifiées dans le portail' };

export function FicheProprietaire({ donnees: D, erreurLecture }: { donnees: DonneesProprio | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ nom: D?.nom ?? '', entreprise: D?.entreprise ?? '', courriel: D?.courriel ?? '', telephone: D?.telephone ?? '', adresse: D?.adresse ?? '', langue: D?.langue ?? 'fr' });
  if (!D) return <><Link className="lien po-retour" href="/clients/proprietaires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Propriétaires</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const I = D.indicateurs, max = Math.max(1, ...I.loyers_6.map((m) => m.montant)), dernier = I.loyers_6[I.loyers_6.length - 1];
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  const champ = (k: keyof typeof f, l: string, type = 'text') => <div><label className="fenetre-lib" htmlFor={`fp-${k}`}>{l}</label><input id={`fp-${k}`} className="e70-raison" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/clients/proprietaires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Propriétaires</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18 fiche-tete" aria-label="Propriétaire">
        <span className="ini" style={{ width: 56, height: 56, fontSize: 18 }}>{initiales(D.nom)}</span>
        <div><h2 className="releve-titre" style={{ margin: 0 }}>{D.nom}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{[D.entreprise, `client depuis ${new Date(D.depuis).getFullYear()}`, D.courriel, D.telephone, D.responsable && `responsable : ${D.responsable}`].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13" style={{ margin: '6px 0 0' }}><i className={`point-etat ${D.portail === 'actif' ? 'ok' : D.portail === 'invite' ? 'att' : 'off'}`} />{D.portail === 'actif' ? 'Portail actif' : D.portail === 'invite' ? 'Invitation au portail envoyée' : 'Sans portail'}</p></div>
        <div className="fiche-actions">
          {D.portail === 'aucun' && D.courriel && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_inviter_portail', { owner_id: D.id, courriel: D.courriel }, 'Invitation au portail envoyée.')}><Icone nom="send" taille={16} couleur="#0C2147" />Inviter au portail</button>}
          <button className="bouton bouton-contour" onClick={() => setEdit(true)}><Icone nom="pencil" taille={16} couleur="#0C2147" />Modifier</button>
          {D.courriel && <a className="bouton bouton-contour" href={`mailto:${D.courriel}`}><Icone nom="mail" taille={16} couleur="#0C2147" />Écrire</a>}
          {D.telephone && <a className="bouton bouton-principal" href={`tel:${D.telephone}`}><Icone nom="phone" taille={16} couleur="#fff" />Appeler</a>}</div>
      </section>
      <div className="kpis" style={{ margin: '24px 0' }}>
        <div className="kpi"><span>Loyers payés · {moisLib(dernier?.mois ?? new Date().toISOString(), { month: 'long' })}</span><b>{argent(dernier?.montant ?? 0)}</b>
          <span className="mini-barres" aria-label="Loyers payés, 6 derniers mois">{I.loyers_6.map((m, k) => <i key={m.mois} className={k === I.loyers_6.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(6, (100 * m.montant) / max)}%` }} title={`${moisLib(m.mois)} : ${argent(m.montant)}`} />)}</span></div>
        <div className="kpi"><span>Occupation</span><b>{I.occupes} / {I.logements}</b><span>{I.logements - I.occupes ? `${I.logements - I.occupes} logement${I.logements - I.occupes > 1 ? 's' : ''} libre${I.logements - I.occupes > 1 ? 's' : ''}` : 'Tout est loué'}</span>
          <span className="jauge"><i style={{ width: `${(100 * I.occupes) / Math.max(1, I.logements)}%` }} /></span></div>
        <div className="kpi"><span>Dépenses · 12 mois</span><b>{argent(I.depenses_12)}</b><span>{I.loyers_12 ? `${Math.round((100 * I.depenses_12) / I.loyers_12)} % des loyers payés` : '—'}</span></div>
        <div className="kpi"><span>Demandes ouvertes</span><b>{I.demandes}</b><span>{I.demande ?? 'Aucune'}</span></div>
      </div>
      <div className="grille-2-1">
        <div className="po-colonne">
          {D.immeubles.map((b) => <section key={b.id} className="carte-l18" aria-label={b.adresse}>
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{b.adresse}</h2><p className="gris texte-13" style={{ margin: 0 }}>{b.logements?.length ?? 0} logement{(b.logements?.length ?? 0) > 1 ? 's' : ''}{b.secteur ? ` · ${b.secteur}` : ''}</p></div></div>
            <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '14%' }} /><col style={{ width: '36%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
              <thead><tr><th>Logement</th><th>Locataire</th><th>Type</th><th className="droite">Loyer</th><th>Paiement</th></tr></thead>
              <tbody>{[...(b.logements ?? [])].sort((x, y) => x.numero.localeCompare(y.numero, 'fr', { numeric: true })).map((u) => <tr key={u.numero}><td className="fort">{u.numero}</td>
                <td>{u.tenant_id ? <Link href={`/clients/locataires/${u.tenant_id}`}>{u.locataire}</Link> : <span className="gris">{u.statut === 'occupied' ? '—' : 'Libre'}</span>}</td>
                <td>{u.type ?? '—'}</td><td className="droite">{u.loyer ? argent(u.loyer) : '—'}</td>
                <td>{!u.tenant_id ? <span className="gris">—</span> : u.retard ? <span className="puce todo">En retard · {u.retard} j</span> : <span className="puce info">À jour</span>}</td></tr>)}
                {!b.logements?.length && <tr><td colSpan={5} className="gris">Aucun logement saisi.</td></tr>}</tbody></table></section>)}
          {!D.immeubles.length && <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Aucun immeuble rattaché.</p></section>}
          <section className="carte-l18" aria-label="Relevés mensuels"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Relevés mensuels</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Émis le 5 avec la facture d’honoraires</p>
            <ul className="lo-docs">{D.releves.map((r) => <li key={r.numero}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span>
              <div><Link className="fort" href={`/finances/releves/${D.id}?m=${r.mois.slice(0, 7)}`}>{moisLib(r.mois)}</Link><span className="gris texte-13">{r.numero} · facture {r.facture} · {argent(Number(r.total))} · {r.envoi === 'sent' && r.envoye_le ? `envoyé le ${jour(r.envoye_le)}` : r.envoi === 'failed' ? 'envoi échoué' : 'en file d’envoi'}</span></div></li>)}
              {!D.releves.length && <li className="gris texte-13">Aucun relevé émis.</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Approbations"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Approbations en attente</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Plafond du mandat : {argent(D.plafond ?? 500)}</p>
            <ul className="lo-docs">{D.approbations.map((a) => <li key={a.id}><span className="a-faire-ic"><Icone nom="wrench" taille={18} couleur="#0C2147" /></span><div>
              <span className="tete-action"><strong>{a.quoi} · {argent(a.montant)}</strong><button className="lien" disabled={envoi} onClick={() => rpc('lanceur_relancer_proprietaire', { type: 'depense', id: a.id }, 'Relance envoyée dans son portail.')}>Relancer</button></span>
              <span className="gris texte-13">{a.fournisseur ? `${a.fournisseur} · ` : ''}demandée le {jour(a.le)}</span></div></li>)}
              {!D.approbations.length && <li className="gris texte-13">Aucune décision attendue.</li>}</ul></section>
          <section className="carte-l18" aria-label="Préférences de communication"><h2 className="titre-carte">Préférences de communication</h2>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="mail" taille={18} couleur="#0C2147" /></span><div><strong>Courriel</strong><span className="gris texte-13">{D.consentements.courriel ? `Consentement ${D.consentements.courriel.base === 'express' ? 'exprès' : 'tacite'} · ${jour(D.consentements.courriel.le)}` : 'Messages transactionnels seulement'}</span></div></li>
              <li><span className="a-faire-ic"><Icone nom="message" taille={18} couleur="#0C2147" /></span><div><strong>SMS</strong><span className="gris texte-13">{D.consentements.sms ? `Consentement ${D.consentements.sms.base === 'express' ? 'exprès' : 'tacite'} · ${jour(D.consentements.sms.le)}` : 'Aucun consentement'}</span></div></li>
              <li><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>Langue</strong><span className="gris texte-13">{D.langue === 'en' ? 'English' : 'Français'}</span></div></li></ul></section>
          <section className="carte-l18" aria-label="Documents"><div className="tete-action"><h2 className="titre-carte">Documents</h2><Link className="lien" href={`/clients/documents?proprietaire=${D.id}`}>{D.documents.nombre} document{D.documents.nombre > 1 ? 's' : ''}</Link></div>
            <ul className="lo-docs"><li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{D.documents.mandat?.titre ?? 'Mandat de gestion'}</strong><span className="gris texte-13">{D.documents.mandat ? `Ajouté le ${jour(D.documents.mandat.le)}` : 'Aucun mandat au dossier'}</span></div></li></ul></section>
          <section className="carte-l18" aria-label="Journal récent"><h2 className="titre-carte">Journal récent</h2>
            <ul className="lo-docs">{D.journal.map((j, k) => <li key={k}><div><strong>{ACTIONS[j.action] ?? j.action}</strong><span className="gris texte-13">{jour(j.le)}{j.qui ? ` · ${j.qui}` : ''}</span></div></li>)}
              {!D.journal.length && <li className="gris texte-13">Rien d’inscrit.</li>}</ul></section>
        </div>
      </div>
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fp-t" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_proprietaire_maj', { id: D.id, ...f }, 'Fiche mise à jour.')) setEdit(false); }}>
          <header className="tiroir-tete"><h2 id="fp-t">Modifier le propriétaire</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps"><div className="po-deux">{champ('nom', 'Nom')}{champ('entreprise', 'Entreprise')}{champ('courriel', 'Courriel', 'email')}{champ('telephone', 'Téléphone', 'tel')}</div>
            {champ('adresse', 'Adresse postale (Relevé 31)')}
            <label className="fenetre-lib" htmlFor="fp-l">Langue</label><select id="fp-l" className="e70-raison" value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || f.nom.trim().length < 2}>Enregistrer</button></footer>
        </form></div>}
    </>
  );
}
