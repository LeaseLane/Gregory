'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Relevés du mois : un relevé figé et une facture d'honoraires par propriétaire (PRO-05, PRO-06). Règle du 13 oct. : 6 % des loyers payés
   chez le propriétaire; travaux : rien jusqu'au seuil, au-delà le taux sur la facture complète avant taxes. Aucun « net », aucun versement. */
type Facture = { honoraires: number; coordination: number; sous_total: number; tps: number; tvq: number; total: number; numero?: string | null };
export type DonneesReleves = { mois: string; parametres: { gestion_pct: number; travaux_seuil: number; travaux_pct: number; valid_from: string } | null;
  releves: { proprietaire: string; owner_id: string; numero: string; facture: Facture; emis_le: string; courriel: string | null; facture_courriel: string | null }[];
  a_emettre: { proprietaire: string; owner_id: string; apercu: Facture }[] };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} $`;
const moisLib = (iso: string) => { const s = new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const decale = (iso: string, k: number) => { const d = new Date(`${iso.slice(0, 7)}-15T12:00:00`); d.setMonth(d.getMonth() + k); return d.toISOString().slice(0, 7); };
const ENVOI: Record<string, [string, string]> = { sent: ['Envoyé', 'final'], delivered: ['Remis', 'final'], queued: ['En file', 'neutral'], scheduled: ['Prévu', 'neutral'], failed: ['Échec', 'todo'] };

export function Releves({ donnees: D, maintenant, erreurLecture }: { donnees: DonneesReleves | null; maintenant: string; erreurLecture: string | null }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const total = D.releves.reduce((s, r) => s + (r.facture.total ?? 0), 0), courant = D.mois.slice(0, 7) >= maintenant.slice(0, 7);
  async function emettre() {
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_emettre_releves', { p_mois: D!.mois });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setOk(`${data} relevé${Number(data) > 1 ? 's' : ''} émis avec ${Number(data) > 1 ? 'leurs factures' : 'sa facture'}.`); router.refresh();
  }
  const puce = (s: string | null) => { const [l, t] = s ? ENVOI[s] ?? [s, 'neutral'] : ['Sans courriel', 'todo']; return <span className={`puce ${t}`}>{l}</span>; };

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="carte-l18 tete-action">
        <nav className="lo-cal-nav" aria-label="Mois"><Link className="haut-ibtn" href={`/finances/releves?m=${decale(D.mois, -1)}`} aria-label="Mois précédent"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link>
          <strong style={{ fontSize: 18, minWidth: 180, textAlign: 'center' }}>{moisLib(D.mois)}</strong>
          <Link className="haut-ibtn" href={`/finances/releves?m=${decale(D.mois, 1)}`} aria-label="Mois suivant"><Icone nom="chevron" taille={18} couleur="#0C2147" /></Link></nav>
        {D.parametres && <p className="gris texte-13" style={{ margin: 0 }}>Honoraires en vigueur depuis le {new Date(`${D.parametres.valid_from}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })} : {D.parametres.gestion_pct} % des loyers; travaux : rien jusqu’à {argent(D.parametres.travaux_seuil)}, au-delà {D.parametres.travaux_pct} % de la facture avant taxes.</p>}
      </div>
      <div className="po-kpis trois">
        <div className="carte-l18 kpi-po"><span>Relevés émis</span><b>{D.releves.length}</b><small>{D.a_emettre.length ? `${D.a_emettre.length} à émettre` : 'tous émis'}</small></div>
        <div className="carte-l18 kpi-po"><span>Factures d’honoraires (TTC)</span><b>{argent(total)}</b><small>le 5 du mois suivant</small></div>
        <div className="carte-l18 kpi-po"><span>Envoi automatique le 5</span><b style={{ fontSize: 20 }}>Non activé</b><small>Émission manuelle par la comptabilité</small></div>
      </div>
      {!!D.a_emettre.length && <section className="carte-l18" aria-label="À émettre">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>À émettre · aperçu</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Calculé maintenant; figé au moment de l’émission.</p></div>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || courant} title={courant ? 'Un mois se facture une fois terminé' : ''} onClick={emettre}><Icone nom="send" taille={16} couleur="#fff" />{envoi ? 'Émission…' : `Émettre ${D.a_emettre.length} relevé${D.a_emettre.length > 1 ? 's' : ''}`}</button></header>
        <table className="tableau"><thead><tr><th>Propriétaire</th><th className="droite">Gestion</th><th className="droite">Travaux</th><th className="droite">Taxes</th><th className="droite">Facture</th><th /></tr></thead>
          <tbody>{D.a_emettre.map((r) => <tr key={r.owner_id}><td className="fort">{r.proprietaire}</td><td className="droite">{argent(r.apercu.honoraires)}</td><td className="droite">{argent(r.apercu.coordination)}</td>
            <td className="droite">{argent(r.apercu.tps + r.apercu.tvq)}</td><td className="droite fort">{argent(r.apercu.total)}</td>
            <td className="droite"><Link className="lien" href={`/finances/releves/${r.owner_id}?m=${D.mois.slice(0, 7)}`}>Aperçu</Link></td></tr>)}</tbody></table>
      </section>}
      <section className="carte-l18" aria-label="Relevés émis"><h2 className="titre-carte">Relevés émis</h2>
        <table className="tableau"><thead><tr><th>Propriétaire</th><th>Relevé</th><th>Facture</th><th className="droite">Total TTC</th><th>Relevé (PRO-05)</th><th>Facture (PRO-06)</th><th /></tr></thead>
          <tbody>{D.releves.map((r) => <tr key={r.owner_id}><td className="fort">{r.proprietaire}</td><td>{r.numero}</td><td>{r.facture.numero ?? '—'}</td><td className="droite fort">{argent(r.facture.total)}</td>
            <td>{puce(r.courriel)}</td><td>{r.facture.numero ? puce(r.facture_courriel) : <span className="gris">Aucune facture</span>}</td>
            <td className="droite"><Link className="lien" href={`/finances/releves/${r.owner_id}?m=${D.mois.slice(0, 7)}`}>Ouvrir</Link></td></tr>)}
            {!D.releves.length && <tr><td colSpan={7} className="gris">Aucun relevé émis pour ce mois.</td></tr>}</tbody></table>
      </section>
    </>
  );
}
