'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useLocataire } from '@/composants/portail/CoquilleLocataire';
import { fenetreAvis } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';
import { argentL, jourCourt } from '@/lib/format';
import { dateLongueL, heureQcL } from './fmt';
import { type VueAccueil, ETAPES } from './AccueilCommun';
import { AccueilA } from './AccueilA';
import { AccueilB } from './AccueilB';
import { AccueilC } from './AccueilC';

/* Locataire · 01 Accueil : intervention à confirmer, prochain loyer, demande en cours, bail, gestionnaire,
   raccourcis, 4 indicateurs, loyer comparé au marché. « À confirmer » en puce marine (D3); vouvoiement; dates « 1er » (D13).
   Ce fichier calcule les valeurs (VueAccueil) et porte confirmer(); chaque option dessine la page (AccueilA / AccueilB / AccueilC).

   TEMPORAIRE (27 nov. 2026) : trois options à l'essai : A « Action d'abord », B « Loyer au centre », C « Colonne focalisée ».
   VARIANTE_ACCUEIL et le remplacement par localStorage['ll-accueil'] ('a' | 'b' | 'c', relu à l'événement « storage »)
   sont à retirer après le choix de Steven, avec les deux options non retenues et leur CSS (globals.css, « Accueil locataire : trois options »). */
export type VarianteAccueil = 'a' | 'b' | 'c';
export const VARIANTE_ACCUEIL: VarianteAccueil = 'a';
// Sélecteur d'essai retiré (Steven, 27 nov. 2026) : l'option affichée, A, est celle de tout le monde; l'ancien choix gardé dans localStorage n'est plus lu.
const lireVariante = (): VarianteAccueil => VARIANTE_ACCUEIL;

/* Position (0 à 100) de la fenêtre d'avis sur la durée du bail : sert à la chronologie de l'option A du bloc « Mon bail » (temporaire). */
const positionFenetre = (debut: string, fin: string | null, fen: [string, string]) => {
  if (!fin) return { pa: 0, pb: 0 };
  const d = new Date(debut).getTime(), f = new Date(fin).getTime(), pc = (iso: string) => Math.max(0, Math.min(100, (100 * (new Date(`${iso}T12:00:00`).getTime() - d)) / Math.max(1, f - d)));
  return { pa: pc(fen[0]), pb: pc(fen[1]) };
};

export type AccueilLoc = {
  logement: string | null; bail: { debut: string; fin: string | null; loyer: number; statut: string; fenetre: string | null } | null;
  prochain_loyer: { montant: number; echeance: string; en_retard: boolean; prelevement: boolean } | null;
  a_confirmer: { id: string; quand: string; qui: string | null; quoi: string; numero: string }[];
  demande: { id: string; titre: string; cree: string; etape: number } | null;
  parcours: { date: string; type: string; titre: string; sous: string; fait: boolean }[];
  gestionnaire: { nom: string; initiales: string; courriel: string } | null;
  indicateurs: { paye_annee: number; loyers_payes: number; prevu_annee: number; ponctualite: boolean[]; reponse_min: number | null; reglees_h: number | null };
  loyers: { debut: string; loyer: number }[]; marche: number | null;
};

export function Accueil({ prenom, maintenant, donnees, erreur }: { prenom: string; maintenant: string; donnees: AccueilLoc | null; erreur: string | null }) {
  const router = useRouter(), { pastilles } = useLocataire(), { t, locale } = useT();
  const argent = (n: number) => argentL(Math.round(n), locale), jour = (iso: string) => jourCourt(iso.slice(0, 10), locale), jourLong = (iso: string) => dateLongueL(iso.slice(0, 10), locale);
  const [envoi, setEnvoi] = useState(false), [toast, setToast] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null);
  const [variante, setVariante] = useState<VarianteAccueil>(VARIANTE_ACCUEIL);   // TEMPORAIRE (voir en-tête)
  useEffect(() => {
    setVariante(lireVariante());
    const surStockage = (e: StorageEvent) => { if (e.key === null || e.key === 'll-accueil') setVariante(lireVariante()); };
    window.addEventListener('storage', surStockage);
    return () => window.removeEventListener('storage', surStockage);
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  const auj = new Date(maintenant);   // une seule « maintenant », celle du serveur : aucun écart à l'hydratation
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert" style={{ margin: 24 }}>{erreur ?? t('Votre accueil n’a pas pu être lu.')}</div>;
  const D = donnees, I = D.indicateurs, c = D.a_confirmer[0], bail = D.bail, L = D.prochain_loyer, G = D.gestionnaire;
  const moisBail = bail?.fin ? Math.max(1, Math.round((new Date(bail.fin).getTime() - new Date(bail.debut).getTime()) / (30.44 * 864e5))) : null;
  const moisFaits = bail ? Math.max(0, Math.round((auj.getTime() - new Date(bail.debut).getTime()) / (30.44 * 864e5))) : 0;
  const restants = bail?.fin ? Math.max(0, Math.round((new Date(bail.fin).getTime() - auj.getTime()) / 864e5)) : null;
  const fen = fenetreAvis(bail?.fenetre);
  const tel = pastilles?.contact?.telephone ?? null;

  async function confirmer(choix: 'present' | 'acces') {
    if (!c) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_confirmer_intervention', { p: { id: c.id, choix } });
    setEnvoi(false); if (error) { setBandeau(error.message); return; }
    setToast(choix === 'present' ? t('C’est noté : vous serez présent.') : t('C’est noté : l’accès est autorisé en votre absence.')); router.refresh();
  }

  const jours = L ? Math.max(0, Math.round((new Date(`${L.echeance}T12:00:00`).getTime() - auj.getTime()) / 864e5)) : 0;
  const v: VueAccueil = {
    D, t, locale, argent, jour, jourLong, maintenant: auj.getTime(), envoi, confirmer,
    titre: t('Bonjour {prenom}', { prenom }),
    surtitre: auj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' }),
    sous: c ? t('Une seule chose demande votre attention cette semaine.') : t('Rien ne demande votre attention cette semaine.'),
    visite: c ? {
      quand: new Date(c.quand).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Toronto' }), heure: heureQcL(c.quand, locale),
      titre: t('{qui} passe {jour}', { qui: c.qui ?? t('Le fournisseur'), jour: new Date(c.quand).toLocaleDateString(locale, { weekday: 'long', timeZone: 'America/Toronto' }) }), detail: `${c.quoi} · ${c.numero}`,
    } : null,
    loyer: L ? {
      montant: argent(L.montant), retard: L.en_retard, prelevement: L.prelevement, etat: L.en_retard ? t('En retard') : t('À jour'),
      delai: L.en_retard ? t('dû depuis le {date}', { date: jour(L.echeance) }) : t('dans {n} jours', { n: jours }),
      detail: L.en_retard ? t('en retard · une entente reste possible') : t('le {date} · {mode}', { date: jour(L.echeance), mode: L.prelevement ? t('prélèvement automatique') : t('à payer (voir Paiements)') }),
    } : null,
    demande: D.demande ? { id: D.demande.id, titre: D.demande.titre, etape: D.demande.etape, etat: t(ETAPES[D.demande.etape]), cree: jour(D.demande.cree) } : null,
    bail: bail ? {
      actif: bail.statut === 'active' ? t('Actif') : t('Terminé'), pct: Math.min(100, (100 * moisFaits) / (moisBail ?? 12)), fin: bail.fin, debut: bail.debut,
      libelle: moisBail ? t('Mois {a} sur {b} · {n} jours restants', { a: Math.min(moisFaits + 1, moisBail), b: moisBail, n: restants }) : t('Bail sans date de fin'),
      finLongue: bail.fin ? jourLong(bail.fin) : null, debutLong: jourLong(bail.debut),
      renouvellement: fen ? t('Avis de renouvellement du {a} au {b}', { a: jour(fen[0]), b: jour(fen[1]) }) : null,
      // Pièces des vues temporaires du bloc « Mon bail » (AccueilCommun : VUE_BAIL) : mois, jours restants, fenêtre d'avis (dates courtes + position en % sur la durée du bail)
      mois: moisBail ? { a: Math.min(moisFaits + 1, moisBail), b: moisBail } : null, restants,
      fen: fen ? { a: jour(fen[0]), b: jour(fen[1]), ...positionFenetre(bail.debut, bail.fin, fen) } : null,
    } : null,
    gest: G ? {
      nom: G.nom, initiales: G.initiales, prenom: G.nom.split(' ')[0], courriel: G.courriel, tel,
      lienTel: tel ? `tel:+1${tel.replace(/,.*$/, '').replace(/\D/g, '').slice(-10)}` : null, resume: tel ?? G.courriel,
    } : null,
    stats: {
      annee: auj.getFullYear(), paye: argent(I.paye_annee), prevu: argent(I.prevu_annee), paye$: I.paye_annee, prevu$: Math.max(1, I.prevu_annee),
      payeSous: I.loyers_payes > 1 ? t('{n} loyers sur 12', { n: I.loyers_payes }) : t('{n} loyer sur 12', { n: I.loyers_payes }),
      ponct: I.ponctualite, ponctN: t('{n} sur {m}', { n: I.ponctualite.filter(Boolean).length, m: I.ponctualite.length || 12 }),
      reponse: I.reponse_min == null ? '—' : I.reponse_min < 120 ? t('{n} min', { n: I.reponse_min }) : t('{n} h', { n: Math.round(I.reponse_min / 60) }), reponseMin: I.reponse_min,
      reglees: I.reglees_h == null ? '—' : t('{n} h', { n: I.reglees_h }), regleesPct: I.reglees_h == null ? null : Math.min(100, (100 * I.reglees_h) / 48),
    },
  };

  return (
    <div className={`acc acc-${variante}`}>
      {variante === 'a' ? <AccueilA v={v} erreur={bandeau} /> : variante === 'b' ? <AccueilB v={v} erreur={bandeau} /> : <AccueilC v={v} erreur={bandeau} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </div>
  );
}
