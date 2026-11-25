'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';
import { dec, spec } from '../onglets';

type Candidat = { id: string; entreprise: string; secteur: string | null; specialites: string[]; rbq: string | null; rbq_statut: 'valide' | 'expiree' | 'introuvable' | 'non_requise' | 'a_verifier';
  rbq_source: string | null; assurance: string | null; note: number | null; source_url: string; extrait: string | null; raison: string | null; pertinence: number | null;
  courriel: string | null; telephone: string | null; status: 'proposed' | 'approved' | 'invited' | 'registered'; invited_at: string | null; relances: number; par: string | null; worker_verifie: string | null; created_at: string };
export type DonneesRecrutement = { candidats: Candidat[]; gabarit_actif: boolean; peut_ecrire: boolean;
  recherche: { id: string; specialite: string; secteurs: string; besoin: string | null; documents: string[]; active: boolean; chaque_soir: boolean; par: string | null; le: string; derniere: string | null } | null };

const RBQ: Record<Candidat['rbq_statut'], [string, string]> = { valide: ['RBQ vérifiée', ''], non_requise: ['Licence non requise', ''], a_verifier: ['À vérifier', 'neutral'], expiree: ['Licence expirée', 'todo'], introuvable: ['Licence introuvable', 'neutral'] };
const date = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
const court = (n: string | null) => { if (!n) return ''; const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const domaine = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export function Recrutement({ donnees, erreurLecture }: { donnees: DonneesRecrutement | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [ouvert, setOuvert] = useState<Candidat | null>(null), [recherche, setRecherche] = useState(false), [cherche, setCherche] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 7000); return () => clearTimeout(tm); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const d = donnees, r = d.recherche;
  const verifie = (c: Candidat) => c.rbq_statut === 'valide' || c.rbq_statut === 'non_requise';
  const COLS: [string, string, Candidat[], (c: Candidat) => [string, string]][] = [
    ['Trouvés par l’agent', 'Avant toute vérification', d.candidats.filter((c) => c.status === 'proposed' && !verifie(c)), (c) => RBQ[c.rbq_statut]],
    ['Vérifiés', 'RBQ confirmée · à approuver', d.candidats.filter((c) => c.status === 'proposed' && verifie(c)), () => ['À approuver', 'action']],
    ['Invités', 'Un courriel, une relance au plus', d.candidats.filter((c) => c.status === 'approved' || c.status === 'invited'),
      (c) => c.status === 'approved' ? ['Invitation en attente', 'neutral'] : c.relances ? ['Relancé', 'neutral'] : [t('Relance le {d}', { d: date(new Date(new Date(c.invited_at!).getTime() + 6 * 864e5).toISOString(), locale) }), 'neutral']],
    ['Actifs', 'Inscrits à la banque de fournisseurs', d.candidats.filter((c) => c.status === 'registered'), (c) => c.worker_verifie === 'verified' ? ['Actif', 'final'] : ['Inscrit · en vérification', '']],
  ];
  async function lancer() {
    setCherche(true); setBandeau(null);
    const res = await fetch('/api/recrutement', { method: 'POST' }); const x = await res.json().catch(() => ({}));
    setCherche(false);
    if (!res.ok) { setBandeau(x.error ?? t('Erreur {n}', { n: res.status })); return; }
    setToast(`${x.trouves > 1 ? t('{n} entreprises trouvées', { n: x.trouves }) : t('{n} entreprise trouvée', { n: x.trouves })}, ${x.candidats > 1 ? t('{n} nouvelles', { n: x.candidats }) : t('{n} nouvelle', { n: x.candidats })}${x.cout_cents != null ? ` · ${t('coût ≈ {m} $ US', { m: dec((x.cout_cents / 100).toFixed(2), locale) })}` : ''}.`);
    router.refresh();
  }
  async function soir(v: boolean) { const { error } = await supabaseNavigateur().rpc('lanceur_recherche_chaque_soir', { p_actif: v }); if (error) setBandeau(error.message); else router.refresh(); }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="recrutement">
        <div className="kanban quatre">
          {COLS.map(([titre, s, l, puce], i) => (
            <section key={titre} className="colonne" aria-label={t(titre)}>
              <header><h2>{t(titre)} <span className="compte">{l.length}</span></h2><p>{t(s)}</p></header>
              {l.map((c) => { const [lib, ton] = puce(c); return (
                <button key={c.id} className="deal candidat" onClick={() => setOuvert(c)}>
                  <span className="deal-l1"><strong>{c.entreprise}</strong></span>
                  <span className="deal-l2">{[c.secteur, c.note ? t('note {n}', { n: dec(c.note, locale) }) : null, i >= 2 && c.par ? t('par {n}', { n: court(c.par) }) : null].filter(Boolean).join(' · ')}</span>
                  <span className="deal-l3"><span className={'puce ' + ton}>{t(lib)}</span></span>
                </button>); })}
              {!l.length && <p className="colonne-vide">{t('Aucun.')}</p>}
              {i === 3 && r?.specialite.toLowerCase().includes('neige') && <p className="regle"><Icone nom="info" taille={18} couleur="#58697F" />{t('Une entreprise de relève est conseillée pour les tempêtes.')}</p>}
            </section>
          ))}
        </div>
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label={t('Recherche de l’agent')}>
            <div className="recherche-tete"><p className="surtitre">{r ? t('Recherche en cours') : t('Aucune recherche')}</p>
              {r && d.peut_ecrire && <button role="switch" aria-checked={r.chaque_soir} aria-label={t('Nouvelle passe chaque soir')} title={t('Nouvelle passe chaque soir à 20 h (coût IA)')} className={'interrupteur' + (r.chaque_soir ? ' on' : '')} onClick={() => soir(!r.chaque_soir)} />}</div>
            {r ? <>
              <h2 className="recherche-titre">{spec(t, r.specialite)} · {r.secteurs.split(',')[0]}</h2>
              <p className="gris note">{t('Lancée le {d}', { d: date(r.le, locale) })}{r.par ? ` ${t('par {n}', { n: court(r.par) })}` : ''}. {r.chaque_soir ? t('Nouvelle passe ce soir à 20 h.') : t('Passe du soir désactivée.')}{r.derniere ? ` ${t('Dernière passe le {d}.', { d: date(r.derniere, locale) })}` : ''}</p>
              <p className="surtitre gris" style={{ marginTop: 20 }}>{t('Secteurs')}</p><p className="fort" style={{ margin: 0 }}>{r.secteurs}</p>
              {r.besoin && <><p className="surtitre gris" style={{ marginTop: 16 }}>{t('Besoin')}</p><p className="fort" style={{ margin: 0 }}>{r.besoin}</p></>}
              <p className="surtitre gris" style={{ marginTop: 20 }}>{t('{n} documents exigés', { n: r.documents.length })}</p>
              <ul className="docs">{r.documents.map((x, i) => <li key={x}><Icone nom={['key', 'shield', 'file'][i] ?? 'file'} taille={18} couleur="#2E5788" />{t(x)}</li>)}</ul>
            </> : <p className="gris note">{t('Définissez la spécialité et les secteurs, puis lancez l’agent.')}</p>}
            {d.peut_ecrire && <div className="import-boutons">
              {r && <button className="bouton bouton-principal" disabled={cherche} onClick={lancer}><Icone nom="spark" taille={20} couleur="#fff" />{cherche ? t('Recherche… (1 min)') : t('Lancer une passe maintenant')}</button>}
              <button className="bouton bouton-contour" onClick={() => setRecherche(true)}><Icone nom="sliders" taille={20} />{r ? t('Modifier la recherche') : t('Définir la recherche')}</button></div>}
          </section>
          <section className="carte-l18" aria-label={t('Règle de contact')}>
            <div className="regle-contact"><span className="appel-ic"><Icone nom="shieldc" taille={20} couleur="#0C2147" /></span><strong>{t('Aucun contact avant la vérification de la licence RBQ')}</strong></div>
            <p className="note">{t('L’agent vérifie au registre de la RBQ; une personne approuve chaque invitation.')} {d.gabarit_actif ? '' : t('Les invitations FOU-05 attendent l’activation du gabarit, une fois son texte approuvé (Studio › Gabarits).')}</p>
          </section>
        </div>
      </div>
      {ouvert && <FicheCandidat c={ouvert} peut={d.peut_ecrire} fermer={() => setOuvert(null)} fait={(msg) => { setOuvert(null); setToast(msg); router.refresh(); }} />}
      {recherche && <Recherche r={r} fermer={() => setRecherche(false)} fait={() => { setRecherche(false); setToast(t('Recherche enregistrée. Lancez une passe quand vous voulez.')); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function FicheCandidat({ c, peut, fermer, fait }: { c: Candidat; peut: boolean; fermer: () => void; fait: (msg: string) => void }) {
  const { t, locale } = useT();
  const [pub, setPub] = useState(false), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const invitable = (c.rbq_statut === 'valide' || c.rbq_statut === 'non_requise') && !!c.courriel;
  async function decider(decision: 'approuver' | 'ecarter') {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_decider_candidat', { p: { id: c.id, decision, publication_confirmee: pub, note } });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    fait(decision === 'ecarter' ? t('{n} écarté.', { n: c.entreprise }) : (data as { invitation_en_attente: boolean }).invitation_en_attente ? t('{n} approuvé · invitation en attente du gabarit FOU-05.', { n: c.entreprise }) : t('Invitation envoyée à {n}.', { n: c.entreprise }));
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="cand-t" style={{ marginTop: 100 }}>
        <div className="fenetre-tete"><h2 id="cand-t">{c.entreprise}</h2><button className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <dl className="details-deal" style={{ padding: 0, marginBottom: 16 }}>
          <div><dt>{t('Licence RBQ')}</dt><dd>{t(RBQ[c.rbq_statut][0])}{c.rbq ? ` · ${c.rbq}` : ''}{c.rbq_source && <> · <a href={c.rbq_source} target="_blank" rel="noreferrer noopener">{t('registre')}</a></>}</dd></div>
          <div><dt>{t('Assurance déclarée')}</dt><dd>{c.assurance ?? t('non déclarée')}</dd></div>
          <div><dt>{t('Contact')}</dt><dd>{[c.courriel, c.telephone].filter(Boolean).join(' · ')}</dd></div>
          <div><dt>{t('Pertinence')}</dt><dd>{c.pertinence ?? '—'} %{c.note ? ` · ${t('note {n}', { n: dec(c.note, locale) })}` : ''}</dd></div>
        </dl>
        <p className="pourquoi"><Icone nom="spark" taille={18} couleur="#2E5788" /><span>{c.raison}{c.extrait ? <> — <q>{c.extrait}</q></> : null}</span></p>
        <p className="fenetre-aide">{t('Source :')} <a href={c.source_url} target="_blank" rel="noreferrer noopener">{domaine(c.source_url)}</a> · {t('trouvé par l’agent le {d}', { d: date(c.created_at, locale) })}</p>
        {peut && c.status === 'proposed' && <>
          {invitable ? <label className="case consentement"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />{t('{c} est publié bien en vue comme coordonnée d’affaires, sans mention de refus des sollicitations (LCAP).', { c: c.courriel })}</label>
            : <p className="bandeau info" style={{ fontSize: 13 }}>{c.rbq_statut === 'expiree' || c.rbq_statut === 'introuvable' ? t('Licence RBQ non valide : ce candidat ne peut pas être invité.') : c.rbq_statut === 'a_verifier' ? t('Licence RBQ à vérifier avant toute invitation.') : t('Aucun courriel : invitez par téléphone.')}</p>}
          <label className="fenetre-lib" htmlFor="cand-n">{locale.startsWith('en') ? 'Internal note' : 'Note'}<span>{t('facultatif, gardée si vous écartez')}</span></label>
          <input id="cand-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} />
        </>}
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {peut && c.status === 'proposed' && <div className="fenetre-actions">
          <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('ecarter')}>{t('Écarter')}</button>
          <button className="bouton bouton-principal" disabled={envoi || !invitable || !pub} onClick={() => decider('approuver')}>{t('Approuver et inviter')}</button></div>}
      </div>
    </div>
  );
}

function Recherche({ r, fermer, fait }: { r: DonneesRecrutement['recherche']; fermer: () => void; fait: () => void }) {
  const { t } = useT();
  const [f, setF] = useState({ specialite: r?.specialite ?? '', secteurs: r?.secteurs ?? '', besoin: r?.besoin ?? '' }), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_recherche_recrutement', { p: f });
    setEnvoi(false); if (error) setErreur(error.message); else fait();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rech-t" style={{ marginTop: 120 }}>
        <div className="fenetre-tete"><h2 id="rech-t">{t('Recherche de l’agent')}</h2><button className="fermer" onClick={fermer} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib" htmlFor="r-s">{t('Spécialité')}<span>{t('obligatoire')}</span></label><input id="r-s" className="e70-raison" value={f.specialite} onChange={(e) => setF({ ...f, specialite: e.target.value })} placeholder={t('Ex. : Plomberie, Déneigement')} />
        <label className="fenetre-lib" htmlFor="r-z">{t('Secteurs')}<span>{t('obligatoire')}</span></label><input id="r-z" className="e70-raison" value={f.secteurs} onChange={(e) => setF({ ...f, secteurs: e.target.value })} placeholder={t('Ex. : Charlesbourg, Beauport')} />
        <label className="fenetre-lib" htmlFor="r-b">{t('Besoin')}</label><input id="r-b" className="e70-raison" value={f.besoin} onChange={(e) => setF({ ...f, besoin: e.target.value })} placeholder={t('Ex. : 42 logements · hiver 2026-2027')} />
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={envoi || !f.specialite.trim() || !f.secteurs.trim()} onClick={ok}>{t('Enregistrer la recherche')}</button></div>
      </div>
    </div>
  );
}
