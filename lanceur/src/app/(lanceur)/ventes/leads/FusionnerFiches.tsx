'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

/* e18 · Fusionner les fiches : les deux fiches côte à côte, champ par champ. On choisit la fiche principale, puis la valeur gardée
   en premier pour le courriel, le téléphone et le deal; l'autre valeur reste en second, rien n'est effacé. */
type Fiche = { id: string; nom: string; emails: string[]; phones: string[]; detail: string; sous: string; adresse: string | null; deals: { id: string; texte: string; pipeline: string; actif: boolean }[]; consentement: string | null };
type Paire = { a: Fiche; b: Fiche; courriel: boolean; telephone: boolean; nom: boolean; confiance: number };
const tel = (t?: string) => t ? t.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1 $2-$3') : '—';

export function FusionnerFiches({ a, b, fermer, fait }: { a: string; b: string; fermer: () => void; fait: (m: string) => void }) {
  const { t } = useT();
  const [P, setP] = useState<Paire | null>(null), [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [principale, setPrincipale] = useState<'a' | 'b'>('a');
  const [choix, setChoix] = useState<Record<string, 'a' | 'b'>>({});
  useEffect(() => {
    supabaseNavigateur().rpc('lanceur_doublon', { p_a: a, p_b: b }).then(({ data, error }) => {
      if (error) return setErreur(error.message);
      const x = data as Paire; setP(x);
      const p: 'a' | 'b' = x.a.detail.startsWith('Client') || x.a.detail === 'Locataire' ? 'a' : x.b.detail.startsWith('Client') || x.b.detail === 'Locataire' ? 'b' : 'a';
      setPrincipale(p); setChoix({ courriel: p, telephone: p, adresse: p, deal: p, consentement: x[p === 'a' ? 'b' : 'a'].consentement ? (p === 'a' ? 'b' : 'a') : p });
    });
    const k = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [a, b, fermer]);
  if (!P) return null;
  const autre = principale === 'a' ? 'b' : 'a', F = (k: 'a' | 'b') => P[k];
  const LIGNES: [string, string, string, (f: Fiche) => string, boolean][] = [
    ['courriel', t('Courriel'), P.courriel ? t('identique') : t('différent'), (f) => f.emails[0] ?? '—', true],
    ['telephone', t('Téléphone'), P.telephone ? t('identique') : t('différent'), (f) => tel(f.phones[0]), true],
    ['adresse', t('Adresse'), t('proche'), (f) => f.adresse ?? '—', false],
    ['deal', t('Deals'), t('l’autre sera fermé'), (f) => f.deals[0]?.texte ?? t('Aucun deal'), true],
    ['consentement', t('Consentements'), t('le plus récent s’applique'), (f) => f.consentement ?? t('Aucun consentement inscrit'), false],
  ];
  async function fusionner() {
    setEnvoi(true); setErreur(null);
    const s = F(principale), v = (k: string) => F(choix[k]);
    const { error } = await supabaseNavigateur().rpc('lanceur_fusionner_choix', { p_survivant: s.id, p_perdant: F(autre).id,
      p_choix: { courriel: v('courriel').emails[0] ?? null, telephone: v('telephone').phones[0] ?? null, deal: v('deal').deals[0]?.id ?? null } });
    setEnvoi(false); if (error) return setErreur(error.message);
    fait(t('Fiches fusionnées.')); fermer();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre fusion" role="dialog" aria-modal="true" aria-labelledby="fu-t">
        <div className="fenetre-tete"><h2 id="fu-t">{t('Fusionner les fiches de {nom}?', { nom: P.a.nom })}</h2>
          <button className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">{t('Cléo a trouvé {criteres} (confiance {n} %). Choisissez la fiche principale, puis la valeur à garder pour chaque champ.', { criteres: [P.courriel && t('le même courriel'), P.telephone && t('le même téléphone'), P.nom && t('le même nom')].filter(Boolean).join(t(' et ')), n: P.confiance })}</p>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fusion-grille">
          <span className="fusion-lib">{t('Fiche principale')}</span>
          {(['a', 'b'] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={principale === k} className={'choix' + (principale === k ? ' choisi' : '')}
            onClick={() => { setPrincipale(k); setChoix({ courriel: k, telephone: k, adresse: k, deal: k, consentement: choix.consentement ?? k }); }}>
            <i className="radio" aria-hidden="true" /><span className="choix-texte"><strong>{F(k).detail === 'Locataire' ? t('Locataire') : F(k).detail}</strong><span className="gris texte-12">{F(k).sous}</span></span></button>)}
          {LIGNES.map(([cle, lib, sous, val, choisissable]) => <div key={cle} className="fusion-ligne">
            <span className="fusion-lib"><b>{lib}</b><small>{sous}</small></span>
            {(['a', 'b'] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={choix[cle] === k} disabled={!choisissable}
              className={'fusion-val' + (choix[cle] === k ? ' choisi' : '')} onClick={() => setChoix({ ...choix, [cle]: k })}>
              <i className="radio" aria-hidden="true" /><span>{val(F(k))}</span></button>)}
          </div>)}
        </div>
        <p className="ligne-ic gris texte-13 fusion-note"><Icone nom="history" taille={16} couleur="#58697F" />{t('La fiche fusionnée garde l’historique des deux; l’autre valeur reste en second, rien n’est effacé.')}</p>
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button>
          <button className="bouton bouton-principal" disabled={envoi} onClick={fusionner}>{envoi ? t('Fusion…') : t('Fusionner les fiches')}</button></div>
      </div>
    </div>
  );
}
