'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

type Contact = { id: string; nom: string; sous: string | null; roles: string[]; deals: number; pipeline: string | null; deal_id: string | null; c_email: boolean; c_sms: boolean; derniere: string | null; quoi: string | null };
export type DonneesContacts = { total: number; filtres: number; contacts: Contact[]; consentements: { email: number; sms: number; aucun: number };
  doublons: { a: string; b: string; nom: string; nom_b: string; confiance: number; pourquoi: string; detail_a: string; detail_b: string }[] };
const ROLES: [string, string][] = [['', 'Tous'], ['Propriétaire', 'Propriétaires'], ['Locataire', 'Locataires'], ['Référent', 'Référents'], ['Fournisseur', 'Fournisseurs']];
const TZ = 'America/Toronto';
const quand = (iso: string | null) => { if (!iso) return '—'; const d = new Date(iso), j = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: TZ });
  return j(d) === j(new Date()) ? `auj. ${d.toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(':', ' h ')}` : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: TZ }); };

export function Contacts({ donnees, role, q, tout, erreurLecture }: { donnees: DonneesContacts | null; role: string; q: string; tout: boolean; erreurLecture: string | null }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState(q), [sel, setSel] = useState(0), [comparer, setComparer] = useState(false), [survivant, setSurvivant] = useState<'a' | 'b'>('a');
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  const aller = (p: Record<string, string>) => { const u = new URLSearchParams({ ...(role ? { role } : {}), ...(recherche ? { q: recherche } : {}), ...p });
    for (const [k, v] of [...u]) if (!v) u.delete(k); router.push(`/ventes/contacts${u.size ? `?${u}` : ''}`); };
  useEffect(() => { if (recherche === q) return; const t = setTimeout(() => aller({ q: recherche }), 350); return () => clearTimeout(t); }); // eslint-disable-line react-hooks/exhaustive-deps
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const d = donnees.doublons[sel];
  const pct = (n: number) => donnees.total ? Math.round((100 * n) / donnees.total) : 0;
  const barres: [string, number][] = [['Courriel', donnees.consentements.email], ['SMS', donnees.consentements.sms], ['Aucun', donnees.consentements.aucun]];
  const faible = barres.slice(0, 2).sort((a, b) => a[1] - b[1])[0];

  async function agir(f: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setEnvoi(true); setBandeau(null); const { error } = await f(); setEnvoi(false);
    if (error) setBandeau(error.message); else { setToast(ok); setComparer(false); setSel(0); router.refresh(); }
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <div className="filtres">
            <label className="chercher" style={{ flex: 1, width: 'auto', marginLeft: 0 }}><Icone nom="search" taille={20} couleur="#58697F" />
              <input type="search" placeholder="Chercher un nom, un courriel ou un téléphone" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Chercher un contact" /></label>
            <div className="segment vue" style={{ width: 'auto' }} role="tablist" aria-label="Filtre par rôle">
              {ROLES.map(([k, l]) => <button key={l} role="tab" aria-selected={role === k} className={role === k ? 'actif' : ''} onClick={() => aller({ role: k })}>{l}</button>)}
            </div>
          </div>
          <section className="studio-liste" aria-label="Contacts">
            <header className="carte-tete"><h2>{donnees.filtres} contact{donnees.filtres > 1 ? 's' : ''}{donnees.filtres !== donnees.total ? ` sur ${donnees.total}` : ''}</h2><p>Une personne peut avoir plusieurs rôles · les plus récents d’abord</p></header>
            <table className="tableau">
              <colgroup><col style={{ width: '30%' }} /><col style={{ width: '22%' }} /><col style={{ width: '13%' }} /><col style={{ width: '18%' }} /><col style={{ width: '17%' }} /></colgroup>
              <thead><tr><th>Nom</th><th>Rôles</th><th>Deals liés</th><th>Consentements LCAP</th><th className="droite">Dernière activité</th></tr></thead>
              <tbody>{donnees.contacts.map((c) => (
                <tr key={c.id} onClick={() => c.deal_id && router.push(`/ventes/deals/${c.deal_id}`)} style={{ cursor: c.deal_id ? 'pointer' : 'default' }}>
                  <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(c.nom)}</span><span><strong className="fort">{c.nom}</strong><span className="sous gris">{c.sous}</span></span></span></td>
                  <td><span className="puces">{c.roles.length ? c.roles.map((r) => <span key={r} className="puce">{r}</span>) : <span className="gris">Contact</span>}</span></td>
                  <td>{c.deals ? <span className="deux-lignes"><span>{c.deals} deal{c.deals > 1 ? 's' : ''}</span><span className="gris">{c.pipeline}</span></span> : <span className="gris">Aucun</span>}</td>
                  <td><span className="consent-ligne"><Pastille ok={c.c_email} l="Courriel" /><Pastille ok={c.c_sms} l="SMS" /></span></td>
                  <td className="droite"><span className="deux-lignes"><span>{quand(c.derniere)}</span><span className="gris">{c.quoi}</span></span></td>
                </tr>))}
                {!donnees.contacts.length && <tr><td colSpan={5} className="gris">Aucun contact.</td></tr>}</tbody>
            </table>
            <div className="pied-contacts">
              {donnees.filtres > donnees.contacts.length ? <button className="lien" onClick={() => aller({ tout: '1' })}>Afficher les {donnees.filtres - donnees.contacts.length} autres contacts</button> : tout ? <button className="lien" onClick={() => aller({ tout: '' })}>Afficher moins</button> : <span />}
              <span className="consent-ligne gris"><Pastille ok l="Consentement exprès ou tacite valide" /><Pastille ok={false} l="Aucun" /></span>
            </div>
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Doublons à vérifier">
            <header className="carte-tete sans-marge"><h2>{donnees.doublons.length ? `${donnees.doublons.length} doublon${donnees.doublons.length > 1 ? 's' : ''} à vérifier` : 'Aucun doublon à vérifier'}</h2><p>Repérés automatiquement · rien n’est fusionné sans vous</p></header>
            <ul className="paires">{donnees.doublons.slice(0, 3).map((p, i) => (
              <li key={p.a + p.b} className={i === sel ? 'sel' : ''}><button onClick={() => { setSel(i); setComparer(false); }}>
                <span className="appel-ic"><Icone nom="layers" taille={20} couleur="#0C2147" /></span>
                <span><strong>{p.nom}</strong><span>{p.pourquoi}</span></span><span className="conf"><b>{p.confiance} %</b><span>confiance</span></span></button></li>))}</ul>
            {d && (comparer ? <>
              <p className="surtitre gris">Garder comme fiche principale</p>
              <fieldset className="durees">{(['a', 'b'] as const).map((k) => <label key={k} className={survivant === k ? 'choisi' : ''}><input type="radio" name="s" checked={survivant === k} onChange={() => setSurvivant(k)} />{k === 'a' ? d.nom : d.nom_b} · {k === 'a' ? d.detail_a : d.detail_b}</label>)}</fieldset>
              <div className="studio-actions sans-marge" style={{ gridTemplateColumns: '140px 1fr' }}>
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => agir(() => supabaseNavigateur().rpc('lanceur_fusionner_contacts', { p_survivant: survivant === 'a' ? d.a : d.b, p_perdant: survivant === 'a' ? d.b : d.a }), 'Fiches fusionnées.')}>Fusionner</button>
                <button className="bouton bouton-contour" onClick={() => setComparer(false)}>Annuler</button></div></>
              : <div className="studio-actions sans-marge" style={{ gridTemplateColumns: '188px 1fr' }}>
                <button className="bouton bouton-principal" onClick={() => setComparer(true)}>Comparer les fiches</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir(() => supabaseNavigateur().rpc('lanceur_garder_les_deux', { p_a: d.a, p_b: d.b }), 'Les deux fiches sont gardées.')}>Garder les deux fiches</button></div>)}
          </section>
          <section className="carte-l18" aria-label="Consentements LCAP">
            <header className="carte-tete sans-marge"><h2>{`Le ${faible[0] === 'SMS' ? 'SMS' : 'courriel'} n’atteint que ${pct(faible[1])} % des contacts`}</h2><p>Consentements LCAP · part des {donnees.total} contacts</p></header>
            <ul className="barres">{barres.map(([l, n]) => <li key={l} style={{ gridTemplateColumns: '88px minmax(0,1fr) 48px' }}><span>{l}</span><i style={{ width: `${pct(n)}%`, background: l === faible[0] ? '#4581CB' : '#A6B1BE' }} /><b>{pct(n)} %</b></li>)}</ul>
            <p className="note">Sans consentement, aucun envoi commercial : seulement les messages liés au dossier (bail, mandat, paiement).</p>
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Pastille({ ok, l }: { ok: boolean; l: string }) {
  return <span className="pastille-c">{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <i />}{l}</span>;
}
