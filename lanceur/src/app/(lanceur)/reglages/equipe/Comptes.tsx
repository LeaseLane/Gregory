'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Comptes de l'équipe : « À régler » d'abord, 4 tuiles-filtres, liste avec recherche, menu par compte (fiche, réinitialisation, renvoyer l'invitation, rappel 2FA,
   suspendre ou réactiver, retirer), invitation (nom, courriel, rôle), export CSV. Confirmation seulement pour retirer un accès ou donner le rôle Administrateur. */
type Compte = { user_id: string; nom: string; initiales: string; role: string; role_libelle: string; courriel: string; statut: string; deux_facteurs: boolean; derniere_connexion: string | null;
  depuis: string; titre: string | null; updated_at: string; activite: { action: string; le: string }[] | null };
type Invit = { id: string; nom: string; courriel: string; role: string; role_libelle: string; expire: string; expiree: boolean; par: string };
export type DonneesComptes = { comptes: Compte[]; invitations: Invit[]; roles: { role: string; libelle: string; permissions: string[] }[]; moi: string };
const ROLES: [string, string][] = [['gestionnaire', 'Gestionnaire'], ['location', 'Location'], ['prospection', 'Prospection'], ['comptabilite', 'Comptabilité (externe)'], ['lecture', 'Lecture seule'], ['admin', 'Administrateur']];
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jamais');

export function Comptes({ donnees: D, erreurLecture }: { donnees: DonneesComptes | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [filtre, setFiltre] = useState('tous'), [q, setQ] = useState('');
  const [menu, setMenu] = useState<string | null>(null), [fiche, setFiche] = useState<Compte | null>(null), [inviter, setInviter] = useState(false), [f, setF] = useState({ nom: '', courriel: '', role: 'gestionnaire' });
  const [confirmer, setConfirmer] = useState<null | { texte: string; faire: () => Promise<void> }>(null), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const actifs = D.comptes.filter((c) => c.statut === 'actif'), sans2fa = actifs.filter((c) => !c.deux_facteurs), susp = D.comptes.filter((c) => c.statut === 'suspendu');
  const L = (filtre === 'actifs' ? actifs : filtre === 'sans2fa' ? sans2fa : filtre === 'suspendus' ? susp : D.comptes.filter((c) => c.statut !== 'retire'))
    .filter((c) => !q || `${c.nom} ${c.courriel}`.toLowerCase().includes(q.toLowerCase()));
  const aRegler = [...sans2fa.map((c) => ({ id: c.user_id, t: `${c.nom} n’a pas activé la double authentification`, a: 'Envoyer un rappel', f: () => action(c, 'rappel_2fa', 'Rappel envoyé.') })),
    ...D.invitations.filter((i) => i.expiree).map((i) => ({ id: i.id, t: `Invitation expirée : ${i.nom}`, a: 'Renvoyer', f: () => invitation(i, 'renvoyer') }))];
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null); setMenu(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); setConfirmer(null); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  const action = (c: Compte, a: string, msg: string) => rpc('lanceur_compte_action', { user_id: c.user_id, action: a }, msg);
  const invitation = (i: Invit, a: string) => rpc('lanceur_compte_action', { invitation_id: i.id, action: a }, a === 'renvoyer' ? `Nouvelle invitation envoyée à ${i.courriel}.` : 'Invitation annulée.');
  async function reinitialiser(c: Compte) {
    setMenu(null); const { error } = await supabaseNavigateur().auth.resetPasswordForEmail(c.courriel, { redirectTo: `${window.location.origin}/auth/retour?suite=/mot-de-passe` });
    if (error) return setBandeau(error.message); await action(c, 'reinitialisation', `Lien de réinitialisation envoyé à ${c.courriel}.`);
  }
  async function changerRole(c: Compte, role: string) {
    const faire = async () => { await rpc('lanceur_maj_membre', { user_id: c.user_id, role, read_version: c.updated_at }, `Rôle de ${c.nom} : ${ROLES.find(([k]) => k === role)?.[1]}.`); setFiche(null); };
    if (role === 'admin') setConfirmer({ texte: `Donner le rôle Administrateur à ${c.nom}? Il pourra tout voir, gérer l’équipe et les permissions.`, faire }); else await faire();
  }
  function exporter() {
    const l = [['Nom', 'Courriel', 'Rôle', 'Statut', 'Double authentification', 'Dernière connexion'], ...D!.comptes.map((c) => [c.nom, c.courriel, c.role_libelle, c.statut, c.deux_facteurs ? 'oui' : 'non', c.derniere_connexion ?? ''])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + l.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' }));
    a.download = `comptes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
  const tuiles: [string, string, number][] = [['tous', 'Tous les comptes', D.comptes.filter((c) => c.statut !== 'retire').length], ['actifs', 'Actifs', actifs.length], ['sans2fa', 'Sans double authentification', sans2fa.length], ['suspendus', 'Suspendus', susp.length]];
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      {!!aRegler.length && <section className="carte-l18 e2" aria-label="À régler" style={{ marginBottom: 24 }}><h2 className="titre-carte" style={{ marginBottom: 8 }}>À régler</h2>
        <ul className="lo-docs">{aRegler.map((x) => <li key={x.id}><span className="a-faire-ic"><Icone nom="alert" taille={18} couleur="#0C2147" /></span><div><strong>{x.t}</strong></div><button className="lien" disabled={envoi} onClick={x.f}>{x.a}</button></li>)}</ul></section>}
      <div className="tuiles-filtres">{tuiles.map(([k, l, n]) => <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)} aria-pressed={filtre === k}><span>{l}</span><b>{n}</b></button>)}</div>
      <section className="carte-l18" aria-label="Comptes">
        <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Comptes de l’équipe</h2><p className="gris texte-13" style={{ margin: 0 }} aria-live="polite">{L.length} compte{L.length > 1 ? 's' : ''} affiché{L.length > 1 ? 's' : ''}</p></div>
          <span className="ligne-ic"><form className="lo-recherche" style={{ maxWidth: 240 }} onSubmit={(e) => e.preventDefault()}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou courriel" aria-label="Chercher un compte" /></form>
            <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={exporter}><Icone nom="download" taille={16} couleur="#0C2147" />Exporter</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setInviter(true)}><Icone nom="plus" taille={16} couleur="#fff" />Inviter une personne</button></span></div>
        <table className="tableau tab-fixe" style={{ marginTop: 16 }}><colgroup><col style={{ width: '32%' }} /><col style={{ width: '18%' }} /><col style={{ width: '16%' }} /><col style={{ width: '18%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
          <thead><tr><th>Personne</th><th>Rôle</th><th>Double authentification</th><th>Dernière connexion</th><th>Statut</th><th /></tr></thead>
          <tbody>{L.map((c) => <tr key={c.user_id}><td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{c.initiales}</span><span><button className="lien fort" onClick={() => setFiche(c)}>{c.nom}</button><span className="sous gris">{c.courriel}</span></span></span></td>
            <td>{c.role_libelle}</td><td>{c.deux_facteurs ? <span className="ligne-ic texte-13"><Icone nom="check" taille={16} couleur="#12694F" />Activée</span> : <span className="rouge-txt">À activer</span>}</td>
            <td className="texte-13">{date(c.derniere_connexion)}</td><td><span className={`puce ${c.statut === 'actif' ? 'info' : 'neutral'}`}>{c.statut === 'actif' ? 'Actif' : 'Suspendu'}</span></td>
            <td className="droite" style={{ position: 'relative' }}><button className="haut-ibtn" aria-haspopup="menu" aria-expanded={menu === c.user_id} aria-label={`Actions pour ${c.nom}`} onClick={() => setMenu(menu === c.user_id ? null : c.user_id)}>⋯</button>
              {menu === c.user_id && <div className="menu menu-ligne" role="menu">
                <button role="menuitem" onClick={() => { setMenu(null); setFiche(c); }}>Voir la fiche</button>
                <button role="menuitem" onClick={() => reinitialiser(c)}>Lien de réinitialisation</button>
                {!c.deux_facteurs && <button role="menuitem" onClick={() => action(c, 'rappel_2fa', 'Rappel 2FA envoyé.')}>Rappel 2FA</button>}
                {c.user_id !== D.moi && (c.statut === 'actif' ? <button role="menuitem" onClick={() => action(c, 'suspendre', `${c.nom} est suspendu·e; ses sessions sont fermées.`)}>Suspendre</button>
                  : <button role="menuitem" onClick={() => action(c, 'reactiver', `${c.nom} est réactivé·e.`)}>Réactiver</button>)}
                {c.user_id !== D.moi && <button role="menuitem" className="rouge-txt" onClick={() => setConfirmer({ texte: `Retirer l’accès de ${c.nom}? Ses sessions sont fermées tout de suite; l’accès se redonne seulement par une nouvelle invitation.`, faire: async () => { await action(c, 'retirer', `Accès de ${c.nom} retiré.`); } })}>Retirer l’accès</button>}
              </div>}</td></tr>)}
            {!L.length && <tr><td colSpan={6} className="gris">Aucun compte dans ce filtre.</td></tr>}</tbody></table>
        {!!D.invitations.length && <><h3 className="titre-carte" style={{ marginTop: 24, fontSize: 15 }}>Invitations en attente</h3>
          <ul className="lo-docs">{D.invitations.map((i) => <li key={i.id}><span className="a-faire-ic"><Icone nom="mail" taille={18} couleur="#0C2147" /></span><div><strong>{i.nom} · {i.role_libelle}</strong>
            <span className={`texte-13 ${i.expiree ? 'rouge-txt' : 'gris'}`}>{i.courriel} · {i.expiree ? 'expirée' : `expire le ${date(i.expire)}`} · par {i.par}</span></div>
            <button className="lien" onClick={() => invitation(i, 'renvoyer')}>Renvoyer</button><button className="lien" onClick={() => invitation(i, 'annuler_invitation')}>Annuler</button></li>)}</ul></>}
      </section>
      {fiche && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFiche(null)}>
        <div className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fc-t">
          <header className="tiroir-tete"><h2 id="fc-t">{fiche.nom}</h2><button className="haut-ibtn" onClick={() => setFiche(null)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            <p className="gris texte-13">{fiche.courriel}{fiche.titre ? ` · ${fiche.titre}` : ''} · membre depuis le {date(fiche.depuis)}</p>
            <label className="fenetre-lib" htmlFor="fc-r">Rôle et portée</label>
            <select id="fc-r" className="e70-raison" value={fiche.role} disabled={fiche.user_id === D.moi} onChange={(e) => changerRole(fiche, e.target.value)}>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Ce que ce rôle permet</p>
            <p className="texte-13" style={{ color: '#3E4A59' }}>{fiche.role === 'admin' ? 'Tout, y compris l’équipe, les permissions et le routeur IA.' : (D.roles.find((r) => r.role === fiche.role)?.permissions ?? []).join(' · ') || 'Aucun droit.'}</p>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Activité récente</p>
            <ul className="lo-docs">{(fiche.activite ?? []).map((a, i) => <li key={i} className="texte-13"><div><strong>{a.action}</strong><span className="gris">{date(a.le)}</span></div></li>)}{!fiche.activite?.length && <li className="gris texte-13">Aucune action inscrite.</li>}</ul>
          </div></div></div>}
      {inviter && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setInviter(false)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="iv-t" style={{ width: 460 }} onSubmit={async (e) => { e.preventDefault();
          const faire = async () => { if (await rpc('lanceur_inviter_equipe', f, `Invitation envoyée à ${f.courriel} (valable 72 heures).`)) { setInviter(false); setF({ nom: '', courriel: '', role: 'gestionnaire' }); } };
          if (f.role === 'admin') setConfirmer({ texte: `Inviter ${f.nom} comme Administrateur? Il pourra tout voir et gérer l’équipe.`, faire }); else await faire(); }}>
          <h2 id="iv-t" style={{ marginTop: 0, fontSize: 20 }}>Inviter une personne</h2>
          <label className="fenetre-lib" htmlFor="iv-n">Nom complet</label><input id="iv-n" className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} autoComplete="off" />
          <label className="fenetre-lib" htmlFor="iv-c" style={{ marginTop: 12 }}>Courriel</label><input id="iv-c" type="email" className="e70-raison" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} autoComplete="off" />
          <label className="fenetre-lib" htmlFor="iv-r" style={{ marginTop: 12 }}>Rôle</label><select id="iv-r" className="e70-raison" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <p className="gris texte-12">Un courriel avec un code personnel part tout de suite; la double authentification s’active à la première connexion.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setInviter(false)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || f.nom.trim().split(/\s+/).length < 2 || !f.courriel.includes('@')}>Inviter</button></div>
        </form></div>}
      {confirmer && <div className="voile" role="presentation" style={{ zIndex: 60 }}><div className="fenetre" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" style={{ width: 440 }}>
        <h2 id="cf-t" style={{ marginTop: 0, fontSize: 18 }}>Confirmer</h2><p>{confirmer.texte}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}><button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setConfirmer(null)}>Annuler</button>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi} onClick={() => confirmer.faire()}>Confirmer</button></div></div></div>}
    </>
  );
}
