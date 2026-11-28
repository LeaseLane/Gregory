'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { dateCourte, aujQc, argent as argentFmt } from '@/composants/portail/format';
import { useT } from '@/composants/Langue';
import { BarChart, CellStrip, ProgressBar, type StripCell } from '@/composants/dataviz';

/* Propriétaire · 01 Tableau de bord. Décisions du 13 oct. : les loyers sont payés directement au propriétaire (Lease Lane les suit),
   aucun « net » ni versement; la carte « Net versé » de la maquette devient « Honoraires du mois » (facturés le 5). */
type AFaire = { type: 'urgence' | 'depense' | 'cession'; id: string; titre: string; sous: string; montant?: number; etat?: string };
export type Accueil = { a_faire: AFaire[]; occupation: { total: number; occupes: number; vacants: number; arrieres: number };
  mois: { payes: number; prevus: number; arrieres: number; logements_arrieres: number; honoraires: number; taux: number };
  loyers: { mois: string; montant: number }[]; secteurs: { secteur: string; part: number }[];
  demandes: { id: string; numero: string; titre: string; logement: string; locataire: string; etat: string; recue: string; cout: number | null }[]; demandes_ouvertes: number; accords_attendus: number };

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const ETATS: Record<string, [string, string]> = { attente_vous: ['En attente de vous', 'action'], urgence: ['Urgence prise en charge', 'todo'], en_cours: ['En cours', 'neutral'], qualifiee: ['Qualifiée', ''] };

// lectureSeule : accès « comptable », qui ne peut pas approuver une dépense (refusé en base).
export function TableauDeBord({ prenom, portes, immeubles, donnees, erreur, lectureSeule = false }: { prenom: string; portes: number; immeubles: number; donnees: Accueil | null; erreur: string | null; lectureSeule?: boolean }) {
  const router = useRouter();
  const { t, locale } = useT();
  const en = locale.startsWith('en'), argent = (n: number) => argentFmt(Math.round(n), false, locale), k = (n: number) => en ? `$${Math.round(n / 1000)}k` : `${Math.round(n / 1000)} k$`, d = (iso: string) => dateCourte(iso, false, locale);
  const [periode, setPeriode] = useState<6 | 12>(6), [refus, setRefus] = useState<AFaire | null>(null), [motif, setMotif] = useState(''), [envoi, setEnvoi] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? t('Votre tableau de bord n’a pas pu être lu.')}</div>;
  const D = donnees, auj = aujQc(), serie = D.loyers.slice(-periode), max = Math.max(1, ...serie.map((s) => s.montant));
  const totalPaye = serie.reduce((a, s) => a + s.montant, 0), occ = D.occupation.total ? Math.round((100 * D.occupation.occupes) / D.occupation.total) : 0;
  // Éditorial (27 nov. 2026) : un logement = une case quand le parc tient sur une rangée lisible; au-delà, la jauge.
  const O = D.occupation, enRetard = Math.min(O.arrieres, O.occupes), pc = (n: number) => `${n}${en ? '%' : '\u00a0%'}`;
  const cases: StripCell[] = O.total > 0 && O.total <= 40 ? [
    ...Array.from({ length: O.occupes - enRetard }, (_, i): StripCell => ({ id: `o${i}`, label: t('Logement occupé'), state: 'accent' })),
    ...Array.from({ length: enRetard }, (_, i): StripCell => ({ id: `r${i}`, label: t('Logement en arriéré'), state: 'bad', detail: t('Relances en cours') })),
    ...Array.from({ length: Math.max(0, O.total - O.occupes) }, (_, i): StripCell => ({ id: `v${i}`, label: t('Logement vacant'), state: 'none' }))] : [];
  /* Un carré par logement occupé, pour la rangée des cartes du mois (vacants exclus : aucun loyer prévu). */
  const parLogement = cases.filter((c) => c.state !== 'none');
  const tauxPaye = D.mois.prevus ? Math.round((100 * D.mois.payes) / D.mois.prevus) : 0;
  const premier = D.secteurs.reduce((m, x, i) => (x.part > (D.secteurs[m]?.part ?? -1) ? i : m), 0);

  async function decider(x: AFaire, decision: 'approuve' | 'refuse') {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_decider_depense', { p: { id: x.id, decision, motif } });
    setEnvoi(false);
    if (error) { setBandeau(error.message); return; }
    setRefus(null); setMotif(''); setToast(decision === 'approuve' ? t('Dépense approuvée : l’équipe planifie les travaux.') : t('Dépense refusée : l’équipe vous propose une autre solution.')); router.refresh();
  }

  return (
    <>
      <h1 className="po-titre">{t('Bonjour, {prenom}', { prenom })}</h1>
      <p className="po-sous">{auj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())} · {portes > 1 ? t('{n} logements', { n: portes }) : t('{n} logement', { n: portes })} · {immeubles > 1 ? t('{n} immeubles', { n: immeubles }) : t('{n} immeuble', { n: immeubles })}</p>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}

      <div className="po-grille-haut">
        <section className="carte-l18 e2" aria-label={t('À faire maintenant')}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('À faire maintenant')}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('Le reste est pris en charge par l’équipe.')}</p></div>
            {D.a_faire.length > 0 && <span className="puce action">{D.a_faire.length > 1 ? t('{n} points', { n: D.a_faire.length }) : t('{n} point', { n: D.a_faire.length })}</span>}</header>
          <ul className="a-faire">{D.a_faire.map((x) => (
            <li key={x.type + x.id}>
              <span className={`a-faire-ic ${x.type === 'urgence' ? 'rouge' : ''}`}><Icone nom={x.type === 'urgence' ? 'alert' : x.type === 'depense' ? 'dollar' : 'users'} taille={20} couleur={x.type === 'urgence' ? '#9B2E28' : '#0C2147'} /></span>
              <div><p className={`surtitre ${x.type === 'urgence' ? 'rouge' : ''}`}>{x.type === 'urgence' ? t('Urgence en cours') : x.type === 'depense' ? t('Autorisation de dépense') : t('Cession à approuver')}</p>
                <strong>{x.titre}{x.montant ? ` · ${argent(x.montant)}` : ''}</strong><span className="gris">{x.sous}</span></div>
              {x.type === 'urgence' ? <span className="puce">{x.etat}</span> : x.type === 'depense' && !lectureSeule ? <div className="a-faire-actions">
                {/* Carrés verts et rouges avec icône (Steven, 27 nov. 2026); le libellé reste dans aria-label et l'infobulle. */}
                <button className="bouton-carre approuver" disabled={envoi} onClick={() => decider(x, 'approuve')} aria-label={t('Approuver la dépense')} title={t('Approuver la dépense')}><Icone nom="check" taille={20} couleur="#fff" trait={2.4} /></button>
                <button className="bouton-carre refuser" disabled={envoi} onClick={() => { setRefus(x); setMotif(''); }} aria-label={t('Refuser la dépense')} title={t('Refuser la dépense')}><Icone nom="close" taille={20} couleur="#fff" trait={2.4} /></button></div>
                /* Cession : pas d'écran dédié au portail; les cessions vivent dans Locataires (« Locataires et cessions », comme les avis). */
                : x.type === 'cession' ? <div className="a-faire-actions"><Link href="/proprietaire/locataires" className="bouton bouton-contour a-faire-examiner" aria-label={t('Examiner la cession de bail')}>{t('Examiner')}</Link></div> : null}
            </li>))}
            {!D.a_faire.length && <li className="vide"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t('Rien à faire pour vous : l’équipe s’occupe du reste.')}</li>}</ul>
        </section>
        <section className="carte-l18" aria-label={t('Occupation')}>
          <h2 className="titre-carte" style={{ margin: 0 }}>{t('Occupation')}</h2><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>{t('{n} logements', { n: D.occupation.total })} · {t('{n} immeubles', { n: immeubles })}</p>
          <p className="po-grand dv-chiffre">{pc(occ)}</p><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>{t('{n} logements occupés sur {total}', { n: O.occupes, total: O.total })}</p>
          {/* Un carré par logement, en grille presque carrée (3 × 3 pour 9) qui remplit la hauteur de la carte (Steven, 27 nov. 2026). */}
          {cases.length ? <div className="po-parc" style={{ '--cols': Math.ceil(Math.sqrt(cases.length)) } as React.CSSProperties}><CellStrip className="dv-parc" size={O.total > 24 ? 'sm' : 'md'} cells={cases} label={t('Logements : occupés, en arriéré et vacants')} /></div>
            : <ProgressBar size="md" value={occ} label={t('Occupation')} valueText={pc(occ)} />}
          <dl className="po-liste dv-liste">
            <div><dt><i className="dv-sw" data-s="accent" aria-hidden="true" />{t('Occupés')}</dt><dd>{O.occupes}</dd></div>
            <div><dt><i className="dv-sw" data-s="none" aria-hidden="true" />{t('Vacants')}</dt><dd>{O.vacants}</dd></div>
            <div><dt><i className="dv-sw" data-s="bad" aria-hidden="true" />{t('En arriéré')}<span>{t('Relances en cours')}</span></dt><dd>{O.arrieres}</dd></div>
          </dl>
        </section>
      </div>

      <div className="po-section"><div><h2>{auj.toLocaleDateString(locale, { month: 'long' }).replace(/^./, (c) => c.toUpperCase())} {auj.getFullYear()}</h2><p>{t('Vos chiffres du mois, mis à jour chaque jour')}</p></div></div>
      <div className="po-kpis dv-bande">
        <div className="carte-l18 kpi-po dv-bande-hero"><span>{t('Loyers payés chez vous')}<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(D.mois.payes)}</b>
          {/* Les 4 cartes du mois portent la même rangée de carrés (Steven, 27 nov. 2026) : un carré par logement occupé ou par demande; rouge si négatif, bleu sinon. */}
          {parLogement.length > 0 ? <CellStrip size="sm" decorative label={t('Loyers payés chez vous')} cells={parLogement.map((c) => ({ ...c, state: c.state === 'bad' ? 'bad' : 'accent' }))} />
            : D.mois.prevus > 0 && <ProgressBar size="sm" value={D.mois.payes} max={D.mois.prevus} label={t('Loyers payés chez vous')} valueText={pc(tauxPaye)} />}
          <small>{t('sur {montant} prévus', { montant: argent(D.mois.prevus) })}</small></div>
        <div className="carte-l18 kpi-po"><span><i className="dv-sw" data-s="bad" aria-hidden="true" />{t('Arriérés')}<Icone nom="alert" taille={18} couleur="#9B2E28" /></span><b className="dv-encre">{argent(D.mois.arrieres)}</b>
          {parLogement.length > 0 && <CellStrip size="sm" decorative label={t('Arriérés')} cells={parLogement.map((c) => ({ ...c, state: c.state === 'bad' ? 'bad' : 'muted' }))} />}
          <small>{D.mois.logements_arrieres > 1 ? t('{n} logements', { n: D.mois.logements_arrieres }) : t('{n} logement', { n: D.mois.logements_arrieres })} · {t('relances en cours')}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Honoraires du mois')}<Icone nom="card" taille={18} couleur="#58697F" /></span><b>{argent(D.mois.honoraires)}</b>
          {parLogement.length > 0 && <CellStrip size="sm" decorative label={t('Honoraires du mois')} cells={parLogement.map((c) => ({ ...c, state: c.state === 'bad' ? 'muted' : 'accent' }))} />}
          <small>{t('{taux} % des loyers payés · facturés le 5', { taux: String(D.mois.taux).replace('.', en ? '.' : ',') })}</small></div>
        <div className="carte-l18 kpi-po"><span>{t('Demandes ouvertes')}<Icone nom="wrench" taille={18} couleur="#58697F" /></span><b>{D.demandes_ouvertes}</b>
          {D.demandes_ouvertes > 0 && D.demandes_ouvertes <= 16 && <CellStrip size="sm" decorative label={t('Demandes ouvertes')} cells={Array.from({ length: D.demandes_ouvertes }, (_, i): StripCell => ({ id: String(i), label: '', state: i < D.accords_attendus ? 'accent' : 'muted' }))} />}
          <small>{D.accords_attendus > 1 ? t('{n} attendent votre accord', { n: D.accords_attendus }) : t('{n} attend votre accord', { n: D.accords_attendus })}</small></div>
      </div>

      <div className="po-grille-haut">
        <section className="carte-l18" aria-label={t('Loyers payés')}>
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Loyers payés chez vous')}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('En milliers de dollars · {n} derniers mois', { n: periode })}</p></div>
            <div className="bascule">{([6, 12] as const).map((n) => <button key={n} className={periode === n ? 'actif' : ''} onClick={() => setPeriode(n)}>{t('{n} mois', { n })}</button>)}</div></header>
          <div className="dv-cles"><p><b className="dv-chiffre">{k(totalPaye)}</b><span>{t('payés sur {n} mois', { n: serie.length })}</span></p><p><b>{k((totalPaye * D.mois.taux) / 100)}</b><span>{t('Honoraires')}</span></p></div>
          <BarChart height={208} labels={serie.map((s) => ((m: string) => (en ? new Date(2000, Number(m.slice(5)) - 1, 1).toLocaleDateString('en-CA', { month: 'short' }) : MOIS[Number(m.slice(5)) - 1]))(s.mois))} titles={serie.map((s) => new Date(`${s.mois.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' }))}
            series={[{ id: 'paye', name: t('Loyers payés chez vous'), values: serie.map((s) => s.montant) }]} emphasis={serie.length - 1} valueLabels="last" format={argent} tickFormat={(v) => k(v)} label={t('Loyers payés chez vous')} tableColumn={t('Mois')} />
        </section>
        <section className="carte-l18" aria-label={t('Par secteur')}>
          <h2 className="titre-carte" style={{ margin: 0 }}>{t('Par secteur')}</h2><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>{t('Part des loyers payés · 12 mois')}</p>
          {D.secteurs.length > 0 && <div className="dv-cles"><p><b className="dv-chiffre">{pc(D.secteurs[premier].part)}</b><span>{t('{secteur}, votre premier secteur', { secteur: D.secteurs[premier].secteur })}</span></p></div>}
          {D.secteurs.length ? <BarChart className="dv-secteurs" orientation="horizontal" rank emphasis={premier} label={t('Par secteur')} labels={D.secteurs.map((x) => x.secteur)} series={[{ id: 'part', name: t('Par secteur'), values: D.secteurs.map((x) => x.part) }]} valueText={D.secteurs.map((x) => `${x.part}${en ? '%' : ' %'}`)} format={(n) => `${n}${en ? '%' : ' %'}`} labelWidth={132} />
            : <p className="gris texte-13">{t('Aucun loyer payé depuis 12 mois.')}</p>}
        </section>
      </div>

      <section className="studio-liste po-demandes" aria-label={t('Demandes en cours')}>
        <header className="carte-tete"><h2>{t('Demandes en cours')}</h2><p>{D.demandes_ouvertes > 1 ? t('{n} dossiers ouverts', { n: D.demandes_ouvertes }) : t('{n} dossier ouvert', { n: D.demandes_ouvertes })}</p></header>
        <table className="tableau">
          <colgroup><col style={{ width: '38%' }} /><col style={{ width: '20%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
          <thead><tr><th>{t('Demande')}</th><th>{t('Locataire')}</th><th>{t('État')}</th><th>{t('Reçue')}</th><th className="droite">{t('Coût')}</th></tr></thead>
          <tbody>{D.demandes.map((x) => { const [lib, c] = ETATS[x.etat] ?? [x.etat, 'neutral']; return (
            <tr key={x.id}><td><span className="cellule-doc"><strong className="fort">{x.titre}</strong><span className="gris">{x.numero} · {x.logement}<span className="po-dem-loc"> · {x.locataire}</span></span></span></td>
              <td className="po-dem-col-loc">{x.locataire}</td><td className="po-dem-etat"><span className={`puce ${c}`}>{t(lib)}</span></td><td className="po-dem-recue">{d(x.recue)}</td><td className="droite fort po-dem-cout">{x.cout ? argent(x.cout) : '—'}</td></tr>); })}
            {!D.demandes.length && <tr><td colSpan={5} className="gris">{t('Aucune demande en cours.')}</td></tr>}</tbody>
        </table>
      </section>

      {refus && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRefus(null)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ref-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="ref-t">{t('Refuser la dépense de {montant}?', { montant: refus.montant ? argent(refus.montant) : '' })}</h2><button className="fermer" onClick={() => setRefus(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte">{refus.titre}. {t('Les travaux ne seront pas commandés; l’équipe vous proposera une autre solution selon votre motif.')}</p>
            <label className="fenetre-lib" htmlFor="ref-m">{t('Motif')}<span>{t('obligatoire')}</span></label>
            <textarea id="ref-m" className="e70-raison" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={t('Ex. : je préfère une autre soumission, je veux d’abord en parler avec vous…')} />
            <div className="fenetre-actions" style={{ marginTop: 24 }}><button className="bouton bouton-contour" onClick={() => setRefus(null)}>{t('Annuler')}</button>
              <button className="bouton bouton-principal" disabled={envoi || motif.trim().length < 5} onClick={() => decider(refus, 'refuse')}>{t('Refuser la dépense')}</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
