'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Confidentialite } from '@/composants/portail/Confidentialite';
import { dateCourte } from '@/composants/portail/format';

/* Propriétaire · Profil (CONCORDANCE 2.14, écran N) : Mes informations, Notifications (familles du propriétaire, LCAP), Confidentialité.
   Pas d'onglet Affichage : le menu du propriétaire reste à gauche (décision du 13 oct.). Le courriel de connexion se change avec l'équipe. */
export type ProfilProprio = { acces: string; nom_complet: string; entreprise: string | null; telephone: string | null; courriel: string; notifications: Record<string, { courriel: boolean; sms: boolean }>; lcap: { le: string } | null };
const AVIS: [string, string, string, { courriel: boolean; sms: boolean }][] = [['accords', 'Accords', 'Dépenses et cessions à approuver', { courriel: true, sms: true }],
  ['finances', 'Finances', 'Relevé du mois et facture d’honoraires (le 5)', { courriel: true, sms: false }], ['travaux', 'Travaux et projets', 'Étapes des demandes et des projets', { courriel: true, sms: false }],
  ['locataires', 'Locataires et cessions', 'Arrivées, départs, propositions de locataire', { courriel: true, sms: false }], ['mandat', 'Mandat et signatures', 'Avenants et documents à signer', { courriel: true, sms: false }]];

export function Profil({ donnees: D, onglet, maintenant, erreur }: { donnees: ProfilProprio | null; onglet: string; maintenant: string; erreur: string | null }) {
  const router = useRouter();
  const [f, setF] = useState({ nom: D?.nom_complet ?? '', entreprise: D?.entreprise ?? '', telephone: D?.telephone ?? '' });
  const [prefs, setPrefs] = useState(() => Object.fromEntries(AVIS.map(([k, , , def]) => [k, D?.notifications?.[k] ?? def])) as Record<string, { courriel: boolean; sms: boolean }>);
  const [lcap, setLcap] = useState(D?.lcap ?? null), [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreur), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{erreur ?? 'Votre profil n’a pas pu être lu.'}</div>;
  const titulaire = D.acces === 'proprietaire', modifie = f.nom !== D.nom_complet || f.entreprise !== (D.entreprise ?? '') || f.telephone !== (D.telephone ?? '');
  async function enregistrer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_proprietaire_profil_maj', { p: f });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('infos'); router.refresh();
  }
  async function sauver(p: typeof prefs, l?: boolean) {
    setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('portail_proprietaire_preferences', { p: { avis: p, ...(l === undefined ? {} : { lcap: l }) } });
    if (error) return setBandeau(error.message); setLcap((data as ProfilProprio).lcap); setOk('notifications');
  }
  const Ok = ({ k }: { k: string }) => ok === k ? <p className="lo-enregistre-ok" role="status"><Icone nom="check" taille={16} couleur="#12694F" />Enregistré</p> : null;

  return (
    <>
      <div><h1 className="po-titre">Mon profil</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Vos informations, vos avis et vos droits sur vos renseignements</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <section className="studio-liste" aria-label="Profil">
        <nav className="po-onglets">{[['infos', 'Mes informations'], ['notifications', 'Notifications'], ['confidentialite', 'Confidentialité']].map(([k, l]) =>
          <Link key={k} href={`/proprietaire/profil${k === 'infos' ? '' : `?t=${k}`}`} className={onglet === k ? 'actif' : ''} aria-current={onglet === k ? 'page' : undefined}>{l}</Link>)}
          <form action="/deconnexion?p=proprietaire" method="post" style={{ marginLeft: 'auto', alignSelf: 'center' }}><button className="lien ligne-ic lo-sortir"><Icone nom="arrow" taille={14} couleur="#2E5788" />Me déconnecter</button></form></nav>
        <div className="lo-profil-corps">
          {onglet === 'infos' && <form onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
            {!titulaire && <p className="bandeau info"><Icone nom="info" taille={16} couleur="#2E5788" />Ces informations sont celles du compte du propriétaire; seul le titulaire peut les modifier.</p>}
            <div className="po-deux">
              <div><label className="fenetre-lib" htmlFor="pf-n">Nom</label><input id="pf-n" className="e70-raison" value={f.nom} disabled={!titulaire} onChange={(e) => setF({ ...f, nom: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="pf-e">Entreprise <span>facultatif</span></label><input id="pf-e" className="e70-raison" value={f.entreprise} disabled={!titulaire} onChange={(e) => setF({ ...f, entreprise: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="pf-t">Téléphone</label><input id="pf-t" type="tel" className="e70-raison" value={f.telephone} disabled={!titulaire} placeholder="Ajouter un numéro" onChange={(e) => setF({ ...f, telephone: e.target.value })} /></div>
              <div><label className="fenetre-lib">Courriel de connexion</label><span className="lo-verrou e70-raison">{D.courriel}<Icone nom="lock" taille={16} couleur="#58697F" /></span></div>
            </div>
            <p className="gris texte-13">Pour changer le courriel de connexion, <Link className="lien" href="/proprietaire/messages?nouveau=1">écrivez à l’équipe</Link> (vérification d’identité).</p>
            {titulaire && <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><Ok k="infos" /><button className="bouton bouton-principal po-bouton" disabled={!modifie || envoi}>Enregistrer les modifications</button></div>}
          </form>}
          {onglet === 'notifications' && <>
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>Comment vous joindre</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Avis de service liés à vos immeubles.</p>
            <table className="lo-grille-avis"><thead><tr><th>Type d’avis</th><th>Courriel</th><th>SMS</th></tr></thead>
              <tbody>{AVIS.map(([k, l, s]) => <tr key={k}><td><strong>{l}</strong><span>{s}</span></td>{(['courriel', 'sms'] as const).map((c) => <td key={c}><label className="lo-bascule seule">
                <input type="checkbox" role="switch" checked={prefs[k][c]} onChange={() => { const p = { ...prefs, [k]: { ...prefs[k], [c]: !prefs[k][c] } }; setPrefs(p); sauver(p); }} aria-label={`${l} par ${c === 'sms' ? 'SMS' : 'courriel'}`} /><i /></label></td>)}</tr>)}
                <tr><td><strong className="ligne-ic">Urgences<Icone nom="lock" taille={14} couleur="#58697F" /></strong><span>Toujours envoyées, par tous les moyens</span></td>
                  {['courriel', 'sms'].map((c) => <td key={c}><label className="lo-bascule seule"><input type="checkbox" role="switch" checked disabled aria-label={`Urgences par ${c} (toujours)`} /><i /></label></td>)}</tr></tbody></table>
            <p className="gris texte-12">SMS : répondez STOP en tout temps pour ne plus en recevoir.</p>
            <hr className="lo-sep-h" />
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>Communications de Lease Lane</h2>
            <label className="lo-bascule"><input type="checkbox" role="switch" checked={!!lcap} onChange={() => sauver(prefs, !lcap)} /><i />
              <div><strong>Infolettre et offres de Lease Lane</strong><span className="gris texte-13">{lcap ? `Consentement donné le ${dateCourte(lcap.le, true)}. Vous pouvez le retirer en tout temps.` : 'Facultatif. Sans votre consentement, vous ne recevez aucune communication commerciale (LCAP).'}</span></div></label>
            <Ok k="notifications" />
          </>}
          {onglet === 'confidentialite' && (titulaire ? <Confidentialite maintenant={maintenant} />
            : <p className="gris">Vos droits sur vos propres renseignements (accès, rectification, suppression) se demandent à l’équipe Lease Lane : <Link className="lien" href="/proprietaire/messages?nouveau=1">écrire à l’équipe</Link>.</p>)}
        </div>
      </section>
    </>
  );
}
