'use client';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarChart } from '@/composants/dataviz';
import { choisirPortee } from '@/composants/Portee';
import { argent as argentBase } from '../onglets';
import { useT } from '@/composants/Langue';
import { motifs } from '@/lib/i18n/motifs';

type Immeuble = { id: string; adresse: string; logements: number; occupes: number; attendu: number; paye: number; stationnement: number; buanderie: number; autre: number; depenses: number; net: number; alertes: number };
type Client = { id: string; nom: string; attendu: number; paye: number; autres: number; depenses: number; net: number; alertes: number; immeubles: Immeuble[] };
type Alerte = { immeuble_id: string; immeuble: string; client: string; client_id: string; type: 'tresorerie' | 'perception' | 'depense'; cle: string; texte: string; montant: number; sorte: 'travaux' | 'debours' | 'facture' | null;
  vue: { par: string | null; le: string; note: string | null } | null };
export type DonneesVue = { mois: string; courant: boolean; seuils: Record<string, number>;
  total: { attendu: number; paye: number; autres: number; depenses: number; net: number; immeubles: number; logements: number; occupes: number };
  clients: Client[]; alertes: Alerte[]; serie: { mois: string; revenus: number; depenses: number }[];
  autres_revenus: { id: string; immeuble: string; type: string; montant: number; le: string; note: string | null }[]; immeubles: { id: string; adresse: string }[]; peut_ecrire: boolean };

const TYPE: Record<Alerte['type'], string> = { tresorerie: 'Flux de trésorerie', perception: 'Loyers perçus', depense: 'Dépense inhabituelle' };
// Où regarder le détail d'une alerte : l'écran qui liste ce qui l'a déclenchée, pour l'immeuble en cause.
const DETAIL = (a: Alerte): [string, string] | null => a.type === 'perception' ? ['Voir les loyers en retard', '/finances/paiements']
  : a.type === 'depense' ? (a.sorte === 'travaux' ? ['Voir les bons de travail', '/maintenance/bons'] : a.sorte === 'debours' ? ['Voir les débours', '/finances/debours'] : ['Voir les factures fournisseurs', '/finances/factures-fournisseurs?statut=toutes'])
  : null;
const REVENU: Record<string, string> = { stationnement: 'Stationnement', buanderie: 'Buanderie', autre: 'Autre revenu' };
const moisNom = (iso: string, court = false, locale = 'fr-CA') => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, court ? { month: 'short' } : { month: 'long', year: 'numeric' });
const decaler = (iso: string, n: number) => { const d = new Date(`${iso.slice(0, 7)}-15T12:00:00`); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };

/* Flux de trésorerie des 6 derniers mois : revenus perçus et dépenses côte à côte (kit dataviz : barres groupées, légende, infobulle par mois, tableau). */
function Flux({ serie }: { serie: DonneesVue['serie'] }) {
  const { t, locale } = useT(), argent = (n: number) => argentBase(n, false, locale);
  return <BarChart labels={serie.map((s) => moisNom(s.mois, true, locale))} titles={serie.map((s) => moisNom(s.mois, false, locale))} height={220} format={argent}
    label={t('Revenus perçus et dépenses par mois : {liste}', { liste: serie.map((s) => t('{mois} {revenus} de revenus, {depenses} de dépenses', { mois: moisNom(s.mois, true, locale), revenus: argent(s.revenus), depenses: argent(s.depenses) })).join('; ') })}
    series={[{ id: 'rev', name: t('Revenus perçus'), values: serie.map((s) => s.revenus), slot: 0 }, { id: 'dep', name: t('Dépenses'), values: serie.map((s) => s.depenses), slot: 1 }]} tableColumn={t('Mois')} />;
}

export function Vue({ donnees: D, erreurLecture }: { donnees: DonneesVue | null; erreurLecture: string | null }) {
  const router = useRouter(), { t, locale } = useT(), argent = (n: number | string | null | undefined, cents = false) => argentBase(n, cents, locale), moisN = (iso: string, court = false) => moisNom(iso, court, locale);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [saisie, setSaisie] = useState<null | { immeuble: string; type: string; montant: string; le: string; note: string }>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const T = D.total, m = D.mois.slice(0, 7), percu = T.paye + T.autres, pct = T.attendu ? Math.round((100 * T.paye) / T.attendu) : 0;
  async function rpc(p: object, msg: string, nom = 'lanceur_autre_revenu') {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return; } setOk(msg); setSaisie(null); router.refresh();
  }
  const voir = (client: string, immeuble?: string, vers?: string) => { choisirPortee(client, immeuble); if (vers) router.push(vers); else router.refresh(); };
  const ouvertes = D.alertes.filter((a) => !a.vue), vues = D.alertes.filter((a) => a.vue), nbImm = new Set(ouvertes.map((a) => a.immeuble_id)).size;
  const marquer = (a: Alerte, rouvrir = false) => rpc({ immeuble: a.immeuble_id, type: a.type, cle: a.cle, mois: D!.mois, rouvrir }, rouvrir ? t('Alerte rouverte.') : t('Alerte marquée comme vue.'), 'lanceur_alerte_vue');
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="a-faire-actions" style={{ gap: 12, alignItems: 'center' }}>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} onClick={() => router.push(`/finances/vue?mois=${decaler(m, -1)}`)} aria-label={t('Mois précédent')}>←</button>
        <strong style={{ minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>{moisN(D.mois)}</strong>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 14px' }} disabled={D.courant} onClick={() => router.push(`/finances/vue?mois=${decaler(m, 1)}`)} aria-label={t('Mois suivant')}>→</button>
        <span className="gris texte-13">{T.immeubles > 1 ? t('{n} immeubles', { n: T.immeubles }) : t('{n} immeuble', { n: T.immeubles })} · {T.occupes > 1 ? t('{n} logements occupés sur {total}', { n: T.occupes, total: T.logements }) : t('{n} logement occupé sur {total}', { n: T.occupes, total: T.logements })}</span>
        {D.peut_ecrire && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 16px', marginLeft: 'auto' }} onClick={() => setSaisie({ immeuble: D.immeubles.length === 1 ? D.immeubles[0].id : '', type: 'stationnement', montant: '', le: '', note: '' })}>
          <Icone nom="plus" taille={18} couleur="#0C2147" />{t('Inscrire un revenu')}</button>}
      </div>

      <div className="kpis">
        <div className="kpi"><span>{t('Revenus perçus')}</span><b>{argent(percu)}</b><span>{t('{paye} de loyers ({pct} % des {attendu} attendus)', { paye: argent(T.paye), pct, attendu: argent(T.attendu) })}{T.autres ? ` · ${t('{montant} d’autres revenus', { montant: argent(T.autres) })}` : ''}</span></div>
        <div className="kpi"><span>{t('Dépenses')}</span><b>{argent(T.depenses)}</b><span>{t('Travaux terminés, débours et factures approuvées')}</span></div>
        <div className="kpi"><span>{t('Net du mois')}</span><b style={T.net < 0 ? { color: '#B3261E' } : undefined}>{argent(T.net)}</b><span>{t('Revenus perçus moins dépenses')}</span></div>
        <div className="kpi"><span>{t('Alertes à regarder')}</span><b>{ouvertes.length}</b><span>{ouvertes.length ? (nbImm > 1 ? t('{n} immeubles', { n: nbImm }) : t('{n} immeuble', { n: nbImm })) : t('Rien à regarder')}{vues.length ? ` · ${vues.length > 1 ? t('{n} déjà vues', { n: vues.length }) : t('{n} déjà vue', { n: vues.length })}` : ''}</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }} className="vue-fin-haut">
        <section className="carte-l18" aria-label={t('Alertes')}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Alertes')}</h2>
            <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('Flux de trésorerie négatif · loyers perçus sous {pct} % après le {jour} du mois · dépense d’au moins {facteur} fois la médiane de l’immeuble ({min} et plus)', { pct: D.seuils.perception_min_pct, jour: D.seuils.perception_jour, facteur: D.seuils.depense_facteur, min: argent(D.seuils.depense_min) })}</p></div></header>
          {ouvertes.length ? <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{ouvertes.slice(0, 12).map((a, k) => { const d = DETAIL(a); return <li key={a.immeuble_id + a.type + k} style={{ padding: '12px 0', borderTop: k ? '1px solid #E6EBF2' : 0, display: 'grid', gap: 4 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span className="puce todo">{t(TYPE[a.type])}</span>
                <button className="lien" onClick={() => voir(a.client_id, a.immeuble_id)} title={t('N’afficher que cet immeuble')}><strong>{a.immeuble}</strong></button><span className="gris texte-13">{a.client}</span></span>
              <span className="texte-13">{motifs(a.texte, t, locale)}</span>
              <span className="texte-13" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {d && <button className="lien" onClick={() => voir(a.client_id, a.immeuble_id, d[1])}>{t(d[0])}</button>}
                {D.peut_ecrire && <button className="lien" disabled={envoi} onClick={() => marquer(a)}>{t('Marquer comme vue')}</button>}</span></li>; })}</ul>
            : <p className="gris texte-13" style={{ margin: 0 }}>{vues.length ? t('Toutes les alertes de {mois} ont été vues.', { mois: moisN(D.mois) }) : t('Aucune alerte pour {mois}.', { mois: moisN(D.mois) })}</p>}
          {ouvertes.length > 12 && <p className="gris texte-13" style={{ margin: '8px 0 0' }}>{t('Les 12 plus importantes sur {n} : choisissez un client pour voir les siennes.', { n: ouvertes.length })}</p>}
          {vues.length > 0 && <details style={{ marginTop: 12, borderTop: '1px solid #E6EBF2', paddingTop: 12 }}><summary className="texte-13" style={{ cursor: 'pointer' }}>{t('Déjà vues ({n})', { n: vues.length })}</summary>
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>{vues.map((a, k) => <li key={a.immeuble_id + a.type + k} className="texte-13" style={{ padding: '8px 0', display: 'grid', gap: 2 }}>
              <span><span className="puce neutral">{t(TYPE[a.type])}</span> <strong>{a.immeuble}</strong> <span className="gris">{a.client}</span></span><span className="gris">{a.texte}</span>
              <span className="gris">{a.vue!.par ? t('Vue par {nom} le {date}', { nom: a.vue!.par, date: new Date(a.vue!.le).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) }) : t('Vue le {date}', { date: new Date(a.vue!.le).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) })}
                {D.peut_ecrire && <> · <button className="lien" disabled={envoi} onClick={() => marquer(a, true)}>{t('Rouvrir')}</button></>}</span></li>)}</ul></details>}
        </section>
        <section className="carte-l18" aria-label={t('Flux de trésorerie')}>
          <h2 className="titre-carte" style={{ margin: 0 }}>{t('Flux de trésorerie')}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{t('6 derniers mois')}</p>
          <Flux serie={D.serie} />
        </section>
      </div>

      <section className="carte-l18" aria-label={t('Par client et par immeuble')}>
        <h2 className="titre-carte" style={{ margin: '0 0 12px' }}>{t('Par client et par immeuble')}</h2>
        <table className="tableau entetes-souples"><colgroup><col style={{ width: '24%' }} /><col style={{ width: '8%' }} /><col /><col /><col /><col /><col style={{ width: '7%' }} /><col /><col /><col style={{ width: '7%' }} /></colgroup>
          <thead><tr><th>{t('Immeuble')}</th><th className="droite">{t('Occupation')}</th><th className="droite">{t('Attendus')}</th><th className="droite">{t('Perçus')}</th><th className="droite">{t('Stationnement')}</th>
          <th className="droite">{t('Buanderie')}</th><th className="droite">{t('Autres')}</th><th className="droite">{t('Dépenses')}</th><th className="droite">{t('Net')}</th><th>{t('Alertes')}</th></tr></thead>
          <tbody>{D.clients.map((c) => <Fragment key={c.id}>
            <tr style={{ background: '#F4F7FB' }}><td colSpan={2}><button className="lien" onClick={() => voir(c.id)} title={t('N’afficher que ce client')}><strong>{c.nom}</strong></button> <span className="gris texte-13">{c.immeubles.length > 1 ? t('{n} immeubles', { n: c.immeubles.length }) : t('{n} immeuble', { n: c.immeubles.length })}</span></td>
              <td className="droite fort">{argent(c.attendu)}</td><td className="droite fort">{argent(c.paye)}</td><td colSpan={2} /><td className="droite fort">{c.autres ? argent(c.autres) : '—'}</td>
              <td className="droite fort">{argent(c.depenses)}</td><td className="droite fort" style={c.net < 0 ? { color: '#B3261E' } : undefined}>{argent(c.net)}</td><td>{c.alertes ? <span className="puce todo">{c.alertes}</span> : null}</td></tr>
            {c.immeubles.map((i) => <tr key={i.id}><td style={{ paddingLeft: 28 }}>{i.adresse}</td><td className="droite">{i.occupes} / {i.logements}</td>
              <td className="droite">{argent(i.attendu)}</td><td className="droite">{argent(i.paye)}</td><td className="droite">{i.stationnement ? argent(i.stationnement) : '—'}</td><td className="droite">{i.buanderie ? argent(i.buanderie) : '—'}</td>
              <td className="droite">{i.autre ? argent(i.autre) : '—'}</td><td className="droite">{i.depenses ? argent(i.depenses) : '—'}</td><td className="droite fort" style={i.net < 0 ? { color: '#B3261E' } : undefined}>{argent(i.net)}</td>
              <td>{i.alertes ? <span className="puce todo">{i.alertes}</span> : null}</td></tr>)}
          </Fragment>)}
          {!D.clients.length && <tr><td colSpan={10} className="gris">{t('Aucun immeuble pour ce choix.')}</td></tr>}</tbody></table>
      </section>

      {D.autres_revenus.length > 0 && <section className="carte-l18" aria-label={t('Autres revenus du mois')}>
        <h2 className="titre-carte" style={{ margin: '0 0 12px' }}>{t('Stationnement, buanderie et autres revenus du mois')}</h2>
        <table className="tableau"><thead><tr><th>{t('Date')}</th><th>{t('Immeuble')}</th><th>{t('Type')}</th><th>{t('Note')}</th><th className="droite">{t('Montant')}</th><th /></tr></thead>
          <tbody>{D.autres_revenus.map((a) => <tr key={a.id}><td>{a.le}</td><td>{a.immeuble}</td><td>{t(REVENU[a.type] ?? a.type)}</td><td className="gris">{a.note ?? '—'}</td><td className="droite fort">{argent(a.montant, true)}</td>
            <td className="droite">{D.peut_ecrire && <button className="lien" disabled={envoi} onClick={() => rpc({ supprimer: a.id }, t('Revenu retiré.'))}>{t('Retirer')}</button>}</td></tr>)}</tbody></table>
      </section>}

      {saisie && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSaisie(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rev-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); rpc({ immeuble: saisie.immeuble, type: saisie.type, montant: saisie.montant.replace(',', '.'), le: saisie.le, note: saisie.note }, t('Revenu inscrit.')); }}>
          <div className="fenetre-tete"><h2 id="rev-t">{t('Inscrire un revenu')}</h2><button type="button" className="fermer" onClick={() => setSaisie(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-aide">{t('Un revenu qui n’est pas un loyer : stationnement, buanderie ou autre. Il s’ajoute aux revenus de l’immeuble et paraît dans la finance du propriétaire.')}</p>
          <label className="fenetre-lib" htmlFor="rev-i">{t('Immeuble')}</label>
          <select id="rev-i" className="e70-raison" required value={saisie.immeuble} onChange={(e) => setSaisie({ ...saisie, immeuble: e.target.value })}><option value="">{t('Choisir…')}</option>{D.immeubles.map((i) => <option key={i.id} value={i.id}>{i.adresse}</option>)}</select>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="rev-t2">{t('Type')}</label>
            <select id="rev-t2" className="e70-raison" value={saisie.type} onChange={(e) => setSaisie({ ...saisie, type: e.target.value })}>{Object.entries(REVENU).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div>
            <div><label className="fenetre-lib" htmlFor="rev-m">{t('Montant ($)')}</label><input id="rev-m" className="e70-raison" inputMode="decimal" required value={saisie.montant} onChange={(e) => setSaisie({ ...saisie, montant: e.target.value })} placeholder={t('Ex. : 120,00')} /></div></div>
          <div className="po-deux"><div><label className="fenetre-lib" htmlFor="rev-d">{t('Date')}</label><input id="rev-d" type="date" className="e70-raison" value={saisie.le} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSaisie({ ...saisie, le: e.target.value })} /></div>
            <div><label className="fenetre-lib" htmlFor="rev-n">{t('Note')}</label><input id="rev-n" className="e70-raison" value={saisie.note} onChange={(e) => setSaisie({ ...saisie, note: e.target.value })} placeholder={t('Ex. : case 12, novembre')} /></div></div>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setSaisie(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={envoi || !saisie.immeuble || !saisie.montant}>{t('Inscrire')}</button></div>
        </form></div>}
    </>
  );
}
