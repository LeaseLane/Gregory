'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* Comptes de l'équipe : « À régler » d'abord, 4 tuiles-filtres, liste avec recherche, menu par compte (fiche, réinitialisation, renvoyer l'invitation, rappel 2FA,
   suspendre ou réactiver, retirer), invitation (nom, courriel, rôle), export CSV. Confirmation seulement pour retirer un accès ou donner le rôle Administrateur. */
type Compte = { user_id: string; nom: string; initiales: string; role: string; role_libelle: string; courriel: string; statut: string; deux_facteurs: boolean; derniere_connexion: string | null;
  depuis: string; titre: string | null; updated_at: string; activite: { action: string; le: string }[] | null };
type Invit = { id: string; nom: string; courriel: string; role: string; role_libelle: string; expire: string; expiree: boolean; par: string };
export type DonneesComptes = { comptes: Compte[]; invitations: Invit[]; roles: { role: string; libelle: string; permissions: string[] }[]; moi: string };
// e63 : rôles en tuiles (les 4 de la maquette d'abord), et les pipelines que chaque rôle ouvre
const TUILES_ROLE: [string, string, string][] = [['gestionnaire', 'Gestionnaire', 'Tout, y compris approuver'], ['location', 'Location', 'Ventes, Clients et Immeubles'], ['comptabilite', 'Comptabilité', 'Finances et rapports'],
  ['lecture', 'Lecture', 'Consulte sans rien modifier'], ['prospection', 'Prospection', 'Mandats et prospection IA'], ['admin', 'Administrateur', 'Tout, y compris l’équipe']];
const PIPELINES: [string, string][] = [['ventes.mandats.lire', 'Mandats propriétaires'], ['ventes.location.lire', 'Location'], ['ventes.lire', 'Leads entrants'], ['ventes.prospection.lire', 'Prospection IA']];
const ROLES: [string, string][] = [['gestionnaire', 'Gestionnaire'], ['location', 'Location'], ['prospection', 'Prospection'], ['comptabilite', 'Comptabilité (externe)'], ['lecture', 'Lecture seule'], ['admin', 'Administrateur']];

export function Comptes({ donnees: D, erreurLecture }: { donnees: DonneesComptes | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : t('Jamais'));
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [filtre, setFiltre] = useState('tous'), [q, setQ] = useState('');
  const [menu, setMenu] = useState<string | null>(null), [fiche, setFiche] = useState<Compte | null>(null), [inviter, setInviter] = useState(false), [f, setF] = useState({ nom: '', courriel: '', role: 'gestionnaire' });
  // Le menu d'une ligne près du bas de l'écran passait sous la barre de navigation (téléphone) : on le fait défiler dans la vue.
  useEffect(() => { if (menu) document.querySelector('.menu-ligne')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [menu]);
  const [confirmer, setConfirmer] = useState<null | { texte: string; faire: () => Promise<void> }>(null), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau ? t(bandeau) : bandeau}</div>;
  const actifs = D.comptes.filter((c) => c.statut === 'actif'), sans2fa = actifs.filter((c) => !c.deux_facteurs), susp = D.comptes.filter((c) => c.statut === 'suspendu');
  const L = (filtre === 'actifs' ? actifs : filtre === 'sans2fa' ? sans2fa : filtre === 'suspendus' ? susp : D.comptes.filter((c) => c.statut !== 'retire'))
    .filter((c) => !q || `${c.nom} ${c.courriel}`.toLowerCase().includes(q.toLowerCase()));
  const aRegler = [...sans2fa.map((c) => ({ id: c.user_id, t: t('{nom} n’a pas activé la double authentification', { nom: c.nom }), a: t('Envoyer un rappel'), f: () => action(c, 'rappel_2fa', t('Rappel envoyé.')) })),
    ...D.invitations.filter((i) => i.expiree).map((i) => ({ id: i.id, t: t('Invitation expirée : {nom}', { nom: i.nom }), a: t('Renvoyer'), f: () => invitation(i, 'renvoyer') }))];
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null); setMenu(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); setConfirmer(null); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  const action = (c: Compte, a: string, msg: string) => rpc('lanceur_compte_action', { user_id: c.user_id, action: a }, msg);
  const invitation = (i: Invit, a: string) => rpc('lanceur_compte_action', { invitation_id: i.id, action: a }, a === 'renvoyer' ? t('Nouvelle invitation envoyée à {courriel}.', { courriel: i.courriel }) : t('Invitation annulée.'));
  async function reinitialiser(c: Compte) {
    // Envoyé par le serveur (lien valable dans n'importe quel navigateur) : depuis le navigateur de l'admin, le lien ne marchait que chez l'admin.
    setMenu(null); const r = await fetch('/api/mot-de-passe-equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courriel: c.courriel }) });
    if (!r.ok) return setBandeau((await r.json().catch(() => ({}))).error ?? t('Le lien n’a pas pu être envoyé.')); await action(c, 'reinitialisation', t('Lien de réinitialisation envoyé à {courriel}.', { courriel: c.courriel }));
  }
  async function changerRole(c: Compte, role: string) {
    const faire = async () => { await rpc('lanceur_maj_membre', { user_id: c.user_id, role, read_version: c.updated_at }, t('Rôle de {nom} : {role}.', { nom: c.nom, role: t(ROLES.find(([k]) => k === role)?.[1] ?? role) })); setFiche(null); };
    if (role === 'admin') setConfirmer({ texte: t('Donner le rôle Administrateur à {nom}? Il pourra tout voir, gérer l’équipe et les permissions.', { nom: c.nom }), faire }); else await faire();
  }
  function exporter() {
    const l = [[t('Nom'), t('Courriel'), t('Rôle'), t('Statut'), t('Double authentification'), t('Dernière connexion')], ...D!.comptes.map((c) => [c.nom, c.courriel, t(c.role_libelle), c.statut, c.deux_facteurs ? t('oui') : t('non'), c.derniere_connexion ?? ''])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + l.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' }));
    a.download = `comptes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
  const tuiles: [string, string, number][] = [['tous', t('Tous les comptes'), D.comptes.filter((c) => c.statut !== 'retire').length], ['actifs', t('Actifs'), actifs.length], ['sans2fa', t('Sans double authentification'), sans2fa.length], ['suspendus', t('Suspendus'), susp.length]];
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{t(bandeau)}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {!!aRegler.length && <section className="carte-l18 e2" aria-label={t('À régler')} style={{ marginBottom: 24 }}><h2 className="titre-carte" style={{ marginBottom: 8 }}>{t('À régler')}</h2>
        <ul className="lo-docs">{aRegler.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="alert" taille={18} couleur="#0C2147" /></span><div><strong>{x.t}</strong></div><button className="lien" disabled={envoi} onClick={x.f}>{x.a}</button></li>)}</ul></section>}
      <div className="tuiles-filtres">{tuiles.map(([k, l, n]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)} aria-pressed={filtre === k}><span>{l}</span><b>{n}</b></button>)}</div>
      <section className="carte-l18" aria-label={t('Comptes')}>
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Comptes de l’équipe')}</h2><p className="gris texte-13" style={{ margin: 0 }} aria-live="polite">{L.length > 1 ? t('{n} comptes affichés', { n: L.length }) : t('{n} compte affiché', { n: L.length })}</p></div>
          <span className="ligne-ic"><form className="lo-recherche" style={{ maxWidth: 240 }} onSubmit={(e) => e.preventDefault()}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Nom ou courriel')} aria-label={t('Chercher un compte')} /></form>
            <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={exporter}><Icone nom="download" taille={16} couleur="#0C2147" />{t('Exporter')}</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setInviter(true)}><Icone nom="plus" taille={16} couleur="#fff" />{t('Inviter une personne')}</button></span></div>
        <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '32%' }} /><col style={{ width: '18%' }} /><col style={{ width: '16%' }} /><col style={{ width: '18%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
          <thead><tr><th>{t('Personne')}</th><th>{t('Rôle')}</th><th>{t('Double authentification')}</th><th>{t('Dernière connexion')}</th><th>{t('Statut')}</th><th /></tr></thead>
          <tbody>{L.map((c) => <tr key={c.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{c.initiales}</span><span><button className="lien fort" onClick={() => setFiche(c)}>{c.nom}</button><span className="sous gris">{c.courriel}</span></span></span></td>
            <td>{t(c.role_libelle)}</td><td>{c.deux_facteurs ? <span className="ligne-ic texte-13"><Icone nom="check" taille={16} couleur="#12694F" />{t('Activée')}</span> : <span className="rouge-txt">{t('À activer')}</span>}</td>
            <td className="texte-13">{date(c.derniere_connexion)}</td><td><span className={`puce ${c.statut === 'actif' ? 'info' : 'neutral'}`}>{c.statut === 'actif' ? t('Actif') : t('Suspendu')}</span></td>
            <td className="droite" style={{ position: 'relative' }}><button className="haut-ibtn" aria-haspopup="menu" aria-expanded={menu === c.user_id} aria-label={t('Actions pour {nom}', { nom: c.nom })} onClick={() => setMenu(menu === c.user_id ? null : c.user_id)}>⋯</button>
              {menu === c.user_id && <div className="menu menu-ligne" role="menu">
                <button role="menuitem" onClick={() => { setMenu(null); setFiche(c); }}>{t('Voir la fiche')}</button>
                <button role="menuitem" onClick={() => reinitialiser(c)}>{t('Lien de réinitialisation')}</button>
                {!c.deux_facteurs && <button role="menuitem" onClick={() => action(c, 'rappel_2fa', t('Rappel 2FA envoyé.'))}>{t('Rappel 2FA')}</button>}
                {c.user_id !== D.moi && (c.statut === 'actif' ? <button role="menuitem" onClick={() => setConfirmer({ texte: t('Suspendre {nom}? Ses sessions sont fermées tout de suite; l’accès revient avec « Réactiver ».', { nom: c.nom }), faire: async () => { await action(c, 'suspendre', t('{nom} est suspendu·e; ses sessions sont fermées.', { nom: c.nom })); } })}>{t('Suspendre')}</button>
                  : <button role="menuitem" onClick={() => action(c, 'reactiver', t('{nom} est réactivé·e.', { nom: c.nom }))}>{t('Réactiver')}</button>)}
                {c.user_id !== D.moi && <button role="menuitem" className="rouge-txt" onClick={() => setConfirmer({ texte: t('Retirer l’accès de {nom}? Ses sessions sont fermées tout de suite; l’accès se redonne seulement par une nouvelle invitation.', { nom: c.nom }), faire: async () => { await action(c, 'retirer', t('Accès de {nom} retiré.', { nom: c.nom })); } })}>{t('Retirer l’accès')}</button>}
              </div>}</td></tr>)}
            {!L.length && <tr><td colSpan={6} className="gris">{t('Aucun compte dans ce filtre.')}</td></tr>}</tbody></table>
        {!!D.invitations.length && <><h3 className="titre-carte" style={{ marginTop: 24, fontSize: 15 }}>{t('Invitations en attente')}</h3>
          <ul className="lo-docs">{D.invitations.map((i) => <li key={i.id}><span className="a-faire-ic"><Icone nom="mail" taille={18} couleur="#0C2147" /></span><div><strong>{i.nom} · {t(i.role_libelle)}</strong>
            <span className={`texte-13 ${i.expiree ? 'rouge-txt' : 'gris'}`}>{i.courriel} · {i.expiree ? t('expirée') : t('expire le {date}', { date: date(i.expire) })} · {t('par {nom}', { nom: i.par })}</span></div>
            <button className="lien" onClick={() => invitation(i, 'renvoyer')}>{t('Renvoyer')}</button><button className="lien" onClick={() => invitation(i, 'annuler_invitation')}>{t('Annuler')}</button></li>)}</ul></>}
      </section>
      {fiche && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFiche(null)}>
        <div className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fc-t">
          <header className="tiroir-tete"><h2 id="fc-t">{fiche.nom}</h2><button className="haut-ibtn" onClick={() => setFiche(null)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            <p className="gris texte-13">{fiche.courriel}{fiche.titre ? ` · ${fiche.titre}` : ''} · {t('membre depuis le {date}', { date: date(fiche.depuis) })}</p>
            <label className="fenetre-lib" htmlFor="fc-r">{t('Rôle et portée')}</label>
            <select id="fc-r" className="e70-raison" value={fiche.role} disabled={fiche.user_id === D.moi} onChange={(e) => changerRole(fiche, e.target.value)}>{ROLES.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Ce que ce rôle permet')}</p>
            <p className="texte-13" style={{ color: '#3E4A59' }}>{fiche.role === 'admin' ? t('Tout, y compris l’équipe, les permissions et le routeur IA.') : (D.roles.find((r) => r.role === fiche.role)?.permissions ?? []).join(' · ') || t('Aucun droit.')}</p>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Activité récente')}</p>
            <ul className="lo-docs">{(fiche.activite ?? []).map((a, i) => <li key={i} className="texte-13"><div><strong>{a.action}</strong><span className="gris">{date(a.le)}</span></div></li>)}{!fiche.activite?.length && <li className="gris texte-13">{t('Aucune action inscrite.')}</li>}</ul>
          </div></div></div>}
      {inviter && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setInviter(false)}>
        <form className="fenetre fenetre-invit" role="dialog" aria-modal="true" aria-labelledby="iv-t" onSubmit={async (e) => { e.preventDefault();
          const faire = async () => { if (await rpc('lanceur_inviter_equipe', f, t('Invitation envoyée à {courriel} (valable 72 heures).', { courriel: f.courriel }))) { setInviter(false); setF({ nom: '', courriel: '', role: 'gestionnaire' }); } };
          if (f.role === 'admin') setConfirmer({ texte: t('Inviter {nom} comme Administrateur? Il pourra tout voir et gérer l’équipe.', { nom: f.nom }), faire }); else await faire(); }}>
          <div className="ligne-entre" style={{ alignItems: 'flex-start' }}><h2 id="iv-t" className="fenetre-titre">{t('Inviter une personne dans l’équipe?')}</h2>
            <button type="button" className="fenetre-x" onClick={() => setInviter(false)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="texte-14" style={{ margin: '4px 0 20px', color: '#3E4A59' }}>{t('Elle recevra un courriel pour créer son accès. Vous pourrez changer son rôle en tout temps.')}</p>
          <label className="fenetre-lib" htmlFor="iv-c">{t('Courriel')} <span className="gris texte-12">{t('obligatoire')}</span></label><input id="iv-c" type="email" className="e70-raison" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} autoComplete="off" autoFocus />
          <label className="fenetre-lib" htmlFor="iv-n" style={{ marginTop: 16 }}>{t('Nom complet')} <span className="gris texte-12">{t('pour le courriel d’invitation')}</span></label><input id="iv-n" className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} autoComplete="off" />
          <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Rôle')}</p>
          <div className="tuiles-role" role="radiogroup" aria-label={t('Rôle')}>{TUILES_ROLE.map(([k, l, d]) => <label key={k} className={f.role === k ? 'choisi' : ''}>
            <input type="radio" name="iv-role" checked={f.role === k} onChange={() => setF({ ...f, role: k })} /><span><b>{t(l)}</b><span className="bloc gris texte-12">{t(d)}</span></span></label>)}</div>
          <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Accès par pipeline')} <span className="gris texte-12">{t('selon le rôle')}</span></p>
          <div className="pipelines-role">{PIPELINES.map(([perm, l]) => { const permis = D.roles.find((r) => r.role === f.role)?.permissions ?? []; return <label key={perm} className="ligne-ic texte-14">
            <input type="checkbox" checked={f.role === 'admin' || permis.includes('*') || permis.includes(perm)} disabled readOnly />{t(l)}</label>; })}</div>
          <p className="gris texte-12" style={{ margin: '4px 0 0' }}>{t('L’accès suit le rôle choisi; un accès sur mesure par pipeline n’est pas encore offert.')}</p>
          <div className="note-securite"><Icone nom="lock" taille={20} couleur="#0C2147" /><span><b>{t('La double authentification sera exigée.')}</b><span className="bloc">{t('L’invitation expire dans 72 heures.')}</span></span></div>
          <div className="fenetre-boutons"><button type="button" className="bouton bouton-contour" onClick={() => setInviter(false)}>{t('Annuler')}</button>
            <button className="bouton bouton-principal" disabled={envoi || f.nom.trim().split(/\s+/).length < 2 || !f.courriel.includes('@')}><Icone nom="send" taille={18} couleur="#fff" />{t('Envoyer l’invitation')}</button></div>
        </form></div>}
      {confirmer && <div className="voile" role="presentation" style={{ zIndex: 60 }}><div className="fenetre" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" style={{ width: 440 }}>
        <h2 id="cf-t" style={{ marginTop: 0, fontSize: 18 }}>{t('Confirmer')}</h2><p>{confirmer.texte}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setConfirmer(null)}>{t('Annuler')}</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi} onClick={() => confirmer.faire()}>{t('Confirmer')}</button></div></div></div>}
    </>
  );
}
