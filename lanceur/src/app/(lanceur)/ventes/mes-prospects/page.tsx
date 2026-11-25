import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import type { DonneesPipeline } from '@/composants/ventes/Pipeline';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { tServeur } from '@/lib/i18n/serveur';
import { MesProspects } from './MesProspects';

/* Ventes › Mes prospects (Grégory, 2026-11-04) : le pipeline des mandats, seulement les deals dont la personne connectée est responsable.
   Pas de rôle à part : un prospecteur est un membre de l'équipe (rôle « prospection »). */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouveau?: string; comme?: string }> }) {
  const { t } = await tServeur();
  const { nouveau, comme } = await searchParams;   // ?comme=<prospecteur> : un admin voit l'espace d'un prospecteur, comme lui le voit
  const sb = await supabaseServeur();
  const [{ data: { user } }, { data, error }, { data: raisons }, { data: stats }] = await Promise.all([sb.auth.getUser(), sb.rpc('lanceur_pipeline', { p_code: 'mandats' }), sb.rpc('lanceur_raisons_perte'), sb.rpc('lanceur_mes_stats', comme ? { p_caller: comme } : {})]);
  const vue = comme && stats ? (stats as { nom: string; user_id: string | null }) : null;
  if (vue) await sb.rpc('lanceur_voir_espace_prospecteur', { p_id: comme });
  const qui = vue?.user_id ?? user?.id;
  // Prospecteur seulement (null pour l'équipe) : ses chiffres, comme dans l'ancien portail.
  const S = stats as { prospects: number; appels_aujourdhui: number; appels_semaine: number; relances_retard: number; relances_aujourdhui: number } | null;
  const d = data as DonneesPipeline | null;
  const miens = d ? { ...d, deals: d.deals.filter((x) => x.owner_user_id === qui), equipe: d.equipe.filter((m) => m.id === qui) } : null;
  const onglets = ongletsVentes();
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={onglets.length - 1} onglets={onglets}
      actions={d?.peut_ecrire && !vue ? <Link className="bouton bouton-principal" href="/ventes/mes-prospects?nouveau=1" style={{ minWidth: 208 }}><Icone nom="plus" taille={20} couleur="#fff" />{t('Nouveau prospect')}</Link> : null}>
      {vue && <div className="bandeau info" role="status">{t('Vous voyez l’espace de')} <strong>{vue.nom}</strong>{t(', comme il le voit : ses prospects et ses chiffres. Vous restez connecté sous votre nom; cette consultation est inscrite au journal.')}{' '}
        <Link className="lien" href={`/ventes/prospecteurs/${comme}`}>{t('Revenir à sa fiche')}</Link></div>}
      {S && <div className="kpis" aria-label={t('Mes stats')}>
        <div className="kpi"><span>{t('Appels aujourd’hui')}</span><b>{S.appels_aujourdhui}</b><span>{S.relances_aujourdhui ? t(S.relances_aujourdhui > 1 ? '{n} rappels prévus aujourd’hui' : '{n} rappel prévu aujourd’hui', { n: S.relances_aujourdhui }) : t('Aucun rappel prévu aujourd’hui')}</span></div>
        <div className="kpi"><span>{t('Appels · 7 derniers jours')}</span><b>{S.appels_semaine}</b><span>{t('Notés sur vos prospects')}</span></div>
        <div className="kpi"><span>{t('Relances en retard')}</span><b style={S.relances_retard ? { color: '#9B2E28' } : undefined}>{S.relances_retard}</b><span>{S.relances_retard ? t('Date de rappel dépassée') : t('Rien en retard')}</span></div>
        <div className="kpi"><span>{t('Mes prospects')}</span><b>{S.prospects}</b><span>{t('Assignés ou ajoutés par vous')}</span></div>
      </div>}
      <MesProspects donnees={miens} raisons={(raisons as { code: string; label: string }[] | null) ?? []} nouveau={!!nouveau && !!d?.peut_ecrire}
        erreur={error ? (error.code === 'PT403' ? error.message : t('Vos prospects n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
