import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import type { T } from '@/lib/i18n/langue';
import { CadreEspace, LARGEURS } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ongletsMaint, SOUS_MAINT, ETAPES_PROJET, jourMois, dollars, plage } from '../onglets';
import { NouveauProjet } from './NouveauProjet';

type Ligne = { id: string; numero: string; titre: string; adresse: string | null; proprietaire: string | null; etape: string; budget_min: number | null; budget_max: number | null;
  voulues: number; recues: number; limite: string | null; travaux_debut: string | null; fin_prevue: string | null };
const ETIQ: Record<string, string> = { ...Object.fromEntries(ETAPES_PROJET), annule: 'Annulé' };
const prochaine = (p: Ligne, t: T, locale: string) => p.etape === 'soumissions' ? `${t('{r} sur {v} soumissions', { r: p.recues, v: p.voulues })}${p.limite ? ` · ${jourMois(p.limite, locale)}` : ''}` : p.etape === 'travaux' ? t('fin prévue le {d}', { d: jourMois(p.fin_prevue, locale) })
  : p.etape === 'cadrage' ? t('cadrage en cours') : p.etape === 'approbation' ? t('en attente du propriétaire') : '—';

/* Maintenance · Projets : les gros travaux d'immeuble, de leur cadrage à la fin des travaux (fiche : maquette e74). */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const { t, locale } = await tServeur();
  const [{ data, error }, q] = await Promise.all([(await supabaseServeur()).rpc('lanceur_projets'), searchParams]);
  const D = data as { projets: Ligne[]; immeubles: { id: string; adresse: string }[]; peut_ecrire: boolean } | null;
  const actions = D?.peut_ecrire ? <Link href="/maintenance/projets?nouveau=1" className="bouton bouton-principal" style={{ minWidth: LARGEURS['Nouveau projet'] }}><Icone nom="plus" taille={20} couleur="#fff" />{t('Nouveau projet')}</Link> : null;
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={5} onglets={ongletsMaint()} actions={actions}>
      {!D ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : t('Les projets n’ont pas pu être lus.')}</div> : <>
        {q.nouveau === '1' && D.peut_ecrire && <NouveauProjet immeubles={D.immeubles} />}
        <section className="carte-l18" aria-label={t('Projets')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('{n} projets en cours', { n: D.projets.filter((p) => !['termine', 'annule'].includes(p.etape)).length })}</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Gros travaux cadrés avec le propriétaire, soumissionnés sur la même portée')}</p>
          <table className="tableau tab-fixe"><colgroup><col style={{ width: '34%' }} /><col style={{ width: '24%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
            <thead><tr><th>{t('Projet')}</th><th>{t('Immeuble')}</th><th>{t('Étape')}</th><th>{t('Suite')}</th><th className="droite">{t('Budget')}</th></tr></thead>
            <tbody>{D.projets.map((p) => <tr key={p.id}><td><Link className="lien-ligne" href={`/maintenance/projets/${p.id}`}><b className="fort">{p.titre}</b></Link><span className="sous gris">{p.numero}</span></td>
                <td>{p.adresse ?? '—'}<span className="sous gris">{p.proprietaire ?? ''}</span></td>
                <td><span className={'puce' + (p.etape === 'termine' ? ' final' : p.etape === 'annule' ? ' neutral' : '')}>{t(ETIQ[p.etape])}</span></td>
                <td className="gris">{prochaine(p, t, locale)}</td><td className="droite">{p.budget_min && p.budget_max ? plage(p.budget_min, p.budget_max, locale, t) : dollars(p.budget_max ?? p.budget_min, locale)}</td></tr>)}
              {!D.projets.length && <tr><td colSpan={5} className="gris">{t('Aucun projet. Un projet sert aux gros travaux : toiture, fenêtres, balcons, mise aux normes.')}</td></tr>}</tbody></table>
        </section></>}
    </CadreEspace>
  );
}
