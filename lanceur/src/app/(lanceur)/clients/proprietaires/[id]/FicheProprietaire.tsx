'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { jourCourt, argentL } from '@/lib/format';
import { useT } from '@/composants/Langue';
import { ModulesClient } from './ModulesClient';
import { ProgressBar, Sparkline } from '@/composants/dataviz';

/* e20 · Fiche propriétaire : loyers payés chez lui (6 mois, jamais « versé »), occupation, dépenses, demandes; logements par immeuble avec retards;
   relevés mensuels émis le 5; approbation en attente (relance); préférences de communication (LCAP); documents; journal récent. */
type Logement = { numero: string; type: string | null; locataire: string | null; tenant_id: string | null; loyer: number | null; statut: string; retard: number | null };
export type DonneesProprio = { id: string; nom: string; entreprise: string | null; courriel: string | null; telephone: string | null; langue: string | null; adresse: string | null; depuis: string;
  responsable: string | null; plafond: number | null; portail: string;
  indicateurs: { loyers_6: { mois: string; montant: number }[]; logements: number; occupes: number; depenses_12: number; loyers_12: number; demandes: number; demande: string | null };
  immeubles: { id: string; adresse: string; secteur: string | null; logements: Logement[] | null }[];
  releves: { mois: string; numero: string; total: string; facture: string; envoi: string | null; envoye_le: string | null }[];
  approbations: { id: string; quoi: string; montant: number; fournisseur: string | null; le: string }[];
  consentements: { courriel: { le: string; base: string } | null; sms: { le: string; base: string } | null };
  documents: { nombre: number; mandat: { titre: string; le: string } | null }; journal: { action: string; le: string; qui: string | null }[] };
export type Candidat = { id: string; unit_id: string; candidat: string; courriel: string; telephone: string | null; logement: string; statut: string; raison: string | null; recue: string; date: string | null; note: string | null; tenant_id: string | null };
const STATUTS_CAND: Record<string, [string, string]> = { proposee: ['À décider', 'todo'], verification: ['Vérifications en cours', 'info'], acceptee: ['Validé', 'ok'], refusee: ['Non retenu', 'neutral'], retiree: ['Retiré', 'neutral'] };
const moisLibL = (locale: string, iso: string, f: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString(locale, f);
const ACTIONS: Record<string, string> = { 'owner.created': 'Client créé', 'owner.updated': 'Fiche modifiée', 'owner.reminded': 'Relance envoyée', 'approval.decided': 'Approbation décidée', 'statement.issued': 'Relevé émis', 'statement.resent': 'Relevé renvoyé',
  'owner_statement.issued': 'Relevé émis', 'owner_statement.resent': 'Relevé renvoyé', 'owner.profile_updated': 'Profil modifié dans le portail', 'owner.preferences_updated': 'Préférences modifiées dans le portail' };

export function FicheProprietaire({ donnees: D, propositions = [], erreurLecture }: { donnees: DonneesProprio | null; propositions?: Candidat[]; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number) => argentL(n, locale), jour = (iso: string) => jourCourt(iso, locale), moisLib = (iso: string, f?: Intl.DateTimeFormatOptions) => moisLibL(locale, iso, f);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<{ id: string; raison: string } | null>(null);
  const [f, setF] = useState({ nom: D?.nom ?? '', entreprise: D?.entreprise ?? '', courriel: D?.courriel ?? '', telephone: D?.telephone ?? '', adresse: D?.adresse ?? '', langue: D?.langue ?? 'fr' });
  if (!D) return <><Link className="lien po-retour" href="/clients/proprietaires"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Propriétaires')}</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const I = D.indicateurs, max = Math.max(1, ...I.loyers_6.map((m) => m.montant)), dernier = I.loyers_6[I.loyers_6.length - 1];
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  const champ = (k: keyof typeof f, l: string, type = 'text') => <div><label className="fenetre-lib" htmlFor={`fp-${k}`}>{l}</label><input id={`fp-${k}`} className="e70-raison" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/clients/proprietaires"><Icone nom="arrow" taille={14} couleur="#2E5788" />{t('Propriétaires')}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18 fiche-tete" aria-label={t('Propriétaire')}>
        <span className="ini" style={{ width: 56, height: 56, fontSize: 18 }}>{initiales(D.nom)}</span>
        <div><h2 className="releve-titre" style={{ margin: 0 }}>{D.nom}</h2>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{[D.entreprise, t('client depuis {a}', { a: new Date(D.depuis).getFullYear() }), D.courriel, D.telephone, D.responsable && t('responsable : {nom}', { nom: D.responsable })].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13" style={{ margin: '6px 0 0' }}><i className={`point-etat ${D.portail === 'actif' ? 'ok' : D.portail === 'invite' ? 'att' : 'off'}`} />{D.portail === 'actif' ? t('Portail actif') : D.portail === 'invite' ? t('Invitation au portail envoyée') : t('Sans portail')}</p></div>
        <div className="fiche-actions">
          {D.portail === 'aucun' && D.courriel && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_inviter_portail', { owner_id: D.id, courriel: D.courriel }, t('Invitation au portail envoyée.'))}><Icone nom="send" taille={16} couleur="#0C2147" />{t('Inviter au portail')}</button>}
          <button className="bouton bouton-contour" onClick={() => setEdit(true)}><Icone nom="pencil" taille={16} couleur="#0C2147" />{t('Modifier')}</button>
          {D.courriel && <a className="bouton bouton-contour" href={`mailto:${D.courriel}`}><Icone nom="mail" taille={16} couleur="#0C2147" />{t('Écrire')}</a>}
          {D.telephone && <a className="bouton bouton-principal" href={`tel:${D.telephone}`}><Icone nom="phone" taille={16} couleur="#fff" />{t('Appeler')}</a>}</div>
      </section>
      <div className="kpis" style={{ margin: '24px 0' }}>
        <div className="kpi"><span>{t('Loyers payés · {mois}', { mois: moisLib(dernier?.mois ?? new Date().toISOString(), { month: 'long' }) })}</span><b>{argent(dernier?.montant ?? 0)}</b>
          <Sparkline kind="bars" height={36} values={I.loyers_6.map((m) => m.montant)} labels={I.loyers_6.map((m) => moisLib(m.mois))} format={(n) => argent(n)} label={t('Loyers payés, 6 derniers mois')} /></div>
        <div className="kpi"><span>{t('Occupation')}</span><b>{I.occupes} / {I.logements}</b><span>{I.logements - I.occupes ? (I.logements - I.occupes > 1 ? t('{n} logements libres', { n: I.logements - I.occupes }) : t('{n} logement libre', { n: I.logements - I.occupes })) : t('Tout est loué')}</span>
          <ProgressBar value={(100 * I.occupes) / Math.max(1, I.logements)} /></div>
        <div className="kpi"><span>{t('Dépenses · 12 mois')}</span><b>{argent(I.depenses_12)}</b><span>{I.loyers_12 ? t('{n} % des loyers payés', { n: Math.round((100 * I.depenses_12) / I.loyers_12) }) : '—'}</span></div>
        <div className="kpi"><span>{t('Demandes ouvertes')}</span><b>{I.demandes}</b><span>{I.demande ?? t('Aucune')}</span></div>
      </div>
      <div className="grille-2-1">
        <div className="po-colonne">
          {D.immeubles.map((b) => <section key={b.id} className="carte-l18" aria-label={b.adresse}>
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>{b.adresse}</h2><p className="gris texte-13" style={{ margin: 0 }}>{(b.logements?.length ?? 0) > 1 ? t('{n} logements', { n: b.logements?.length ?? 0 }) : t('{n} logement', { n: b.logements?.length ?? 0 })}{b.secteur ? ` · ${b.secteur}` : ''}</p></div></div>
            <table className="tableau tab-fixe" style={{ marginTop: 12 }}><colgroup><col style={{ width: '14%' }} /><col style={{ width: '36%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
              <thead><tr><th>{t('Logement')}</th><th>{t('Locataire')}</th><th>{t('Type')}</th><th className="droite">{t('Loyer')}</th><th>{t('Paiement')}</th></tr></thead>
              <tbody>{[...(b.logements ?? [])].sort((x, y) => x.numero.localeCompare(y.numero, locale, { numeric: true })).map((u) => <tr key={u.numero}><td className="fort">{u.numero}</td>
                <td>{u.tenant_id ? <Link href={`/clients/locataires/${u.tenant_id}`}>{u.locataire}</Link> : <span className="gris">{u.statut === 'occupied' ? '—' : t('Libre')}</span>}</td>
                <td>{u.type ?? '—'}</td><td className="droite">{u.loyer ? argent(u.loyer) : '—'}</td>
                <td>{!u.tenant_id ? <span className="gris">—</span> : u.retard ? <span className={`puce ${u.retard >= 30 ? 'todo' : 'attention'}`}>{t('En retard · {n} j', { n: u.retard })}</span> : <span className="puce info">{t('À jour')}</span>}</td></tr>)}
                {!b.logements?.length && <tr><td colSpan={5} className="gris">{t('Aucun logement saisi.')}</td></tr>}</tbody></table></section>)}
          {!D.immeubles.length && <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>{t('Aucun immeuble rattaché.')}</p></section>}
          <section className="carte-l18" aria-label={t('Relevés mensuels')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Relevés mensuels')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Émis le 5 avec la facture d’honoraires')}</p>
            <ul className="lo-docs">{D.releves.map((r) => <li key={r.numero}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span>
              <div><Link className="fort" href={`/finances/releves/${D.id}?m=${r.mois.slice(0, 7)}`}>{moisLib(r.mois)}</Link><span className="gris texte-13">{t('{num} · facture {fac} · {mt} · {etat}', { num: r.numero, fac: r.facture, mt: argent(Number(r.total)), etat: r.envoi === 'sent' && r.envoye_le ? t('envoyé le {d}', { d: jour(r.envoye_le) }) : r.envoi === 'failed' ? t('envoi échoué') : t('en file d’envoi') })}</span></div></li>)}
              {!D.releves.length && <li className="gris texte-13">{t('Aucun relevé émis.')}</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" id="propositions" aria-label={t('Candidats proposés')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Candidats proposés')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Proposés dans son portail · la décision et la raison lui sont montrées')}</p>
            <ul className="lo-docs">{propositions.map((c) => { const [lib, ton] = STATUTS_CAND[c.statut] ?? [c.statut, 'neutral'], ouvert = c.statut === 'proposee' || c.statut === 'verification';
              const creer = `/clients/locataires?nouveau=1&nom=${encodeURIComponent(c.candidat)}&courriel=${encodeURIComponent(c.courriel)}&telephone=${encodeURIComponent(c.telephone ?? '')}&logement=${c.unit_id}`;
              return <li key={c.id}><span className="a-faire-ic"><Icone nom="users" taille={18} couleur="#0C2147" /></span><div style={{ flex: 1 }}>
                <span className="tete-action"><strong>{c.candidat}</strong><span className={`puce ${ton}`}>{t(lib)}</span></span>
                <span className="gris texte-13">{c.logement} · {c.courriel}{c.telephone ? ` · ${c.telephone}` : ''} · {t('proposé le {d}', { d: jour(c.recue) })}{c.date ? ` · ${t('arrivée souhaitée le {d}', { d: jour(c.date) })}` : ''}</span>
                {c.note && <span className="texte-13">« {c.note} »</span>}
                {c.raison && <span className="gris texte-13">{t('Raison :')} {c.raison}</span>}
                {ouvert && refus?.id !== c.id && <span className="a-faire-actions" style={{ marginTop: 8 }}>
                  {c.statut === 'proposee' && <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_proposition_decider', { id: c.id, decision: 'verification' }, t('{nom} : vérifications en cours (le propriétaire est avisé).', { nom: c.candidat }))}>{t('Vérifications en cours')}</button>}
                  <button className="bouton bouton-contour" disabled={envoi} onClick={() => setRefus({ id: c.id, raison: '' })}>{t('Refuser')}</button>
                  <button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_proposition_decider', { id: c.id, decision: 'acceptee' }, t('{nom} est validé : créez sa fiche locataire, puis le bail.', { nom: c.candidat }))}>{t('Valider')}</button></span>}
                {refus?.id === c.id && <span style={{ display: 'block', marginTop: 8 }}><label className="fenetre-lib" htmlFor={`rf-${c.id}`}>{t('Raison montrée au propriétaire (10 caractères au moins)')}</label>
                  <textarea id={`rf-${c.id}`} className="e70-raison" rows={2} value={refus.raison} onChange={(e) => setRefus({ ...refus, raison: e.target.value })} />
                  <span className="a-faire-actions" style={{ marginTop: 8 }}><button className="bouton bouton-contour" onClick={() => setRefus(null)}>{t('Annuler')}</button>
                    <button className="bouton bouton-principal" disabled={envoi || refus.raison.trim().length < 10} onClick={async () => { if (await rpc('lanceur_proposition_decider', { id: c.id, decision: 'refusee', raison: refus.raison }, t('{nom} : non retenu, raison transmise.', { nom: c.candidat }))) setRefus(null); }}>{t('Refuser le candidat')}</button></span></span>}
                {c.statut === 'acceptee' && (c.tenant_id ? <Link className="lien" href={`/clients/locataires/${c.tenant_id}`}>{t('Voir sa fiche locataire')}</Link> : <Link className="lien" href={creer}>{t('Créer sa fiche locataire')}</Link>)}
              </div></li>; })}
              {!propositions.length && <li className="gris texte-13">{t('Aucun candidat proposé.')}</li>}</ul></section>
          <section className="carte-l18 e2" aria-label={t('Approbations')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Approbations en attente')}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Plafond du mandat : {m}', { m: argent(D.plafond ?? 500) })}</p>
            <ul className="lo-docs">{D.approbations.map((a) => <li key={a.id}><span className="a-faire-ic"><Icone nom="wrench" taille={18} couleur="#0C2147" /></span><div>
              <span className="tete-action"><strong>{a.quoi} · {argent(a.montant)}</strong><button className="lien" disabled={envoi} onClick={() => rpc('lanceur_relancer_proprietaire', { type: 'depense', id: a.id }, t('Relance envoyée dans son portail.'))}>{t('Relancer')}</button></span>
              <span className="gris texte-13">{a.fournisseur ? `${a.fournisseur} · ` : ''}{t('demandée le {d}', { d: jour(a.le) })}</span></div></li>)}
              {!D.approbations.length && <li className="gris texte-13">{t('Aucune décision attendue.')}</li>}</ul></section>
          <ModulesClient ownerId={D.id} peutEcrire />
          <section className="carte-l18" aria-label={t('Préférences de communication')}><h2 className="titre-carte">{t('Préférences de communication')}</h2>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="mail" taille={18} couleur="#0C2147" /></span><div><strong>{t('Courriel')}</strong><span className="gris texte-13">{D.consentements.courriel ? `${D.consentements.courriel.base === 'express' ? t('Consentement exprès') : t('Consentement tacite')} · ${jour(D.consentements.courriel.le)}` : t('Messages transactionnels seulement')}</span></div></li>
              <li><span className="a-faire-ic"><Icone nom="message" taille={18} couleur="#0C2147" /></span><div><strong>SMS</strong><span className="gris texte-13">{D.consentements.sms ? `${D.consentements.sms.base === 'express' ? t('Consentement exprès') : t('Consentement tacite')} · ${jour(D.consentements.sms.le)}` : t('Aucun consentement')}</span></div></li>
              <li><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>{t('Langue')}</strong><span className="gris texte-13">{D.langue === 'en' ? 'English' : 'Français'}</span></div></li></ul></section>
          <section className="carte-l18" aria-label={t('Documents')}><div className="tete-action"><h2 className="titre-carte">{t('Documents')}</h2><Link className="lien" href={`/clients/documents?proprietaire=${D.id}`}>{D.documents.nombre > 1 ? t('{n} documents', { n: D.documents.nombre }) : t('{n} document', { n: D.documents.nombre })}</Link></div>
            <ul className="lo-docs"><li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{D.documents.mandat?.titre ?? t('Mandat de gestion')}</strong><span className="gris texte-13">{D.documents.mandat ? t('Ajouté le {d}', { d: jour(D.documents.mandat.le) }) : t('Aucun mandat au dossier')}</span></div></li></ul></section>
          <section className="carte-l18" aria-label={t('Journal récent')}><h2 className="titre-carte">{t('Journal récent')}</h2>
            <ul className="lo-docs">{D.journal.map((j, k) => <li key={k}><div><strong>{ACTIONS[j.action] ? t(ACTIONS[j.action]) : j.action}</strong><span className="gris texte-13">{jour(j.le)}{j.qui ? ` · ${j.qui}` : ''}</span></div></li>)}
              {!D.journal.length && <li className="gris texte-13">{t('Rien d’inscrit.')}</li>}</ul></section>
        </div>
      </div>
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fp-t" onSubmit={async (e) => { e.preventDefault(); if (await rpc('lanceur_proprietaire_maj', { id: D.id, ...f }, t('Fiche mise à jour.'))) setEdit(false); }}>
          <header className="tiroir-tete"><h2 id="fp-t">{t('Modifier le propriétaire')}</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label={t('Fermer')}><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps"><div className="po-deux">{champ('nom', t('Nom'))}{champ('entreprise', t('Entreprise'))}{champ('courriel', t('Courriel'), 'email')}{champ('telephone', t('Téléphone'), 'tel')}</div>
            {champ('adresse', t('Adresse postale (Relevé 31)'))}
            <label className="fenetre-lib" htmlFor="fp-l">{t('Langue')}</label><select id="fp-l" className="e70-raison" value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={envoi || f.nom.trim().length < 2}>{t('Enregistrer')}</button></footer>
        </form></div>}
    </>
  );
}
