'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire, useLocataire } from '@/composants/portail/CoquilleLocataire';
import { dateCourte, dateLongue } from '@/composants/portail/format';
import { Confidentialite } from '@/composants/portail/Confidentialite';

/* Locataire · 17 Mes informations (logement en lecture seule), 18 Notifications (type d'avis × courriel / SMS; urgences verrouillées;
   avis de service séparés des communications de Lease Lane, consentement LCAP daté, STOP — CONCORDANCE 2.8), 19 Affichage (position du menu),
   Confidentialité (Loi 25 — CONCORDANCE 2.9). */
export type ProfilLoc = { prenom: string; nom: string | null; courriel: string | null; telephone: string | null; langue: string; logement: string | null; bail: { debut: string | null; fin: string | null };
  notifications: Record<string, { courriel: boolean; sms: boolean }>; lcap: { le: string; canal: string } | null; menu: 'gauche' | 'droite' | 'haut' | 'bas' };
const AVIS: [string, string, (g: string) => string, { courriel: boolean; sms: boolean }][] = [
  ['paiements', 'Paiements et reçus', () => 'Prélèvement, reçus, rappel avant le 1er du mois', { courriel: true, sms: false }],
  ['demandes', 'Demandes et interventions', () => 'Étapes de vos demandes, visites à confirmer', { courriel: true, sms: true }],
  ['messages', 'Messages de ma gestionnaire', (g) => `Nouveaux messages de ${g}`, { courriel: true, sms: true }],
  ['avis', 'Avis de l’immeuble', () => 'Travaux, inspections, coupures prévues', { courriel: true, sms: false }]];
const POSITIONS: ['gauche' | 'droite' | 'haut' | 'bas', string][] = [['gauche', 'Gauche'], ['droite', 'Droite'], ['haut', 'Haut'], ['bas', 'Bas']];

export function Profil({ donnees: D, onglet, maintenant, erreur }: { donnees: ProfilLoc | null; onglet: string; maintenant: string; erreur: string | null }) {
  const router = useRouter(), { pastilles } = useLocataire();
  const [f, setF] = useState({ prenom: D?.prenom ?? '', nom: D?.nom ?? '', courriel: D?.courriel ?? '', telephone: D?.telephone ?? '', langue: D?.langue ?? 'fr' });
  const [prefs, setPrefs] = useState(() => Object.fromEntries(AVIS.map(([k, , , def]) => [k, D?.notifications?.[k] ?? def])) as Record<string, { courriel: boolean; sms: boolean }>);
  const [lcap, setLcap] = useState(D?.lcap ?? null), [menu, setMenu] = useState(D?.menu ?? 'gauche');
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreur), [enregistre, setEnregistre] = useState<string | null>(null);
  if (!D) return <><BandeauLocataire titre="Mon profil" /><div className="bandeau erreur" role="alert">{erreur ?? 'Votre profil n’a pas pu être lu.'}</div></>;
  const gest = pastilles?.contact?.nom?.split(' ')[0] ?? 'votre gestionnaire';
  const modifie = f.prenom !== D.prenom || f.nom !== (D.nom ?? '') || f.courriel !== (D.courriel ?? '') || f.telephone !== (D.telephone ?? '') || f.langue !== D.langue;

  async function enregistrerInfos() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_locataire_profil_maj', { p: f });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setEnregistre('infos'); router.refresh();
  }
  async function sauverPrefs(p: typeof prefs, l?: boolean) {
    setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('portail_locataire_preferences', { p: { avis: p, ...(l === undefined ? {} : { lcap: l }) } });
    if (error) return setBandeau(error.message);
    setLcap((data as ProfilLoc).lcap); setEnregistre('notifications');
  }
  function basculer(k: string, canal: 'courriel' | 'sms') { const p = { ...prefs, [k]: { ...prefs[k], [canal]: !prefs[k][canal] } }; setPrefs(p); sauverPrefs(p); }
  async function placer(pos: typeof menu) {
    setMenu(pos);
    const { error } = await supabaseNavigateur().rpc('portail_preference_menu', { p_position: pos });
    if (error) return setBandeau(error.message);
    setEnregistre('affichage'); router.refresh();
  }
  const Enregistre = ({ k }: { k: string }) => enregistre === k ? <p className="lo-enregistre-ok" role="status"><Icone nom="check" taille={16} couleur="#12694F" />Enregistré automatiquement</p> : null;

  return (
    <>
      <BandeauLocataire titre="Mon profil" sous="Vos informations et vos préférences d’affichage" />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <section className="carte-l18 e2 lo-remonte lo-profil-carte">
        <nav className="po-onglets">{[['infos', 'Mes informations'], ['notifications', 'Notifications'], ['affichage', 'Affichage'], ['confidentialite', 'Confidentialité']].map(([k, l]) =>
          <Link key={k} href={`/locataire/profil${k === 'infos' ? '' : `?t=${k}`}`} className={onglet === k ? 'actif' : ''} aria-current={onglet === k ? 'page' : undefined}>{l}</Link>)}
          <form action="/deconnexion?p=locataire" method="post" style={{ marginLeft: 'auto', alignSelf: 'center' }}><button className="lien ligne-ic lo-sortir"><Icone nom="arrow" taille={14} couleur="#2E5788" />Me déconnecter</button></form></nav>

        {onglet === 'infos' && <form className="lo-profil-corps" onSubmit={(e) => { e.preventDefault(); enregistrerInfos(); }}>
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Coordonnées</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Ces informations servent à vous joindre au sujet de votre logement.</p>
          <div className="lo-champs deux">
            <label className="champ"><span>Prénom</span><input value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} autoComplete="given-name" /></label>
            <label className="champ"><span>Nom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} autoComplete="family-name" /></label>
            <label className="champ"><span>Courriel</span><input type="email" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} autoComplete="email" /></label>
            <label className="champ"><span>Téléphone</span><input type="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="Ajouter un numéro" autoComplete="tel" /></label>
            <label className="champ"><span>Langue de communication</span><select value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></label>
          </div>
          <hr className="lo-sep-h" />
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Mon logement</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Ces renseignements viennent de votre bail. Pour une correction, <Link className="lien" href="/locataire/messages?nouveau=1&sujet=Correction%20de%20mes%20renseignements">écrivez à {gest}</Link>.</p>
          <div className="lo-champs deux">
            <label className="champ"><span>Adresse</span><span className="lo-verrou">{D.logement?.replace(/, Québec(?= —)/, '') ?? '—'}<Icone nom="lock" taille={16} couleur="#58697F" /></span></label>
            <label className="champ"><span>Bail</span><span className="lo-verrou">{D.bail.debut ? `${dateLongue(D.bail.debut)} au ${D.bail.fin ? dateLongue(D.bail.fin) : 'durée indéterminée'}` : '—'}<Icone nom="lock" taille={16} couleur="#58697F" /></span></label>
          </div>
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
            {enregistre === 'infos' && !modifie && <span className="lo-enregistre-ok"><Icone nom="check" taille={16} couleur="#12694F" />Modifications enregistrées</span>}
            <button type="button" className="bouton bouton-contour" disabled={!modifie} onClick={() => setF({ prenom: D.prenom, nom: D.nom ?? '', courriel: D.courriel ?? '', telephone: D.telephone ?? '', langue: D.langue })}>Annuler</button>
            <button className="bouton bouton-principal" disabled={!modifie || envoi}>Enregistrer les modifications</button></div>
        </form>}

        {onglet === 'notifications' && <div className="lo-profil-corps">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Comment vous joindre</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Choisissez les avis que vous recevez, et par quel moyen. Ce sont des avis de service liés à votre logement.</p>
          <table className="lo-grille-avis"><thead><tr><th>Type d’avis</th><th>Courriel</th><th>SMS</th></tr></thead>
            <tbody>{AVIS.map(([k, l, s]) => <tr key={k}><td><strong>{l}</strong><span>{s(gest)}</span></td>
              {(['courriel', 'sms'] as const).map((c) => <td key={c}><label className="lo-bascule seule"><input type="checkbox" role="switch" checked={prefs[k][c]} onChange={() => basculer(k, c)} aria-label={`${l} par ${c === 'sms' ? 'SMS' : 'courriel'}`} /><i /></label></td>)}</tr>)}
              <tr className="verrou"><td><strong className="ligne-ic">Urgences<Icone nom="lock" taille={14} couleur="#58697F" /></strong><span>Toujours envoyées, par tous les moyens</span></td>
                {['courriel', 'sms'].map((c) => <td key={c}><label className="lo-bascule seule"><input type="checkbox" role="switch" checked disabled aria-label={`Urgences par ${c === 'sms' ? 'SMS' : 'courriel'} (toujours)`} /><i /></label></td>)}</tr></tbody></table>
          <p className="gris texte-12">SMS : répondez STOP en tout temps pour ne plus en recevoir.</p>
          <hr className="lo-sep-h" />
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Communications de Lease Lane</h2>
          <label className="lo-bascule"><input type="checkbox" role="switch" checked={!!lcap} onChange={() => sauverPrefs(prefs, !lcap)} /><i />
            <div><strong>Infolettre et offres de Lease Lane</strong><span className="gris texte-13">{lcap ? `Consentement donné le ${dateCourte(lcap.le, true)}. Vous pouvez le retirer en tout temps.` : 'Facultatif. Sans votre consentement, vous ne recevez aucune communication commerciale (LCAP).'}</span></div></label>
          <Enregistre k="notifications" />
        </div>}

        {onglet === 'confidentialite' && <div className="lo-profil-corps"><Confidentialite maintenant={maintenant} /></div>}

        {onglet === 'affichage' && <div className="lo-profil-corps">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Position du menu</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Choisissez où le menu s’affiche sur ordinateur et tablette. Le changement s’applique tout de suite.</p>
          <div className="lo-positions" role="radiogroup" aria-label="Position du menu">{POSITIONS.map(([k, l]) => <button key={k} role="radio" aria-checked={menu === k} className={menu === k ? 'actif' : ''} onClick={() => placer(k)}>
            <span className={`lo-mini p-${k}`}><i className="rail" /><i className="tete" /><i className="b1" /><i className="b2" /><i className="b3" /></span>
            <span className="lo-pos-lib"><i className="radio" />{l}{k === 'gauche' && <span className="puce info">Par défaut</span>}</span></button>)}</div>
          <div className="tete-action" style={{ marginTop: 16 }}><p className="ligne-ic gris texte-13" style={{ margin: 0 }}><Icone nom="phone" taille={16} couleur="#58697F" />Sur téléphone, le menu reste toujours en bas, à portée du pouce.</p><Enregistre k="affichage" /></div>
        </div>}
      </section>
    </>
  );
}
