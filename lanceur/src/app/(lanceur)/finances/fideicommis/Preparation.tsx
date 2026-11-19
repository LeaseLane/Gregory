'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/* « Prêt pour le 1er » : la liste verte/rouge calculée par la base (fiducie_preparation) et la saisie des comptes de LeaseLane.
   Les numéros complets ne reviennent jamais à l'écran : 3 derniers chiffres seulement. Chaque modification avertit tous les administrateurs (EQP-15). */
type Etat = 'ok' | 'bloquant' | 'attention' | 'info';
type Ligne = { code: string; titre: string; etat: Etat; detail: string };
type Comptes = { fiducie: { institution: string | null; transit: string | null; fin: string | null }; exploitation: { nom: string | null; institution: string | null; transit: string | null; fin: string | null }; bmo: { originateur: string | null; centre: string | null } };
type Prep = { liste: Ligne[]; pret: boolean; comptes: Comptes; carte?: boolean };
type Faire = <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)) => Promise<T | null>;

const PUCE: Record<Etat, [string, string]> = { ok: ['ok', 'Prêt'], bloquant: ['todo', 'Bloquant'], attention: ['attention', 'À voir'], info: ['neutral', 'Info'] };
const LIEN: Record<string, [string, string]> = { interac: ['/finances/fideicommis?vue=soldes', 'Inscrire l’adresse'], releve: ['/finances/fideicommis?vue=depots', 'Importer un relevé'],
  examen: ['/finances/fideicommis?vue=depots', 'Voir les dépôts'], proprietaires: ['/finances/fideicommis?vue=soldes', 'Ouvrir le registre'] };

export function Preparation({ faire, occupe }: { faire: Faire; occupe: boolean }) {
  const [P, setP] = useState<Prep | null>(null), [ouvert, setOuvert] = useState<'fiducie' | 'exploitation' | 'bmo' | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const charger = useCallback(async () => setP(await faire<Prep>({ action: 'fiducie_preparation' })), [faire]);
  useEffect(() => { charger(); }, [charger]);
  if (!P) return <p className="gris">Chargement…</p>;
  const nb = (e: Etat) => P.liste.filter((l) => l.etat === e).length;
  const C = P.comptes, carte = P.liste.some((l) => l.code === 'carte' && l.etat === 'ok');
  const champ = (k: string, lib: string, max: number, num = true) => <div key={k}><label className="fenetre-lib" htmlFor={`cpt-${k}`}>{lib}</label>
    <input id={`cpt-${k}`} className="e70-raison" inputMode={num ? 'numeric' : 'text'} autoComplete="off" maxLength={max} value={f[k] ?? ''}
      onChange={(e) => setF({ ...f, [k]: num ? e.target.value.replace(/\D/g, '') : e.target.value })} /></div>;
  async function enregistrer() {
    const g = ouvert!;
    const corps = g === 'bmo' ? { bmo: { originateur: f.originateur, centre: f.centre } }
      : { [g]: { nom: f.nom, institution: f.institution, transit: f.transit, compte: f.compte } };
    const d = await faire<Prep & { change?: boolean }>({ action: 'fiducie_comptes', ...corps }, (x) => x.change ? 'Compte enregistré. Les administrateurs ont reçu un courriel de sécurité.' : 'Rien de changé : ces numéros étaient déjà inscrits.');
    if (d) { setP(d); setOuvert(null); setF({}); }
  }
  const ouvrir = (g: 'fiducie' | 'exploitation' | 'bmo') => { setOuvert(g); setF(g === 'bmo' ? { originateur: C.bmo.originateur ?? '', centre: C.bmo.centre ?? '' }
    : g === 'exploitation' ? { nom: C.exploitation.nom ?? 'Solutions Locatives LeaseLane', institution: C.exploitation.institution ?? '', transit: C.exploitation.transit ?? '' }
    : { institution: C.fiducie.institution ?? '', transit: C.fiducie.transit ?? '' }); };
  const compte = (g: 'fiducie' | 'exploitation', titre: string) => {
    const c = C[g];
    return <li className="tete-action" style={{ padding: '12px 0', borderTop: '1px solid var(--trait, #E4E8EF)' }}>
      <div><strong>{titre}</strong><div className="gris texte-13">{c.fin ? `${c.institution} · ${c.transit} · se terminant par ${c.fin}` : 'Pas inscrit'}</div></div>
      <button className="lien" onClick={() => ouvrir(g)}>{c.fin ? 'Remplacer' : 'Inscrire'}</button></li>;
  };
  return (
    <div className="grille-2-1">
      <section className="carte-l18" aria-label="Prêt pour le 1er">
        <header className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Prêt pour le 1er</h2>
          <p className="gris texte-13" style={{ margin: 0 }}>{P.pret ? 'Rien ne bloque l’encaissement des loyers.' : `${nb('bloquant')} point${nb('bloquant') > 1 ? 's' : ''} bloque${nb('bloquant') > 1 ? 'nt' : ''} l’encaissement des loyers.`}{nb('attention') ? ` ${nb('attention')} à voir.` : ''}</p></div>
          <span className={`puce ${P.pret ? 'ok' : 'todo'}`}>{P.pret ? 'Prêt' : 'Pas prêt'}</span></header>
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {P.liste.map((l) => <li key={l.code} className="tete-action" style={{ padding: '12px 0', borderTop: '1px solid var(--trait, #E4E8EF)', alignItems: 'flex-start', gap: 12 }}>
            <div><strong>{l.titre}</strong><div className="gris texte-13">{l.detail}</div>
              {l.etat !== 'ok' && LIEN[l.code] && <Link className="lien texte-13" href={LIEN[l.code][0]}>{LIEN[l.code][1]}</Link>}</div>
            <span className={`puce ${PUCE[l.etat][0]}`} style={{ flexShrink: 0 }}>{PUCE[l.etat][1]}</span></li>)}
        </ul>
      </section>
      <section className="carte-l18" aria-label="Comptes de LeaseLane">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>Comptes de LeaseLane</h2>
        <p className="gris texte-13" style={{ margin: 0 }}>Numéros pris sur un spécimen de chèque BMO. Seuls les 3 derniers chiffres s’affichent; chaque changement avertit tous les administrateurs par courriel.</p>
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {compte('fiducie', 'Compte en fidéicommis')}
          {compte('exploitation', 'Compte d’exploitation (honoraires)')}
          <li className="tete-action" style={{ padding: '12px 0', borderTop: '1px solid var(--trait, #E4E8EF)' }}>
            <div><strong>Émetteur BMO (fichier SVA)</strong><div className="gris texte-13">{C.bmo.originateur ? `${C.bmo.originateur} · centre ${C.bmo.centre}` : 'Pas inscrit : versements à la main'}</div></div>
            <button className="lien" onClick={() => ouvrir('bmo')}>{C.bmo.originateur ? 'Modifier' : 'Inscrire'}</button></li>
          <li className="tete-action" style={{ padding: '12px 0', borderTop: '1px solid var(--trait, #E4E8EF)' }}>
            <div><strong>Paiement par carte (Moneris)</strong><div className="gris texte-13">{carte ? 'Offert aux locataires : lien sécurisé sur demande, sans frais pour eux' : 'Éteint'}</div></div>
            <button className="lien" disabled={occupe} onClick={async () => {
              if (!carte && !confirm('Moneris a-t-il confirmé par écrit les liens de paiement, la mise en service, le dépôt au fidéicommis et la facturation des frais à part ?')) return;
              const d = await faire<Prep & { change?: boolean }>({ action: 'fiducie_comptes', carte: !carte }, carte ? 'Paiement par carte retiré du portail locataire.' : 'Paiement par carte offert. Les administrateurs ont reçu un courriel de sécurité.');
              if (d) setP(d); }}>{carte ? 'Éteindre' : 'Allumer'}</button></li>
        </ul>
        {ouvert && <form style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <p className="fort" style={{ margin: '0 0 8px' }}>{ouvert === 'fiducie' ? 'Compte en fidéicommis' : ouvert === 'exploitation' ? 'Compte d’exploitation' : 'Émetteur BMO'}</p>
          {ouvert === 'bmo' ? <div className="po-deux">{champ('originateur', 'ID d’émetteur (10 caractères au plus)', 10, false)}{champ('centre', 'Centre de traitement (5 chiffres)', 5)}</div>
            : <>{ouvert === 'exploitation' && champ('nom', 'Nom du compte', 30, false)}
              <div className="po-deux">{champ('institution', 'Institution (3 chiffres)', 3)}{champ('transit', 'Transit (5 chiffres)', 5)}</div>
              {champ('compte', 'Numéro de compte (5 à 12 chiffres)', 12)}</>}
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => { setOuvert(null); setF({}); }}>Annuler</button>
            <button className="bouton bouton-principal" disabled={occupe}>Enregistrer</button></div>
        </form>}
      </section>
    </div>
  );
}
