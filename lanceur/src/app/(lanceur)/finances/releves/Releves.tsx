'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { argent as argentL } from '../onglets';

/* Relevés du mois : un relevé figé et une facture d'honoraires par propriétaire (PRO-05, PRO-06). Règle du 13 oct. : 6 % des loyers payés
   chez le propriétaire; travaux : rien jusqu'au seuil, au-delà le taux sur la facture complète avant taxes. Aucun « net », aucun versement. */
type Facture = { honoraires: number; coordination: number; sous_total: number; tps: number; tvq: number; total: number; numero?: string | null };
export type DonneesReleves = { mois: string; parametres: { gestion_pct: number; travaux_seuil: number; travaux_pct: number; valid_from: string } | null;
  releves: { proprietaire: string; owner_id: string; numero: string; facture: Facture; emis_le: string; courriel: string | null; facture_courriel: string | null }[];
  a_emettre: { proprietaire: string; owner_id: string; apercu: Facture }[] };
const moisLib = (iso: string, locale: string) => { const s = new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const decale = (iso: string, k: number) => { const d = new Date(`${iso.slice(0, 7)}-15T12:00:00`); d.setMonth(d.getMonth() + k); return d.toISOString().slice(0, 7); };
const ENVOI: Record<string, [string, string]> = { sent: ['Envoyé', 'final'], delivered: ['Remis', 'final'], queued: ['En file', 'neutral'], scheduled: ['Prévu', 'neutral'], failed: ['Échec', 'todo'] };

export function Releves({ donnees: D, maintenant, erreurLecture }: { donnees: DonneesReleves | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number) => argentL(n, true, locale);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const total = D.releves.reduce((s, r) => s + (r.facture.total ?? 0), 0), courant = D.mois.slice(0, 7) >= maintenant.slice(0, 7);
  async function emettre() {
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_emettre_releves', { p_mois: D!.mois });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOk(Number(data) > 1 ? t('{n} relevés émis avec leurs factures.', { n: String(data) }) : t('{n} relevé émis avec sa facture.', { n: String(data) })); router.refresh();
  }
  const puce = (s: string | null) => { const [l, tp] = s ? ENVOI[s] ?? [s, 'neutral'] : ['Sans courriel', 'todo']; return <span className={`puce ${tp}`}>{t(l)}</span>; };

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="carte-l18 tete-action">
        <nav className="lo-cal-nav" aria-label={t('Mois')}><Link className="haut-ibtn" href={`/finances/releves?m=${decale(D.mois, -1)}`} aria-label={t('Mois précédent')}><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link>
          <strong style={{ fontSize: 18, minWidth: 180, textAlign: 'center' }}>{moisLib(D.mois, locale)}</strong>
          <Link className="haut-ibtn" href={`/finances/releves?m=${decale(D.mois, 1)}`} aria-label={t('Mois suivant')}><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link></nav>
        {D.parametres && <p className="gris texte-13" style={{ margin: 0 }}>{t('Honoraires en vigueur depuis le {date} : {gestion} % des loyers; travaux : rien jusqu’à {seuil}, au-delà {travaux} % de la facture avant taxes.', { date: new Date(`${D.parametres.valid_from}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }), gestion: D.parametres.gestion_pct, seuil: argent(D.parametres.travaux_seuil), travaux: D.parametres.travaux_pct })}</p>}
      </div>
      <div className="po-kpis trois">
        <div className="carte-l18 kpi-po"><span>{t('Relevés émis')}</span><b>{D.releves.length}</b><small>{D.a_emettre.length ? t('{n} à émettre', { n: D.a_emettre.length }) : t('tous émis')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Factures d’honoraires (TTC)')}</span><b>{argent(total)}</b><small>{t('le 5 du mois suivant')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Envoi automatique le 5')}</span><b style={{ fontSize: 20 }}>{t('Non activé')}</b><small>{t('Émission manuelle par la comptabilité')}</small></div>
      </div>
      {!!D.a_emettre.length && <section className="carte-l18" aria-label={t('À émettre')}>
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('À émettre · aperçu')}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('Calculé maintenant; figé au moment de l’émission.')}</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || courant} title={courant ? t('Un mois se facture une fois terminé') : ''} onClick={emettre}><Icone nom="send" taille={16} couleur="#fff" />{envoi ? t('Émission…') : D.a_emettre.length > 1 ? t('Émettre {n} relevés', { n: D.a_emettre.length }) : t('Émettre {n} relevé', { n: D.a_emettre.length })}</button></header>
        <table className="tableau"><thead><tr><th>{t('Propriétaire')}</th><th className="droite">{t('Gestion')}</th><th className="droite">{t('Travaux')}</th><th className="droite">{t('Taxes')}</th><th className="droite">{t('Facture')}</th><th /></tr></thead>
          <tbody>{D.a_emettre.map((r) => <tr key={r.owner_id}><td className="fort">{r.proprietaire}</td><td className="droite">{argent(r.apercu.honoraires)}</td><td className="droite">{argent(r.apercu.coordination)}</td>
            <td className="droite">{argent(r.apercu.tps + r.apercu.tvq)}</td><td className="droite fort">{argent(r.apercu.total)}</td>
            <td className="droite"><Link className="lien" href={`/finances/releves/${r.owner_id}?m=${D.mois.slice(0, 7)}`}>{t('Aperçu')}</Link></td></tr>)}</tbody></table>
      </section>}
      <section className="carte-l18" aria-label={t('Relevés émis')}><h2 className="titre-carte">{t('Relevés émis')}</h2>
        <table className="tableau"><thead><tr><th>{t('Propriétaire')}</th><th>{t('Relevé')}</th><th>{t('Facture')}</th><th className="droite">{t('Total TTC')}</th><th>{t('Relevé (PRO-05)')}</th><th>{t('Facture (PRO-06)')}</th><th /></tr></thead>
          <tbody>{D.releves.map((r) => <tr key={r.owner_id}><td className="fort">{r.proprietaire}</td><td>{r.numero}</td><td>{r.facture.numero ?? '—'}</td><td className="droite fort">{argent(r.facture.total)}</td>
            <td>{puce(r.courriel)}</td><td>{r.facture.numero ? puce(r.facture_courriel) : <span className="gris">{t('Aucune facture')}</span>}</td>
            <td className="droite"><Link className="lien" href={`/finances/releves/${r.owner_id}?m=${D.mois.slice(0, 7)}`}>{t('Ouvrir')}</Link></td></tr>)}
            {!D.releves.length && <tr><td colSpan={7} className="gris">{t('Aucun relevé émis pour ce mois.')}</td></tr>}</tbody></table>
      </section>
    </>
  );
}
