'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Mon compte : profil (nom, titre, téléphone; le courriel se change par l'administrateur), préférences (avis, langue, thème), sécurité et connexion
   (mot de passe, double authentification, sessions actives avec révocation, historique), aide (questions fréquentes, « Nous joindre »). */
export type Session = { id: string; debut: string; activite: string; navigateur: string | null; ip: string | null; actuelle: boolean };
export type DonneesCompte = { nom: string; initiales: string; courriel: string; telephone: string | null; titre: string | null; role: string;
  preferences: { avis_courriel?: boolean; avis_sms?: boolean; resume_quotidien?: boolean; langue?: string; theme?: string; densite?: string };
  deux_facteurs: boolean; historique: { le: string; resultat: string; raison: string | null; ip: string | null; navigateur: string | null; pays: string | null }[];
  politique: { mdp_min: number; inactivite_minutes: number } | null };
const FAQ: [string, string][] = [['Je n’ai plus accès à mon application d’authentification.', 'Demandez à un administrateur de réinitialiser votre double authentification depuis Équipe et permissions; vous en activerez une nouvelle à la connexion.'],
  ['Pourquoi suis-je déconnecté·e tout seul?', 'Après un délai sans activité, la session se ferme pour protéger les dossiers. Le délai est fixé dans Réglages › Sécurité.'],
  ['Qui voit ce que je fais?', 'Chaque action est inscrite au journal, avec votre nom. Les lectures de renseignements sensibles aussi (Loi 25).']];
const nav = (ua: string | null) => !ua ? 'Navigateur inconnu' : `${/Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navigateur'} · ${/Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : ''}`;
const d = (iso: string) => new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function MonCompte({ donnees: D, sessions, erreurLecture }: { donnees: DonneesCompte | null; sessions: Session[]; erreurLecture: string | null }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState('profil'), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ nom: D?.nom ?? '', titre: D?.titre ?? '', telephone: D?.telephone ?? '', preferences: { avis_courriel: true, avis_sms: false, resume_quotidien: true, langue: 'fr', theme: 'clair', ...(D?.preferences ?? {}) } });
  const [mdp, setMdp] = useState({ nouveau: '', confirme: '' }), [aide, setAide] = useState({ sujet: '', message: '' });
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const min = D.politique?.mdp_min ?? 12;
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  async function changerMdp() {
    setBandeau(null); setOk(null);
    if (mdp.nouveau.length < min) return setBandeau(`${min} caractères minimum.`);
    if (mdp.nouveau !== mdp.confirme) return setBandeau('Les deux mots de passe ne correspondent pas.');
    setEnvoi(true); const { error } = await supabaseNavigateur().auth.updateUser({ password: mdp.nouveau }); setEnvoi(false);
    if (error) return setBandeau('Le mot de passe n’a pas été changé : ' + error.message); setMdp({ nouveau: '', confirme: '' }); setOk('Mot de passe changé.');
  }
  const P = f.preferences, bascule = (k: keyof typeof P, l: string, s: string) => <li><div><strong>{l}</strong><span className="gris texte-13">{s}</span></div>
    <label className="lo-bascule"><input type="checkbox" role="switch" checked={!!P[k]} onChange={(e) => setF({ ...f, preferences: { ...P, [k]: e.target.checked } })} aria-label={l} /><i /></label></li>;
  return (
    <>
      <nav className="sous-onglets" aria-label="Mon compte" style={{ margin: '0 0 24px' }}>{[['profil', 'Mon profil'], ['preferences', 'Préférences et avis'], ['securite', 'Sécurité et connexion'], ['aide', 'Aide']].map(([k, l]) =>
        <button key={k} className={`lien ${onglet === k ? 'actif' : ''}`} style={{ padding: '8px 14px', borderRadius: 8, background: onglet === k ? '#EEF4FB' : 'none', textDecoration: 'none', fontWeight: onglet === k ? 600 : 400 }} onClick={() => setOnglet(k)} aria-current={onglet === k ? 'page' : undefined}>{l}</button>)}</nav>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {onglet === 'profil' && <form className="carte-l18" style={{ maxWidth: 720 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_mon_compte_maj', f, 'Profil enregistré.'); }}>
        <h2 className="titre-carte">Mon profil</h2>
        <div className="po-deux">{([['nom', 'Nom complet'], ['titre', 'Titre du poste'], ['telephone', 'Téléphone']] as const).map(([k, l]) => <div key={k}><label className="fenetre-lib" htmlFor={`mc-${k}`}>{l}</label>
          <input id={`mc-${k}`} className="e70-raison" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}
          <div><label className="fenetre-lib" htmlFor="mc-c">Courriel</label><input id="mc-c" className="e70-raison" value={D.courriel} disabled /></div></div>
        <p className="gris texte-12">Rôle : {D.role}. Le courriel de connexion se change par un administrateur.</p>
        <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || f.nom.trim().length < 2}>Enregistrer</button></form>}
      {onglet === 'preferences' && <form className="carte-l18" style={{ maxWidth: 720 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_mon_compte_maj', f, 'Préférences enregistrées.'); }}>
        <h2 className="titre-carte">Avis</h2>
        <ul className="lo-docs">{bascule('avis_courriel', 'Avis par courriel', 'Approbations et urgences qui vous concernent')}{bascule('avis_sms', 'Avis par SMS', 'Urgences seulement')}{bascule('resume_quotidien', 'Briefing de Cléo', 'Chaque jour ouvrable à 7 h 30')}</ul>
        <h2 className="titre-carte" style={{ marginTop: 24 }}>Affichage</h2>
        <div className="po-deux"><div><label className="fenetre-lib" htmlFor="mc-l">Langue de l’interface</label><select id="mc-l" className="e70-raison" value={P.langue} onChange={(e) => setF({ ...f, preferences: { ...P, langue: e.target.value } })}><option value="fr">Français</option><option value="en">English (bientôt)</option></select></div>
          <div><label className="fenetre-lib" htmlFor="mc-t">Thème</label><select id="mc-t" className="e70-raison" value={P.theme} onChange={(e) => setF({ ...f, preferences: { ...P, theme: e.target.value } })}><option value="clair">Clair</option><option value="sombre">Sombre (bientôt)</option><option value="systeme">Comme l’ordinateur</option></select></div></div>
        <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', marginTop: 16 }} disabled={envoi}>Enregistrer</button></form>}
      {onglet === 'securite' && <div className="grille-2-1">
        <div className="po-colonne">
          <form className="carte-l18" onSubmit={(e) => { e.preventDefault(); changerMdp(); }}><h2 className="titre-carte">Mot de passe</h2>
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="mc-m1">Nouveau mot de passe</label><input id="mc-m1" type="password" autoComplete="new-password" className="e70-raison" value={mdp.nouveau} onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} placeholder={`${min} caractères minimum`} /></div>
              <div><label className="fenetre-lib" htmlFor="mc-m2">Confirmer</label><input id="mc-m2" type="password" autoComplete="new-password" className="e70-raison" value={mdp.confirme} onChange={(e) => setMdp({ ...mdp, confirme: e.target.value })} /></div></div>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', marginTop: 12 }} disabled={envoi || !mdp.nouveau}>Changer le mot de passe</button></form>
          <section className="carte-l18"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Sessions actives</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Une session fermée ne peut plus rien faire, même si la page reste ouverte</p>
            <ul className="lo-docs">{sessions.map((s) => <li key={s.id}><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>{nav(s.navigateur)}{s.actuelle ? ' · cette session' : ''}</strong>
              <span className="gris texte-13">{s.ip ?? 'IP inconnue'} · ouverte le {d(s.debut)} · active le {d(s.activite)}</span></div>
              {!s.actuelle && <button className="lien rouge-txt" disabled={envoi} onClick={() => rpc('lanceur_revoquer_session', { id: s.id }, 'Session fermée.')}>Fermer</button>}</li>)}
              {!sessions.length && <li className="gris texte-13">Aucune session.</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18"><h2 className="titre-carte">Double authentification</h2><p className="ligne-ic texte-13">{D.deux_facteurs ? <><Icone nom="check" taille={16} couleur="#12694F" />Activée (application d’authentification)</> : <span className="rouge-txt">À activer à la prochaine connexion</span>}</p></section>
          <section className="carte-l18"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Historique de connexion</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les 20 dernières</p>
            <ul className="lo-docs">{D.historique.map((h, i) => <li key={i} className="texte-13">{h.resultat === 'autorise' ? <Icone nom="check" taille={16} couleur="#12694F" /> : <Icone nom="alert" taille={16} couleur="#9B2E28" />}
              <div><strong>{d(h.le)}</strong><span className={h.resultat === 'refuse' ? 'rouge-txt' : 'gris'}>{h.resultat === 'autorise' ? 'Autorisée' : `Refusée${h.raison ? ` · ${h.raison.replace('_', ' ')}` : ''}`} · {[h.ip, h.pays].filter(Boolean).join(' · ')}</span></div></li>)}
              {!D.historique.length && <li className="gris texte-13">Aucune connexion inscrite.</li>}</ul></section>
        </div></div>}
      {onglet === 'aide' && <div className="grille-2-1">
        <section className="carte-l18"><h2 className="titre-carte">Questions fréquentes</h2>{FAQ.map(([q, r]) => <details key={q} className="faq"><summary>{q}</summary><p className="texte-13">{r}</p></details>)}
          <p className="gris texte-12" style={{ marginTop: 16 }}><a href="https://leaselane.ca/confidentialite" target="_blank" rel="noreferrer">Politique de confidentialité</a> · <a href="https://leaselane.ca/conditions" target="_blank" rel="noreferrer">Conditions d’utilisation</a></p></section>
        <form className="carte-l18" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_nous_joindre', aide, 'Message envoyé aux administrateurs.')) setAide({ sujet: '', message: '' }); }}>
          <h2 className="titre-carte">Nous joindre</h2>
          <label className="fenetre-lib" htmlFor="mc-s">Sujet</label><input id="mc-s" className="e70-raison" value={aide.sujet} onChange={(e) => setAide({ ...aide, sujet: e.target.value })} />
          <label className="fenetre-lib" htmlFor="mc-x" style={{ marginTop: 12 }}>Message</label><textarea id="mc-x" className="e70-raison" rows={6} value={aide.message} onChange={(e) => setAide({ ...aide, message: e.target.value })} />
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', marginTop: 12 }} disabled={envoi || aide.sujet.trim().length < 3 || aide.message.trim().length < 10}>Envoyer</button></form></div>}
    </>
  );
}
