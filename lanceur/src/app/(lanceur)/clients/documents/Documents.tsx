'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { qc } from '@/lib/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

type Signataire = { ord: number; nom: string; role: string; statut: string; ouvert: string | null; signe: string | null };
type Enveloppe = { id: string; kind: string; titre: string; sous: string | null; statut: string; envoyee: string | null; par: string | null; relances: number; prochaine: string | null;
  simule: boolean; termine: string | null; facture: { statut: string; fournisseur: string; id: string | null } | null; signataires: Signataire[] };
export type DonneesDocs = { enveloppes: Enveloppe[]; recus: { id: string; titre: string; type: string | null; le: string; de: string | null }[]; delais: { kind: string; jours: number }[];
  sans_mandat: { id: string; nom: string }[]; peut_ecrire: boolean };

const TYPES: Record<string, string> = { mandat: 'Mandat de gestion', bail: 'Bail', avenant_cession: 'Avenant', avis_renouvellement: 'Avis de renouvellement', autre: 'Autre' };
const CLASSES: Record<string, string> = { assurance: 'Assurances', bail: 'Baux', facture: 'Dépenses', releve: 'Solvabilité', identite: 'Identité' };
const auj = qc(new Date()).iso;
const quand = (iso: string, t: T, locale: string) => { const x = new Date(iso), q = qc(x); return q.iso === auj ? `${t('auj.')} ${locale.startsWith('fr') ? `${q.h} h${q.min ? String(q.min).padStart(2, '0') : ''}` : `${q.h}:${String(q.min).padStart(2, '0')}`}` : x.toLocaleDateString(locale, { day: 'numeric', month: 'short' }); };
const jours = (n: number, t: T, locale: string) => n < 1 ? t('< 1 j') : t('{n} j', { n: locale.startsWith('fr') ? String(n).replace('.', ',') : String(n) });
const signes = (e: Enveloppe) => e.signataires.filter((s) => s.statut === 'signed').length;
function statut(e: Enveloppe, t: T) {
  return { draft: t('Brouillon'), sent: t('{a} sur {b}', { a: signes(e), b: e.signataires.length }), signed: t('Signée'), declined: t('Refusée'), cancelled: t('Annulée') }[e.statut] ?? e.statut;
}
function relance(e: Enveloppe, t: T, locale: string) {
  if (e.statut === 'draft') return t('à envoyer');
  if (e.statut !== 'sent') return e.termine ? quand(e.termine, t, locale) : '—';
  if (!e.signataires.some((s) => s.role === 'locataire' && s.statut !== 'signed')) return t('par eZsign');
  return e.prochaine ? `${quand(e.prochaine, t, locale)} · ${t('{a} sur {b}', { a: e.relances, b: 3 })}` : t('{a} sur {b}', { a: e.relances, b: 3 });
}

export function Documents({ donnees, erreurLecture }: { donnees: DonneesDocs | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const qd = (iso: string) => quand(iso, t, locale), jr = (n: number) => jours(n, t, locale);
  const E = donnees?.enveloppes ?? [];
  const [sel, setSel] = useState<string | null>(E.find((e) => e.statut === 'sent')?.id ?? E[0]?.id ?? null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [proprio, setProprio] = useState('');
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, e = E.find((x) => x.id === sel) ?? null, maxJ = Math.max(1, ...D.delais.map((x) => x.jours));
  const enAttente = e?.signataires.find((s) => s.statut !== 'signed') ?? null;

  async function fonction(corps: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null);
    const r = await fetch('/api/signatures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const j = await r.json().catch(() => ({})); setEnvoi(false);
    if (!r.ok) { setBandeau(j.error ?? t('L’action n’a pas pu se faire.')); return; } setToast(ok); router.refresh();
  }
  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { data, error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return null; } setToast(ok); router.refresh(); return data;
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label={t('Enveloppes à signer')}>
            <header className="carte-tete tete-action"><div><h2>{t('Enveloppes à signer')}</h2><p>{t('{n} en cours · relances automatiques', { n: E.filter((x) => x.statut === 'sent').length })}</p></div>
              {D.peut_ecrire && D.sans_mandat.length > 0 && <div className="ligne-champ">
                <select className="e70-raison" value={proprio} onChange={(ev) => setProprio(ev.target.value)} aria-label={t('Propriétaire sans mandat')}><option value="">{t('Mandat pour…')}</option>{D.sans_mandat.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select>
                <button className="bouton bouton-contour" disabled={envoi || !proprio} onClick={async () => { const id = await rpc('lanceur_creer_signature', { p: { kind: 'mandat', owner_id: proprio } }, t('Mandat préparé : vérifiez-le, puis envoyez.')); if (id) { setSel(id as string); setProprio(''); } }}>{t('Préparer')}</button></div>}
            </header>
            <table className="tableau">
              <colgroup><col style={{ width: '33%' }} /><col style={{ width: '17%' }} /><col style={{ width: '15%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
              <thead><tr><th>{t('Document')}</th><th>{t('Signataires')}</th><th>{t('Statut')}</th><th>{t('Envoyée')}</th><th className="droite">{t('Relance')}</th></tr></thead>
              <tbody>{E.map((x) => (
                <tr key={x.id} className={x.id === sel ? 'sel' : ''} onClick={() => setSel(x.id)}>
                  <td><span className="cellule-doc"><strong className="fort">{TYPES[x.kind] ? t(TYPES[x.kind]) : x.titre}</strong><span className="gris">{x.sous}</span></span></td>
                  <td><span className="signataires">{x.signataires.map((s) => <span key={s.ord} className="ini-etat" title={`${s.nom} · ${s.statut === 'signed' ? t('signé') : t('pas encore signé')}`}>
                    <span className="ini" style={{ width: 28, height: 28, fontSize: 11 }}>{initiales(s.nom)}</span>{s.statut === 'signed' ? <span className="okdot"><Icone nom="check" taille={9} couleur="#fff" trait={2.6} /></span> : <i />}</span>)}</span></td>
                  <td className={x.statut === 'draft' || x.statut === 'cancelled' ? 'gris' : 'fort'}>{statut(x, t)}</td>
                  <td>{x.envoyee ? qd(x.envoyee) : '—'}</td>
                  <td className="droite gris">{relance(x, t, locale)}</td></tr>))}
                {!E.length && <tr><td colSpan={5} className="gris">{t('Aucun document en attente de signature.')}</td></tr>}</tbody>
            </table>
          </section>
          <section className="carte-l18" aria-label={t('Reçus par les portails')}>
            <header className="carte-tete sans-marge"><h2>{t('Reçus par les portails')}</h2><p>{t('Échange sécurisé · classés par l’IA · analysés avant ouverture')}</p></header>
            <ul className="modeles">{D.recus.map((r) => <li key={r.id}><span className="appel-ic"><Icone nom={r.type === 'facture' ? 'receipt' : 'file'} taille={20} couleur="#0C2147" /></span>
              <div><strong>{r.titre}</strong><span>{r.de ? `${r.de} · ` : ''}{qd(r.le)}</span></div>{r.type && <span className="puce">{t('Classé : {c}', { c: CLASSES[r.type] ? t(CLASSES[r.type]) : r.type })}</span>}</li>)}
              {!D.recus.length && <li className="gris">{t('Aucun document reçu.')}</li>}</ul>
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label={t('Suivi de la signature')}>
            {!e ? <p className="gris" style={{ margin: 0 }}>{t('Choisissez une enveloppe.')}</p> : <>
              <header className="carte-tete sans-marge"><h2>{TYPES[e.kind] ? t(TYPES[e.kind]) : e.titre}{e.sous ? ` · ${e.sous}` : ''}</h2>
                <p>{e.envoyee ? `${t('Envoyée')} ${qd(e.envoyee).replace(t('auj.'), t('aujourd’hui à'))}${e.par ? ` ${t('par {nom}', { nom: e.par })}` : ''}${e.simule ? ` · ${t('simulateur')}` : ''}` : t('Brouillon : rien n’est parti')}</p></header>
              <ul className="signataires-suivi">{e.signataires.map((s, i) => { const avant = e.signataires.slice(0, i).some((p) => p.statut !== 'signed'); return (
                <li key={s.ord}><span className="ini-etat grand"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(s.nom)}</span>{s.statut === 'signed' ? <span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={2.6} /></span> : <i className={e.statut === 'sent' && !avant ? 'actuel' : ''} />}</span>
                  <div><strong>{s.nom}</strong><span className={s.statut === 'signed' ? 'gris' : ''}>{s.statut === 'signed' ? t('Signé {d}', { d: qd(s.signe!) }) : s.statut === 'declined' ? t('A refusé de signer')
                    : e.statut !== 'sent' ? (s.role === 'equipe' ? t('Signera en dernier') : t('Signera en premier')) : avant ? t('Signera après {nom}', { nom: e.signataires[i - 1].nom.split(' ')[0] }) : s.ouvert ? t('Ouvert {d} · pas encore signé', { d: qd(s.ouvert) }) : t('Pas encore ouvert')}</span></div>
                  {e.simule && e.statut === 'sent' && s.statut !== 'signed' && !avant && <button className="lien" disabled={envoi} onClick={() => fonction({ action: 'simuler', id: e.id, ord: s.ord, type: 'signed' }, t('{nom} a signé (simulateur).', { nom: s.nom.split(' ')[0] }))}>{t('Simuler la signature')}</button>}</li>); })}</ul>
              {e.facture && <p className="ligne-ic" style={{ marginTop: 16 }}><Icone nom="receipt" taille={18} couleur="#2E5788" />{e.facture.statut === 'created' ? t('Facture d’honoraires créée ({qb}) · PRO-02 envoyé', { qb: e.facture.fournisseur === 'simulateur' ? t('simulateur QuickBooks') : 'QuickBooks' }) : t('QuickBooks non branché : facture à créer à la main · PRO-02 envoyé')}</p>}
              {e.statut === 'sent' && <p className="texte-13" style={{ margin: '20px 0' }}>{t('Relance automatique tous les 2 jours, 3 fois au plus, jamais entre 22 h et 8 h.')}</p>}
              {D.peut_ecrire && e.statut === 'draft' && <div className="studio-actions sans-marge" style={{ marginTop: 20, gridTemplateColumns: '1fr auto' }}>
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => fonction({ action: 'envoyer', id: e.id }, t('Enveloppe envoyée.'))}>{t('Envoyer à signer')}</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_annuler_signature', { p_id: e.id }, t('Brouillon annulé.'))}>{t('Annuler')}</button></div>}
              {D.peut_ecrire && e.statut === 'sent' && enAttente?.role === 'locataire' && <button className="bouton bouton-contour pleine" disabled={envoi || e.relances >= 3}
                onClick={() => rpc('lanceur_relancer_signature', { p_id: e.id }, t('Relance envoyée à {nom}.', { nom: enAttente.nom.split(' ')[0] }))}><Icone nom="send" taille={16} couleur="#0C2147" />{t('Relancer {nom} maintenant', { nom: enAttente.nom.split(' ')[0] })}</button>}
            </>}
          </section>
          <section className="carte-l18" aria-label={t('Délai de signature')}>
            <header className="carte-tete sans-marge"><h2>{D.delais.length ? (D.delais[0].kind === 'mandat' ? t('Les mandats prennent {j}', { j: jr(D.delais[0].jours) }) : D.delais[0].kind === 'bail' ? t('Les baux prennent {j}', { j: jr(D.delais[0].jours) }) : t('Les {type} prennent {j}', { type: (TYPES[D.delais[0].kind] ? t(TYPES[D.delais[0].kind]) : D.delais[0].kind).toLowerCase(), j: jr(D.delais[0].jours) })) : t('Délai de signature')}</h2><p>{t('Délai médian de signature · 90 derniers jours')}</p></header>
            {D.delais.length ? <ul className="barres">{D.delais.map((x, i) => <li key={x.kind}><span>{TYPES[x.kind] ? t(TYPES[x.kind]) : x.kind}</span><i style={{ width: `${Math.max(2, (100 * x.jours) / maxJ)}%`, background: i ? '#C8D2DE' : undefined }} /><b>{jr(x.jours)}</b></li>)}</ul>
              : <p className="gris" style={{ margin: 0, fontSize: 13 }}>{t('Aucune enveloppe signée depuis 90 jours.')}</p>}
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
