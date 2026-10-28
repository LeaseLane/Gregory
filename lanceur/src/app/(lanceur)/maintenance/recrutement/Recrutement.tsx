'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Candidat = { id: string; entreprise: string; secteur: string | null; specialites: string[]; rbq: string | null; rbq_statut: 'valide' | 'expiree' | 'introuvable' | 'non_requise' | 'a_verifier';
  rbq_source: string | null; assurance: string | null; note: number | null; source_url: string; extrait: string | null; raison: string | null; pertinence: number | null;
  courriel: string | null; telephone: string | null; status: 'proposed' | 'approved' | 'invited' | 'registered'; invited_at: string | null; relances: number; par: string | null; worker_verifie: string | null; created_at: string };
export type DonneesRecrutement = { candidats: Candidat[]; gabarit_actif: boolean; peut_ecrire: boolean;
  recherche: { id: string; specialite: string; secteurs: string; besoin: string | null; documents: string[]; active: boolean; chaque_soir: boolean; par: string | null; le: string; derniere: string | null } | null };

const RBQ: Record<Candidat['rbq_statut'], [string, string]> = { valide: ['RBQ vérifiée', ''], non_requise: ['Licence non requise', ''], a_verifier: ['À vérifier', 'neutral'], expiree: ['Licence expirée', 'todo'], introuvable: ['Licence introuvable', 'neutral'] };
const date = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const court = (n: string | null) => { if (!n) return ''; const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };
const domaine = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export function Recrutement({ donnees, erreurLecture }: { donnees: DonneesRecrutement | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<Candidat | null>(null), [recherche, setRecherche] = useState(false), [cherche, setCherche] = useState(false);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const d = donnees, r = d.recherche;
  const verifie = (c: Candidat) => c.rbq_statut === 'valide' || c.rbq_statut === 'non_requise';
  const COLS: [string, string, Candidat[], (c: Candidat) => [string, string]][] = [
    ['Trouvés par l’agent', 'Avant toute vérification', d.candidats.filter((c) => c.status === 'proposed' && !verifie(c)), (c) => RBQ[c.rbq_statut]],
    ['Vérifiés', 'RBQ confirmée · à approuver', d.candidats.filter((c) => c.status === 'proposed' && verifie(c)), () => ['À approuver', 'action']],
    ['Invités', 'Un courriel, une relance au plus', d.candidats.filter((c) => c.status === 'approved' || c.status === 'invited'),
      (c) => c.status === 'approved' ? ['Invitation en attente', 'neutral'] : c.relances ? ['Relancé', 'neutral'] : [`Relance le ${date(new Date(new Date(c.invited_at!).getTime() + 6 * 864e5).toISOString())}`, 'neutral']],
    ['Actifs', 'Inscrits à la banque de fournisseurs', d.candidats.filter((c) => c.status === 'registered'), (c) => c.worker_verifie === 'verified' ? ['Actif', 'final'] : ['Inscrit · en vérification', '']],
  ];
  async function lancer() {
    setCherche(true); setBandeau(null);
    const res = await fetch('/api/recrutement', { method: 'POST' }); const x = await res.json().catch(() => ({}));
    setCherche(false);
    if (!res.ok) { setBandeau(x.error ?? `Erreur ${res.status}`); return; }
    setToast(`${x.trouves} entreprise${x.trouves > 1 ? 's' : ''} trouvée${x.trouves > 1 ? 's' : ''}, ${x.candidats} nouvelle${x.candidats > 1 ? 's' : ''}${x.cout_cents != null ? ` · coût ≈ ${(x.cout_cents / 100).toFixed(2).replace('.', ',')} $ US` : ''}.`);
    router.refresh();
  }
  async function soir(v: boolean) { const { error } = await supabaseNavigateur().rpc('lanceur_recherche_chaque_soir', { p_actif: v }); if (error) setBandeau(error.message); else router.refresh(); }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="recrutement">
        <div className="kanban quatre">
          {COLS.map(([t, s, l, puce], i) => (
            <section key={t} className="colonne" aria-label={t}>
              <header><h2>{t} <span className="compte">{l.length}</span></h2><p>{s}</p></header>
              {l.map((c) => { const [lib, ton] = puce(c); return (
                <button key={c.id} className="deal candidat" onClick={() => setOuvert(c)}>
                  <span className="deal-l1"><strong>{c.entreprise}</strong></span>
                  <span className="deal-l2">{[c.secteur, c.note ? `note ${String(c.note).replace('.', ',')}` : null, i >= 2 && c.par ? `par ${court(c.par)}` : null].filter(Boolean).join(' · ')}</span>
                  <span className="deal-l3"><span className={'puce ' + ton}>{lib}</span></span>
                </button>); })}
              {!l.length && <p className="colonne-vide">Aucun.</p>}
              {i === 3 && r?.specialite.toLowerCase().includes('neige') && <p className="regle"><Icone nom="info" taille={18} couleur="#58697F" />Une entreprise de relève est conseillée pour les tempêtes.</p>}
            </section>
          ))}
        </div>
        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Recherche de l’agent">
            <div className="recherche-tete"><p className="surtitre">{r ? 'Recherche en cours' : 'Aucune recherche'}</p>
              {r && d.peut_ecrire && <button role="switch" aria-checked={r.chaque_soir} aria-label="Nouvelle passe chaque soir" title="Nouvelle passe chaque soir à 20 h (coût IA)" className={'interrupteur' + (r.chaque_soir ? ' on' : '')} onClick={() => soir(!r.chaque_soir)} />}</div>
            {r ? <>
              <h2 className="recherche-titre">{r.specialite} · {r.secteurs.split(',')[0]}</h2>
              <p className="gris note">Lancée le {date(r.le)}{r.par ? ` par ${court(r.par)}` : ''}. {r.chaque_soir ? 'Nouvelle passe ce soir à 20 h.' : 'Passe du soir désactivée.'}{r.derniere ? ` Dernière passe le ${date(r.derniere)}.` : ''}</p>
              <p className="surtitre gris" style={{ marginTop: 20 }}>Secteurs</p><p className="fort" style={{ margin: 0 }}>{r.secteurs}</p>
              {r.besoin && <><p className="surtitre gris" style={{ marginTop: 16 }}>Besoin</p><p className="fort" style={{ margin: 0 }}>{r.besoin}</p></>}
              <p className="surtitre gris" style={{ marginTop: 20 }}>{r.documents.length} documents exigés</p>
              <ul className="docs">{r.documents.map((x, i) => <li key={x}><Icone nom={['key', 'shield', 'file'][i] ?? 'file'} taille={18} couleur="#2E5788" />{x}</li>)}</ul>
            </> : <p className="gris note">Définissez la spécialité et les secteurs, puis lancez l’agent.</p>}
            {d.peut_ecrire && <div className="import-boutons">
              {r && <button className="bouton bouton-principal" disabled={cherche} onClick={lancer}><Icone nom="spark" taille={20} couleur="#fff" />{cherche ? 'Recherche… (1 min)' : 'Lancer une passe maintenant'}</button>}
              <button className="bouton bouton-contour" onClick={() => setRecherche(true)}><Icone nom="sliders" taille={20} />{r ? 'Modifier la recherche' : 'Définir la recherche'}</button></div>}
          </section>
          <section className="carte-l18" aria-label="Règle de contact">
            <div className="regle-contact"><span className="appel-ic"><Icone nom="shieldc" taille={20} couleur="#0C2147" /></span><strong>Aucun contact avant la vérification de la licence RBQ</strong></div>
            <p className="note">L’agent vérifie au registre de la RBQ; une personne approuve chaque invitation. {d.gabarit_actif ? '' : 'Les invitations FOU-05 attendent l’activation du gabarit, une fois son texte approuvé (Studio › Gabarits).'}</p>
          </section>
        </div>
      </div>
      {ouvert && <FicheCandidat c={ouvert} peut={d.peut_ecrire} fermer={() => setOuvert(null)} fait={(t) => { setOuvert(null); setToast(t); router.refresh(); }} />}
      {recherche && <Recherche r={r} fermer={() => setRecherche(false)} fait={() => { setRecherche(false); setToast('Recherche enregistrée. Lancez une passe quand vous voulez.'); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function FicheCandidat({ c, peut, fermer, fait }: { c: Candidat; peut: boolean; fermer: () => void; fait: (t: string) => void }) {
  const [pub, setPub] = useState(false), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const invitable = (c.rbq_statut === 'valide' || c.rbq_statut === 'non_requise') && !!c.courriel;
  async function decider(decision: 'approuver' | 'ecarter') {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_decider_candidat', { p: { id: c.id, decision, publication_confirmee: pub, note } });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    fait(decision === 'ecarter' ? `${c.entreprise} écarté.` : (data as { invitation_en_attente: boolean }).invitation_en_attente ? `${c.entreprise} approuvé · invitation en attente du gabarit FOU-05.` : `Invitation envoyée à ${c.entreprise}.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="cand-t" style={{ marginTop: 100 }}>
        <div className="fenetre-tete"><h2 id="cand-t">{c.entreprise}</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <dl className="details-deal" style={{ padding: 0, marginBottom: 16 }}>
          <div><dt>Licence RBQ</dt><dd>{RBQ[c.rbq_statut][0]}{c.rbq ? ` · ${c.rbq}` : ''}{c.rbq_source && <> · <a href={c.rbq_source} target="_blank" rel="noreferrer noopener">registre</a></>}</dd></div>
          <div><dt>Assurance déclarée</dt><dd>{c.assurance ?? 'non déclarée'}</dd></div>
          <div><dt>Contact</dt><dd>{[c.courriel, c.telephone].filter(Boolean).join(' · ')}</dd></div>
          <div><dt>Pertinence</dt><dd>{c.pertinence ?? '—'} %{c.note ? ` · note ${String(c.note).replace('.', ',')}` : ''}</dd></div>
        </dl>
        <p className="pourquoi"><Icone nom="spark" taille={18} couleur="#2E5788" /><span>{c.raison}{c.extrait ? <> — <q>{c.extrait}</q></> : null}</span></p>
        <p className="fenetre-aide">Source : <a href={c.source_url} target="_blank" rel="noreferrer noopener">{domaine(c.source_url)}</a> · trouvé par l’agent le {date(c.created_at)}</p>
        {peut && c.status === 'proposed' && <>
          {invitable ? <label className="case consentement"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />{c.courriel} est publié bien en vue comme coordonnée d’affaires, sans mention de refus des sollicitations (LCAP).</label>
            : <p className="bandeau info" style={{ fontSize: 13 }}>{c.rbq_statut === 'expiree' || c.rbq_statut === 'introuvable' ? 'Licence RBQ non valide : ce candidat ne peut pas être invité.' : c.rbq_statut === 'a_verifier' ? 'Licence RBQ à vérifier avant toute invitation.' : 'Aucun courriel : invitez par téléphone.'}</p>}
          <label className="fenetre-lib" htmlFor="cand-n">Note<span>facultatif, gardée si vous écartez</span></label>
          <input id="cand-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} />
        </>}
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {peut && c.status === 'proposed' && <div className="fenetre-actions">
          <button className="bouton bouton-contour" disabled={envoi} onClick={() => decider('ecarter')}>Écarter</button>
          <button className="bouton bouton-principal" disabled={envoi || !invitable || !pub} onClick={() => decider('approuver')}>Approuver et inviter</button></div>}
      </div>
    </div>
  );
}

function Recherche({ r, fermer, fait }: { r: DonneesRecrutement['recherche']; fermer: () => void; fait: () => void }) {
  const [f, setF] = useState({ specialite: r?.specialite ?? '', secteurs: r?.secteurs ?? '', besoin: r?.besoin ?? '' }), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_recherche_recrutement', { p: f });
    setEnvoi(false); if (error) setErreur(error.message); else fait();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="rech-t" style={{ marginTop: 120 }}>
        <div className="fenetre-tete"><h2 id="rech-t">Recherche de l’agent</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <label className="fenetre-lib" htmlFor="r-s">Spécialité<span>obligatoire</span></label><input id="r-s" className="e70-raison" value={f.specialite} onChange={(e) => setF({ ...f, specialite: e.target.value })} placeholder="Ex. : Plomberie, Déneigement" />
        <label className="fenetre-lib" htmlFor="r-z">Secteurs<span>obligatoire</span></label><input id="r-z" className="e70-raison" value={f.secteurs} onChange={(e) => setF({ ...f, secteurs: e.target.value })} placeholder="Ex. : Charlesbourg, Beauport" />
        <label className="fenetre-lib" htmlFor="r-b">Besoin</label><input id="r-b" className="e70-raison" value={f.besoin} onChange={(e) => setF({ ...f, besoin: e.target.value })} placeholder="Ex. : 42 logements · hiver 2026-2027" />
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || !f.specialite.trim() || !f.secteurs.trim()} onClick={ok}>Enregistrer la recherche</button></div>
      </div>
    </div>
  );
}
