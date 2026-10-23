'use client';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { ETAPES_PROJET, jourMois, dollars } from '../../onglets';

type Soum = { id: string; worker_id: string; fournisseur: string; statut: 'attendue' | 'recue' | 'choisie' | 'refusee'; demandee_le: string; relance_le: string | null; montant: number | null;
  montant_note: string | null; couverture: Record<string, boolean>; estimation_manquants: number | null; garantie: string | null; debut: string | null; recue_le: string | null };
export type DonneesProjet = { id: string; numero: string; titre: string; adresse: string | null; proprietaire: string | null; budget_min: number | null; budget_max: number | null; etape: string;
  cadrage_debut: string; cadrage_fin: string | null; approuve_le: string | null; approuve_par: string | null; approuve_via: string | null; soumissions_voulues: number; soumissions_limite: string | null;
  travaux_debut: string | null; fin_prevue: string | null; termine_le: string | null; besoin: string | null; rapport_libelle: string | null; exigences: string[];
  elements: { code: string; libelle: string }[]; inclus: string | null; exclus: string | null; exclus_note: string | null; reporte: string | null; reporte_revision: string | null;
  arbitrages: { titre: string; avec: string | null; le: string | null; raison: string | null }[]; soumissions: Soum[]; fournisseurs: { id: string; nom: string; specialite: string | null }[]; peut_ecrire: boolean };

const ecrit = (n: number) => ['', '1re', '2e', '3e', '4e', '5e', '6e'][n] ?? `${n}e`;
const auj = () => new Date().toISOString().slice(0, 10);

export function Projet({ d: D }: { d: DonneesProjet }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null), [note, setNote] = useState<string | null>(null);
  const [choix, setChoix] = useState(false), [saisie, setSaisie] = useState<string | null>(null), [inv, setInv] = useState(D.fournisseurs[0]?.id ?? '');
  const [f, setF] = useState<{ montant: string; montant_note: string; manque: string; garantie: string; debut: string; couverture: Record<string, boolean> }>({ montant: '', montant_note: '', manque: '', garantie: '', debut: '', couverture: {} });
  async function agir(p: Record<string, unknown>, apres?: string) {
    setEnvoi(true); setErreur(null); setNote(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_projet_action', { p });
    setEnvoi(false); if (error) return setErreur(error.message);
    if (apres) setNote(apres); setChoix(false); setSaisie(null); router.refresh();
  }
  const iEtape = ETAPES_PROJET.findIndex(([k]) => k === D.etape), ferme = D.etape === 'annule';
  const dates: Record<string, string> = { cadrage: D.cadrage_fin ? `${jourMois(D.cadrage_debut).replace(/ \S+$/, '')} au ${jourMois(D.cadrage_fin)}` : `depuis le ${jourMois(D.cadrage_debut)}`,
    approbation: D.approuve_le ? jourMois(D.approuve_le) : 'à venir', soumissions: `${D.soumissions.filter((s) => s.statut !== 'attendue').length} sur ${D.soumissions_voulues}${D.soumissions_limite ? ` · ${jourMois(D.soumissions_limite)}` : ''}`,
    travaux: D.travaux_debut ? `dès le ${jourMois(D.travaux_debut)}` : 'à planifier', termine: D.termine_le ? jourMois(D.termine_le) : D.fin_prevue ? `avant le ${jourMois(D.fin_prevue)}` : '' };
  const S = D.soumissions.filter((s) => s.statut !== 'refusee'), recues = S.filter((s) => s.statut !== 'attendue');
  const egal = (s: Soum) => (s.montant === null ? null : Number(s.montant) + Number(s.estimation_manquants ?? 0));
  const prix = recues.map((s) => Number(s.montant)), egaux = recues.map((s) => egal(s) as number), meilleur = recues.length ? recues[egaux.indexOf(Math.min(...egaux))].id : null;
  const echelle = Math.max(Number(D.budget_max ?? 0), ...egaux, 1);
  const peutChoisir = recues.length >= D.soumissions_voulues || (!!D.soumissions_limite && auj() > D.soumissions_limite);
  const complete = (s: Soum) => D.elements.every((e) => s.couverture[e.code]);
  const E = D.elements, lignes = E.length + 3, colonnes = Math.max(S.length, 1);
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {note && <div className="bandeau info" role="status">{note}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 projet-tete" aria-label="Projet">
            <div><p className="surtitre" style={{ margin: 0 }}>Projet {D.numero}</p><h2 className="projet-titre">{D.titre}</h2>
              <p className="gris texte-14" style={{ margin: '4px 0 0' }}>{[D.adresse?.replace(/, Québec$/, ''), D.proprietaire].filter(Boolean).join(' · ')}</p>
              <p className="texte-14" style={{ margin: '4px 0 0' }}><span className="gris">Budget</span> <b className="fort">{D.budget_min && D.budget_max ? `${dollars(D.budget_min).replace(' $', '')} à ${dollars(D.budget_max)}` : dollars(D.budget_max ?? D.budget_min)}</b></p></div>
            <ol className="stepper stepper-projet">{ETAPES_PROJET.map(([k, l], i) => <li key={k} className={(i < iEtape || D.etape === 'termine' ? 'fait ' : '') + (i === iEtape && D.etape !== 'termine' ? 'actuel' : '')}>
              <button disabled><i>{i < iEtape || D.etape === 'termine' ? <Icone nom="check" taille={14} couleur="#fff" trait={2.6} /> : <small>{i + 1}</small>}</i><strong>{l}</strong><span>{dates[k]}</span></button></li>)}</ol>
          </section>
          {D.peut_ecrire && !ferme && (D.etape === 'cadrage' || D.etape === 'approbation' || D.etape === 'travaux') && <div className="ligne-ic" style={{ gap: 12 }}>
            {D.etape !== 'travaux' ? <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir({ action: 'approuver', id: D.id }, 'Approbation du propriétaire notée; les soumissions peuvent être demandées.')}>Noter l’approbation du propriétaire</button>
              : <button className="bouton bouton-contour" disabled={envoi} onClick={() => agir({ action: 'etape', id: D.id, etape: 'termine' })}>Marquer les travaux terminés</button>}</div>}
          <section className="carte-l18" aria-label="Soumissions comparées">
            <div className="ligne-entre" style={{ alignItems: 'flex-start' }}><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Soumissions comparées sur la même portée</h2>
                <p className="gris texte-13" style={{ margin: 0 }}>{D.approuve_le ? `Portée approuvée le ${jourMois(D.approuve_le)}` : 'Portée pas encore approuvée'} · {recues.length} soumission{recues.length > 1 ? 's' : ''} reçue{recues.length > 1 ? 's' : ''} sur {D.soumissions_voulues}</p></div>
              {D.etape === 'soumissions' && <div style={{ textAlign: 'right' }}><button className="bouton bouton-principal" style={{ width: 240 }} disabled={!peutChoisir || !D.peut_ecrire || envoi} onClick={() => setChoix(!choix)}>
                  {!peutChoisir && <Icone nom="clock" taille={20} couleur="#3E4A59" />}Choisir une soumission</button>
                {!peutChoisir && <p className="gris texte-12" style={{ margin: '8px 0 0' }}>S’active à la {ecrit(D.soumissions_voulues)} soumission{D.soumissions_limite ? `, au plus tard le ${jourMois(D.soumissions_limite)}` : ''}</p>}</div>}
              {D.etape !== 'soumissions' && S.find((s) => s.statut === 'choisie') && <span className="puce final"><Icone nom="check" taille={12} couleur="#fff" trait={2.6} />{S.find((s) => s.statut === 'choisie')!.fournisseur} retenu</span>}</div>
            {choix && <div className="choix-soumission">{recues.map((s) => <button key={s.id} className="bouton bouton-contour" disabled={envoi} onClick={() => agir({ action: 'choisir', soumission_id: s.id }, `${s.fournisseur} retenu; le projet passe aux travaux.`)}>
              Retenir {s.fournisseur} · {dollars(egal(s))}{!complete(s) ? ' à portée égale' : ''}</button>)}</div>}
            {E.length ? <div className="comparaison-portee" style={{ gridTemplateColumns: `minmax(220px, 1.5fr) repeat(${colonnes}, minmax(0, 1fr))` }}>
              <div className="cp-tete" style={{ gridColumn: '1 / -1', gridRow: 1 }} aria-hidden="true" />
              <div className="cp-cel cp-h" style={{ gridRow: 1, gridColumn: 1 }}><p className="surtitre gris" style={{ margin: 0 }}>Portée approuvée</p><span className="gris texte-13">{E.length} élément{E.length > 1 ? 's' : ''} inclus</span></div>
              {S.map((s, j) => <div key={s.id} className="cp-cel cp-h" style={{ gridRow: 1, gridColumn: j + 2 }}><b className="fort">{s.fournisseur}</b>
                {s.statut === 'attendue' ? <span className="ligne-ic gris texte-13"><Icone nom="clock" taille={16} couleur="#58697F" />Attendue{D.soumissions_limite ? ` le ${jourMois(D.soumissions_limite)}` : ''}</span>
                  : complete(s) ? <span className="ligne-ic texte-13"><span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={3} /></span>Portée complète</span>
                  : <span className="puce" style={{ height: 24, alignSelf: 'start' }}>Portée incomplète</span>}</div>)}
              {!S.length && <div className="cp-cel cp-h gris texte-13" style={{ gridRow: 1, gridColumn: 2 }}>Aucune soumission demandée</div>}
              {[...E.map((e) => ({ k: e.code, l: e.libelle, s: null as string | null })), { k: '_prix', l: 'Prix déclaré', s: recues.length > 1 ? `écart : ${dollars(Math.max(...prix) - Math.min(...prix))}` : null },
                { k: '_egal', l: 'Prix à portée égale', s: recues.length > 1 ? `écart réel : ${dollars(Math.max(...egaux) - Math.min(...egaux))}` : null }, { k: '_garantie', l: 'Garantie · début des travaux', s: null }].map((r, ri) => <Fragment key={r.k}>
                <div className={'cp-cel cp-lib' + (r.k === '_egal' ? ' haut' : '')} style={{ gridRow: ri + 2, gridColumn: 1 }}><b className="fort">{r.l}</b>{r.s && <span className={'bloc texte-13' + (r.k === '_egal' ? ' fort' : ' gris')}>{r.s}</span>}</div>
                {S.map((s, j) => s.statut === 'attendue' ? null : <div key={s.id} className={'cp-cel' + (r.k === '_egal' ? ' haut' : '')} style={{ gridRow: ri + 2, gridColumn: j + 2 }}>
                  {r.k === '_prix' ? <span><b className="fort">{dollars(s.montant)}</b>{s.montant_note && <span className="gris texte-13"> {s.montant_note}</span>}</span>
                  : r.k === '_egal' ? <div><b className="fort texte-16">{dollars(egal(s))}</b>{s.estimation_manquants ? <span className="gris texte-12"> + {dollars(s.estimation_manquants)} estimés</span> : null}
                      <span className="piste-budget"><i className={s.id === meilleur ? 'accent' : ''} style={{ width: `${(100 * (egal(s) ?? 0)) / echelle}%` }} />{D.budget_max && <b style={{ left: `${(100 * Number(D.budget_max)) / echelle}%` }} />}</span>
                      {D.budget_max && <span className="gris texte-12 budget-lib">budget</span>}</div>
                  : r.k === '_garantie' ? (s.garantie ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={3} /></span>{s.garantie}{s.debut ? ` · ${jourMois(s.debut)}` : ''}</span> : <span className="gris">—</span>)
                  : s.couverture[r.k] ? <span className="ligne-ic"><span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={3} /></span>{/s$/.test(r.l.split(' ')[0]) ? 'Couverts' : 'Couverte'}</span>
                  : <span className="deux-lignes"><span className="ligne-ic"><span className="non-couvert"><Icone nom="close" taille={10} couleur="#fff" trait={2.6} /></span>{/s$/.test(r.l.split(' ')[0]) ? 'Non couverts' : 'Non couverte'}</span>
                      {D.peut_ecrire && <button className="lien" style={{ paddingLeft: 24 }} disabled={envoi} onClick={() => agir({ action: 'demander_prix', soumission_id: s.id, element: r.l }, `Tâche créée : demander le prix de « ${r.l} » à ${s.fournisseur}.`)}>Demander le prix</button>}</span>}
                </div>)}</Fragment>)}
              {S.map((s, j) => s.statut !== 'attendue' ? null : <div key={s.id} className="cp-attente" style={{ gridColumn: j + 2, gridRow: `2 / span ${lignes}` }}>
                <span className="rond-attente"><Icone nom="clock" taille={24} couleur="#0C2147" /></span><b className="fort">Soumission attendue</b>
                <span className="gris texte-13">Portée envoyée le {jourMois(s.demandee_le)}</span>{s.relance_le && <span className="gris texte-13">Relance prévue<br />le {jourMois(s.relance_le)} (tâche)</span>}
                {D.peut_ecrire && saisie !== s.id && <button className="lien" onClick={() => { setSaisie(s.id); setF({ montant: '', montant_note: '', manque: '', garantie: '', debut: '', couverture: Object.fromEntries(E.map((e) => [e.code, true])) }); }}>Inscrire la soumission reçue</button>}
                {saisie === s.id && <div className="saisie-soumission">
                  <input className="e70-raison" inputMode="decimal" placeholder="Montant ($)" value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} aria-label="Montant" />
                  {E.map((e) => <label key={e.code} className="ligne-ic texte-12"><input type="checkbox" checked={!!f.couverture[e.code]} onChange={(x) => setF({ ...f, couverture: { ...f.couverture, [e.code]: x.target.checked } })} />{e.libelle}</label>)}
                  {E.some((e) => !f.couverture[e.code]) && <input className="e70-raison" inputMode="decimal" placeholder="Estimation de ce qui manque ($)" value={f.manque} onChange={(e) => setF({ ...f, manque: e.target.value })} aria-label="Estimation de ce qui manque" />}
                  <input className="e70-raison" placeholder="Garantie (10 ans)" value={f.garantie} onChange={(e) => setF({ ...f, garantie: e.target.value })} aria-label="Garantie" />
                  <input className="e70-raison" type="date" value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} aria-label="Début des travaux" />
                  <button className="bouton bouton-principal" disabled={envoi || !(Number(f.montant.replace(',', '.')) > 0)} onClick={() => agir({ action: 'soumission', soumission_id: s.id, montant: Number(f.montant.replace(',', '.')),
                    couverture: f.couverture, estimation_manquants: f.manque ? Number(f.manque.replace(',', '.')) : '', garantie: f.garantie, debut: f.debut,
                    montant_note: E.filter((e) => !f.couverture[e.code]).length ? `sans ${E.filter((e) => !f.couverture[e.code]).map((e) => e.libelle.toLowerCase().replace(/^(\S+s)\b/, 'les $1')).join(', ')}` : '' })}>Inscrire</button></div>}
              </div>)}
            </div> : <p className="gris texte-13">Définissez la portée dans le cadrage pour comparer les soumissions élément par élément.</p>}
            {D.peut_ecrire && !ferme && ['approbation', 'soumissions'].includes(D.etape) && S.length < 6 && D.fournisseurs.length > 0 && <div className="ligne-ic" style={{ gap: 12, marginTop: 20 }}>
              <select className="filtre" value={inv} onChange={(e) => setInv(e.target.value)} aria-label="Fournisseur">{D.fournisseurs.map((w) => <option key={w.id} value={w.id}>{w.nom}{w.specialite ? ` · ${w.specialite}` : ''}</option>)}</select>
              <button className="bouton bouton-contour" disabled={envoi || !inv} onClick={() => agir({ action: 'inviter', id: D.id, worker_id: inv }, 'Soumission demandée; une tâche de relance est créée dans 5 jours.')}>Demander une soumission</button></div>}
          </section>
        </div>
        <section className="carte-l18 cadrage" aria-label="Cadrage"><h2 className="titre-carte" style={{ margin: 0 }}>Cadrage</h2>
          {D.approuve_le ? <p className="ligne-ic texte-13" style={{ margin: '4px 0 0' }}><span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={3} /></span>Approuvée par {D.approuve_par ?? 'le propriétaire'} le {jourMois(D.approuve_le)}{D.approuve_via ? `, via ${D.approuve_via}` : ''}</p>
            : <p className="gris texte-13" style={{ margin: '4px 0 0' }}>Pas encore approuvée par le propriétaire</p>}
          {D.besoin && <><p className="surtitre gris">Besoin</p><p className="texte-13" style={{ lineHeight: 1.45, margin: 0 }}>{D.besoin}</p>
            {D.rapport_libelle && <p className="ligne-ic texte-13 lien-couleur fort" style={{ margin: '8px 0 0' }}><Icone nom="clip" taille={16} couleur="#2C5A99" />{D.rapport_libelle}</p>}</>}
          {!!D.exigences.length && <><p className="surtitre gris">Exigences</p><ul className="puces-grises">{D.exigences.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {(D.inclus || D.exclus || D.reporte) && <><p className="surtitre gris">Portée</p><dl className="portee-projet">
            {D.inclus && <><dt><Icone nom="check" taille={16} couleur="#0C2147" trait={2} />Inclus</dt><dd>{D.inclus}</dd></>}
            {D.exclus && <><dt><Icone nom="close" taille={16} couleur="#58697F" trait={2} />Exclus</dt><dd>{D.exclus}{D.exclus_note && <span className="bloc gris texte-12">{D.exclus_note}</span>}</dd></>}
            {D.reporte && <><dt><Icone nom="clock" taille={16} couleur="#2C5A99" trait={2} />Reporté</dt><dd>{D.reporte}{D.reporte_revision && <span className="bloc gris texte-12">{D.reporte_revision}</span>}</dd></>}</dl></>}
          {!!D.arbitrages.length && <><p className="surtitre gris">Arbitrages</p>{D.arbitrages.map((a, i) => <div key={i} className="arbitrage-projet">{a.avec && <span className="ini" style={{ width: 32, height: 32, fontSize: 11 }}>{initiales(a.avec)}</span>}
            <div><b className="fort texte-13">{a.titre}</b>{a.avec && <span className="bloc texte-13">Décidé avec {a.avec}{a.le ? ` le ${jourMois(a.le)}` : ''}</span>}{a.raison && <span className="bloc gris texte-13">Raison : {a.raison}</span>}</div></div>)}</>}
          <p style={{ marginTop: 24 }}><Link className="lien" href="/maintenance/projets">← Tous les projets</Link></p>
        </section>
      </div>
    </>
  );
}
