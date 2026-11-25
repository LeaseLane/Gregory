'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { initiales } from '@/lib/ventes';
import { FournisseurTiroir } from './FournisseurTiroir';
import { useT } from '@/composants/Langue';
import { dec, spec } from '../onglets';
import type { T } from '@/lib/i18n/langue';

/* e34 · Fournisseurs : délai de première réponse = barres classées (emphase sur le plus rapide). Assurance : rouge seulement si elle est échue ET que des travaux sont prévus;
   sinon gris ou bleu, toujours avec un libellé. Aucun bon n'est confirmé sans attestation valide. */
export type Fourn = { id: string; nom: string; contact: string; zones: string[] | null; specialites: (string | null)[]; note: number | null; reponse: number | null; assurance: string | null; etat_assurance: string;
  rbq: string | null; rbq_requise: boolean; actif: boolean; verification: string | null; travaux: number; prochain: string | null };
export type DonneesFournisseurs = { fournisseurs: Fourn[]; assurances: Fourn[]; peut_ecrire: boolean };
const d = (iso: string, locale: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
const h = (n: number, locale: string) => `${dec(n, locale)} h`;
export const etatAssurance = (f: Pick<Fourn, 'etat_assurance' | 'assurance' | 'prochain'>, t: T, locale: string) => ({
  valide: [<Icone key="i" nom="check" taille={16} couleur="#12694F" />, t('Valide'), ''], bientot: [<i key="i" className="anneau" />, t('Expire le {d}', { d: d(f.assurance!, locale) }), 'bleu'],
  echue: [<i key="i" className="point-etat" />, t('Échue le {d}', { d: d(f.assurance!, locale) }), ''], inconnue: [<i key="i" className="point-etat" />, t('À confirmer'), ''],
  risque: [<Icone key="i" nom="alert" taille={16} couleur="#9B2E28" />, t('Échue · travaux {j}', { j: f.prochain ? new Date(f.prochain).toLocaleDateString(locale, { weekday: 'short' }) : t('prévus') }), 'rouge-txt'] } as Record<string, [React.ReactNode, string, string]>)[f.etat_assurance] ?? [null, '—', ''];

export function Fournisseurs({ donnees: D, q: q0, erreurLecture }: { donnees: DonneesFournisseurs | null; q: string; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [q, setQ] = useState(q0), [tous, setTous] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  // Filtres de la liste (Grégory, 17 nov.) : vérification, spécialité, assurance; appliqués à l'écran, la recherche reste côté serveur.
  const [fv, setFv] = useState(''), [fs, setFs] = useState(''), [fa, setFa] = useState('');
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const specs = [...new Set(D.fournisseurs.flatMap((f) => f.specialites.filter(Boolean).map((x) => cap(x as string))))].sort((a, b) => a.localeCompare(b, locale));
  const F = D.fournisseurs.filter((f) => (!fv || (fv === 'verified' ? f.verification === 'verified' : fv === 'rejected' ? f.verification === 'rejected' : !['verified', 'rejected'].includes(f.verification ?? '')))
    && (!fs || f.specialites.some((x) => x && cap(x) === fs))
    && (!fa || (fa === 'valide' ? ['valide', 'bientot'].includes(f.etat_assurance) : fa === 'echue' ? ['echue', 'risque'].includes(f.etat_assurance) : f.etat_assurance === fa)));
  const filtre = !!(fv || fs || fa);
  const L = tous || filtre ? F : F.slice(0, 8), rep = D.fournisseurs.filter((f) => f.reponse != null && f.actif).sort((a, b) => a.reponse! - b.reponse!);
  const aDemander = D.assurances.filter((a) => a.etat_assurance !== 'echue' || a.prochain);
  async function demander() {
    const { data, error } = await supabaseNavigateur().rpc('lanceur_demander_attestations', { p: { ids: D!.assurances.map((a) => a.id) } });
    if (error) return setBandeau(error.message); setOk(Number(data) > 1 ? t('{n} tâches créées dans Tâches.', { n: data }) : t('{n} tâche créée dans Tâches.', { n: data }));
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18" aria-label={t('Fournisseurs')}>
          <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Fournisseurs')}</h2><p className="gris texte-13" style={{ margin: 0 }}>{filtre ? t('{a} sur {b}', { a: F.length, b: D.fournisseurs.length }) : D.fournisseurs.length} {t('fournisseurs · triés par travaux des 12 derniers mois')}</p></div>
            <form className="lo-recherche" style={{ maxWidth: 264 }} onSubmit={(e) => { e.preventDefault(); router.push(q ? `/maintenance/fournisseurs?q=${encodeURIComponent(q)}` : '/maintenance/fournisseurs'); }}>
              <Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Chercher un fournisseur')} aria-label={t('Chercher un fournisseur')} /></form>
            {D.peut_ecrire && <FournisseurTiroir compact />}</div>
          <div className="filtres-ligne" style={{ marginTop: 12 }}>
            <select className="e70-raison filtre" value={fv} onChange={(e) => setFv(e.target.value)} aria-label={t('Vérification')}><option value="">{t('Vérification : tous')}</option><option value="verified">{t('Vérifiés')}</option><option value="attente">{t('À vérifier')}</option><option value="rejected">{t('Refusés')}</option></select>
            <select className="e70-raison filtre" value={fs} onChange={(e) => setFs(e.target.value)} aria-label={t('Spécialité')}><option value="">{t('Spécialité : toutes')}</option>{specs.map((x) => <option key={x} value={x}>{t(x)}</option>)}</select>
            <select className="e70-raison filtre" value={fa} onChange={(e) => setFa(e.target.value)} aria-label={t('Assurance')}><option value="">{t('Assurance : toutes')}</option><option value="valide">{t('Valide')}</option><option value="inconnue">{t('À confirmer')}</option><option value="echue">{t('Échue')}</option></select>
            {filtre && <button className="lien" onClick={() => { setFv(''); setFs(''); setFa(''); }}>{t('Effacer les filtres')}</button>}
          </div>
          <table className="tableau tab-fixe tab-fournisseurs entetes-souples" style={{ marginTop: 16 }}><colgroup><col style={{ width: '26%' }} /><col style={{ width: '17%' }} /><col style={{ width: '7%' }} /><col style={{ width: '9%' }} /><col style={{ width: '19%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
            <thead><tr><th>{t('Fournisseur')}</th><th>{t('Spécialités')}</th><th>{locale.startsWith('en') ? 'Rating' : 'Note'}</th><th className="droite">{t('Réponse')}</th><th>{t('Assurance')}</th><th>RBQ</th><th className="droite">{t('Travaux')}</th></tr></thead>
            <tbody>{L.map((f) => { const [ic, lib, cl] = etatAssurance(f, t, locale), sp = (f.specialites.filter(Boolean) as string[]).map((x) => spec(t, x));
              return <tr key={f.id} className="ligne-lien" style={f.actif ? undefined : { opacity: 0.55 }} onClick={() => router.push(`/maintenance/fournisseurs/${f.id}`)}>
                <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(f.nom)}</span><span><Link className="fort" href={`/maintenance/fournisseurs/${f.id}`} onClick={(e) => e.stopPropagation()}>{f.nom}</Link>
                  <span className="sous gris">{f.actif ? (f.zones?.length ? f.zones.join(' et ') : '—') : t('Désactivé')}</span></span></span></td>
                <td><span className="puces">{sp[0] && <span className="puce neutral">{sp[0]}</span>}{sp.length > 1 && <span className="puce neutral">+{sp.length - 1}</span>}</span></td>
                <td>{f.note ? <span className="ligne-ic"><Icone nom="star" taille={14} couleur="#0C2147" />{dec(f.note, locale)}</span> : <span className="gris">—</span>}</td>
                <td className="droite">{f.reponse != null ? h(f.reponse, locale) : <span className="gris">—</span>}</td>
                <td><span className={`ligne-ic texte-13 ${cl}`}>{ic}{lib}</span></td><td className="texte-13">{f.rbq ?? <span className="gris">{f.rbq_requise ? t('Manquante') : t('Non requise')}</span>}</td>
                <td className="droite fort">{f.travaux}</td></tr>; })}
              {!F.length && <tr><td colSpan={7} className="gris">{filtre ? t('Aucun fournisseur pour ces filtres.') : t('Aucun fournisseur.')}</td></tr>}</tbody></table>
          {F.length > 8 && !tous && !filtre && <button className="lien" onClick={() => setTous(true)}>{t('Afficher les {n} autres fournisseurs', { n: F.length - 8 })}</button>}
        </section>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label={t('Assurances à renouveler')}><div className="tete-action"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Assurances à renouveler')}</h2><Link className="lien" href="/maintenance/fournisseurs/echeances">{t('Échéances')}</Link></div>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Aucun bon n’est confirmé sans attestation valide')}</p>
            <ul className="lo-docs">{aDemander.slice(0, 4).map((f) => <li key={f.id}><span className="a-faire-ic" style={f.etat_assurance === 'risque' ? { background: '#F8E4E2' } : undefined}><Icone nom={f.etat_assurance === 'risque' ? 'alert' : 'shield'} taille={18} couleur={f.etat_assurance === 'risque' ? '#9B2E28' : '#0C2147'} /></span>
              <div><Link className="fort" href={`/maintenance/fournisseurs/${f.id}`}>{f.nom}</Link><span className={`texte-13 ${f.etat_assurance === 'risque' ? 'rouge-txt' : 'gris'}`}>
                {f.assurance ? (f.etat_assurance === 'bientot' ? t('Expire le {d}', { d: d(f.assurance, locale) }) : t('Échue le {d}', { d: d(f.assurance, locale) })) : t('Attestation à recevoir')} · {f.prochain ? t('travaux le {j}', { j: new Date(f.prochain).toLocaleDateString(locale, { weekday: 'long' }) }) : t('aucun travail prévu')}</span></div></li>)}
              {!aDemander.length && <li className="gris texte-13">{t('Toutes les assurances sont valides.')}</li>}</ul>
            {D.peut_ecrire && !!D.assurances.length && <button className="bouton bouton-principal" onClick={demander}><Icone nom="send" taille={16} couleur="#fff" />{D.assurances.length > 1 ? t('Demander les {n} attestations', { n: D.assurances.length }) : t('Demander les {n} attestation', { n: D.assurances.length })}</button>}</section>
          <section className="carte-l18" aria-label={t('Délai de première réponse')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{rep[0] ? t('{n} répond en {h}', { n: rep[0].nom.split(' ').slice(-1)[0], h: h(rep[0].reponse!, locale) }) : t('Délai de première réponse')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Délai médian de première réponse · 90 jours')}</p>
            {rep.length ? <BarresClassees lignes={rep.slice(0, 8).map((f) => ({ libelle: f.nom, valeur: f.reponse!, texte: h(f.reponse!, locale) }))} /> : <p className="gris texte-13">{t('Aucune offre envoyée depuis 90 jours.')}</p>}</section>
        </div>
      </div>
    </>
  );
}
