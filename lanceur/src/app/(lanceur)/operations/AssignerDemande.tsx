'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';
import { useT } from '@/composants/Langue';
import type { T } from '@/lib/i18n/langue';

/* e07 · Assigner la demande (fenêtre de 640 px) : fournisseur (le mieux placé en tête, recommandé), plage d'intervention
   (premier créneau qui laisse 24 h d'avis, sauf urgence), avis au locataire. Crée le bon de travail assigné et planifié. */
type Four = { id: string; nom: string; note: number | null; avis: number; disponibilite: string | null; specialites: (string | null)[] };
type Ctx = { numero: string; titre: string; urgent: boolean; urgence: string; logement: string; locataire: { nom: string; telephone: boolean } | null; budget: number; creneau: string; fournisseurs: Four[]; peut_ecrire: boolean };
const DISPO: Record<string, string> = { maintenant: 'disponible maintenant', aujourdhui: 'disponible aujourd’hui', semaine: 'disponible cette semaine', indisponible: 'indisponible' };
const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const plage = (a: Date, b: Date, t: T, locale: string) => { const h = (d: Date) => locale.startsWith('en') ? d.toLocaleTimeString(locale, { hour: 'numeric' }) : `${d.getHours()} h`;
  return t('{jour}, entre {a} et {b}', { jour: a.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }), a: h(a), b: h(b) }); };

export function AssignerDemande({ demande, fermer }: { demande: string; fermer: () => void }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [c, setC] = useState<Ctx | null>(null), [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [four, setFour] = useState(''), [debut, setDebut] = useState(''), [aviser, setAviser] = useState(true), [changer, setChanger] = useState(false), [modifier, setModifier] = useState(false);
  useEffect(() => {
    supabaseNavigateur().rpc('lanceur_assigner_contexte', { p_demande: demande }).then(({ data, error }) => {
      if (error) return setErreur(error.message);
      const x = data as Ctx; setC(x); setFour(x.fournisseurs[0]?.id ?? ''); setDebut(local(new Date(x.creneau)));
    });
    const t = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    window.addEventListener('keydown', t); return () => window.removeEventListener('keydown', t);
  }, [demande, fermer]);
  const a = debut ? new Date(debut) : null, b = a ? new Date(a.getTime() + 2 * 3600e3) : null;
  const choisi = c?.fournisseurs.find((f) => f.id === four);
  async function assigner() {
    if (!a || !b) return;
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_assigner_demande', { p: { demande, worker_id: four, debut: a.toISOString(), fin: b.toISOString(), aviser, budget: c?.budget } });
    setEnvoi(false); if (error) return setErreur(error.message);
    fermer(); router.push(`/maintenance/bons/${(data as { id: string }).id}`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre fenetre-640" role="dialog" aria-modal="true" aria-labelledby="as-t">
        <div className="fenetre-tete"><h2 id="as-t">{c ? t('Assigner la demande {numero}?', { numero: c.numero }) : t('Assigner la demande')}</h2>
          <button className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {!c ? !erreur && <p className="gris">{t('Chargement…')}</p> : <>
          <p className="fenetre-texte">{t('{titre} au {adresse}, classée « {urgence} ». Le fournisseur choisi reçoit le bon de travail et confirme la plage.', { titre: c.titre, adresse: adresse(c.logement), urgence: t(c.urgence) })}</p>
          <p className="fenetre-lib">{t('Fournisseur')} <span>{t('obligatoire')}</span></p>
          {c.fournisseurs.length ? <div className="choix-liste" role="radiogroup" aria-label={t('Fournisseur')}>{c.fournisseurs.slice(0, changer ? 4 : 2).map((f, i) =>
            <button type="button" key={f.id} role="radio" aria-checked={four === f.id} className={'choix' + (four === f.id ? ' choisi' : '')} onClick={() => setFour(f.id)}>
              <i className="radio" aria-hidden="true" /><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{f.nom.split(/\s+/).map((m) => m[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span className="choix-texte"><strong>{f.nom}</strong><span className="ligne-ic gris texte-13"><Icone nom="star" taille={14} couleur="#0C2147" />
                {[f.note ? t('{note} · {n} avis', { note: locale.startsWith('en') ? String(f.note) : String(f.note).replace('.', ','), n: f.avis }) : t('aucun avis'), DISPO[f.disponibilite ?? ''] ? t(DISPO[f.disponibilite ?? '']) : null].filter(Boolean).join(' · ')}</span></span>
              {i === 0 && <span className="choix-reco"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 20, height: 20 }} />{t('Recommandé par Cléo')}</span>}
            </button>)}</div> : <p className="bandeau">{t('Aucun fournisseur conforme (assurance et licence RBQ valides).')}</p>}
          {c.fournisseurs.length > 2 && !changer && <button className="lien" style={{ marginTop: 8 }} onClick={() => setChanger(true)}>{c.fournisseurs.length > 3 ? t('Voir {n} autres fournisseurs', { n: c.fournisseurs.length - 2 }) : t('Voir {n} autre fournisseur', { n: c.fournisseurs.length - 2 })}</button>}
          <p className="fenetre-lib" style={{ marginTop: 24 }}>{t('Plage d’intervention')}</p>
          {modifier ? <div className="champ-ic"><Icone nom="calendar" taille={20} couleur="#58697F" />
            <input type="datetime-local" className="e70-raison" value={debut} step={3600} onChange={(e) => setDebut(e.target.value)} aria-label={t('Début de la plage')} autoFocus onBlur={() => setModifier(false)} /></div>
            : <button type="button" className="e70-raison champ-texte" onClick={() => setModifier(true)} aria-label={t('Changer la plage')}><span>{a && b ? plage(a, b, t, locale).charAt(0).toUpperCase() + plage(a, b, t, locale).slice(1) : '—'}</span><Icone nom="calendar" taille={20} couleur="#58697F" /></button>}
          <p className="gris texte-12" style={{ margin: '8px 0 0' }}>{c.urgent ? t('Urgence : l’avis de 24 h ne s’applique pas.') : choisi ? t('Premier créneau de {nom} qui laisse 24 h d’avis au locataire.', { nom: choisi.nom }) : t('Premier créneau qui laisse 24 h d’avis au locataire.')}</p>
          <label className="case-ligne" style={{ marginTop: 24 }}>
            <input type="checkbox" checked={aviser} onChange={(e) => setAviser(e.target.checked)} disabled={!c.locataire} />
            <span><strong>{t('Aviser le locataire 24 h à l’avance (art. 1931 C.c.Q.)')}</strong>
              <span className="gris texte-13" style={{ display: 'block' }}>{c.locataire ? (c.locataire.telephone ? t('Avis dans le portail de {nom}, et SMS quand l’avis d’entrée est actif', { nom: c.locataire.nom }) : t('Avis dans le portail de {nom}', { nom: c.locataire.nom })) : t('Logement sans locataire actif')}</span></span>
          </label>
          <div className="fenetre-actions" style={{ marginTop: 24, justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ligne-ic gris texte-12"><Icone nom="history" taille={14} couleur="#58697F" />{t('Inscrit au journal')}</span>
            <span style={{ display: 'flex', gap: 12 }}><button className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button>
              <button className="bouton bouton-principal" disabled={envoi || !four || !a || !c.peut_ecrire} onClick={assigner}>{envoi ? t('Assignation…') : t('Assigner à {nom}', { nom: choisi?.nom ?? '…' })}</button></span>
          </div>
        </>}
      </div>
    </div>
  );
}
