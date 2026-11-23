'use client';
/* Fidéicommis : ce qu'une personne décide (revue du 18 nov. 2026).
   - Répartir un dépôt : entre plusieurs baux, un apport du propriétaire, ou une somme reçue par erreur. La somme des parts égale le dépôt.
   - Versement retourné : le dépôt qui rend un versement envoyé recrédite le propriétaire.
   - Sommes en attente : excédents et sommes reçues par erreur. Décisions permises seulement : loyer ouvert du même bail, propriétaire
     du bail, rembourser (puis relier la sortie du relevé). Aucune ne touche l'argent d'un autre propriétaire. */
import { useCallback, useEffect, useState } from 'react';

type Faire = <T>(corps: Record<string, unknown>, message?: string | ((d: T) => string)) => Promise<T | null>;
type BailF = { lease_id: string; reference: string; locataire: string; loyer: number };
type Attente = { id: string; montant: number; motif: 'excedent' | 'erreur'; statut: 'en_attente' | 'a_rembourser'; note: string | null; created_at: string;
  bank_transactions: { transaction_date: string; description: string } | null; owners: { full_name: string } | null;
  leases: { tenants: { full_name: string } | null; units: { unit_number: string; reference_paiement: string } | null } | null };
type Sortie = { id: string; transaction_date: string; description: string; amount: number };
type Ligne = { id: string; montant: number; owners: { full_name: string } | null; fiducie_lots: { date_versement: string } };
type Donnees = { attentes: Attente[]; sorties: Sortie[]; lignes: Ligne[]; proprietaires: { id: string; full_name: string }[] };
const cents = (n: number) => Number(n).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

/** Panneau d'un dépôt à traiter : répartir, ou le relier à un versement retourné. */
export function Repartir({ depot, baux, faire, occupe, fini }: { depot: { id: string; amount: number; description: string }; baux: BailF[]; faire: Faire; occupe: boolean; fini: () => void }) {
  const [D, setD] = useState<Donnees | null>(null), [mode, setMode] = useState<'parts' | 'retour'>('parts'), [ligne, setLigne] = useState('');
  const [parts, setParts] = useState<{ type: 'bail' | 'apport' | 'erreur'; id: string; montant: string; note: string }[]>([{ type: 'bail', id: '', montant: String(depot.amount), note: '' }]);
  useEffect(() => { faire<Donnees>({ action: 'fiducie_attentes' }).then(setD); }, [faire]);
  const total = parts.reduce((s, p) => s + (Number(p.montant.replace(',', '.')) || 0), 0), reste = Math.round((depot.amount - total) * 100) / 100;
  const pret = parts.every((p) => Number(p.montant.replace(',', '.')) > 0 && (p.type === 'erreur' || p.id)) && reste === 0;
  const maj = (i: number, champ: Partial<(typeof parts)[number]>) => setParts(parts.map((p, k) => k === i ? { ...p, ...champ } : p));
  return (
    <div className="carte-l18 repartir" style={{ marginTop: 8, background: '#F7F9FB' }}>
      <div className="ligne-ic" style={{ gap: 16, marginBottom: 8 }}>
        <label className="case texte-13"><input type="radio" checked={mode === 'parts'} onChange={() => setMode('parts')} />Répartir le dépôt</label>
        <label className="case texte-13"><input type="radio" checked={mode === 'retour'} onChange={() => setMode('retour')} />C’est un versement retourné</label>
      </div>
      {mode === 'parts' ? <>
        {parts.map((p, i) => <div key={i} className="ligne-ic" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <select className="e70-raison" aria-label={`Type de la part ${i + 1}`} value={p.type} onChange={(e) => maj(i, { type: e.target.value as 'bail', id: '' })}>
            <option value="bail">Loyer d’un bail</option><option value="apport">Apport d’un propriétaire</option><option value="erreur">Reçu par erreur (à rendre)</option></select>
          {p.type === 'bail' && <select className="e70-raison" aria-label="Bail" style={{ minWidth: 220 }} value={p.id} onChange={(e) => maj(i, { id: e.target.value })}><option value="">Choisir le bail…</option>
            {baux.map((b) => <option key={b.lease_id} value={b.lease_id}>{b.reference} · {b.locataire} · {cents(b.loyer)}</option>)}</select>}
          {p.type === 'apport' && <select className="e70-raison" aria-label="Propriétaire" style={{ minWidth: 220 }} value={p.id} onChange={(e) => maj(i, { id: e.target.value })}><option value="">Choisir le propriétaire…</option>
            {(D?.proprietaires ?? []).map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}</select>}
          <input className="saisie" aria-label="Montant de la part" inputMode="decimal" style={{ width: 120 }} value={p.montant} onChange={(e) => maj(i, { montant: e.target.value })} />
          {p.type !== 'bail' && <input className="saisie" aria-label="Note" placeholder="Note (motif)" style={{ width: 200 }} value={p.note} onChange={(e) => maj(i, { note: e.target.value })} />}
          {parts.length > 1 && <button className="lien" onClick={() => setParts(parts.filter((_, k) => k !== i))}>Retirer</button>}
        </div>)}
        <p className="texte-13" style={{ margin: '6px 0' }}><button className="lien" onClick={() => setParts([...parts, { type: 'bail', id: '', montant: reste > 0 ? String(reste) : '', note: '' }])}>Ajouter une part</button>
          <span className={reste === 0 ? 'gris' : 'rouge-txt'}> · {reste === 0 ? 'les parts égalent le dépôt' : `reste à répartir : ${cents(reste)}`}</span></p>
        <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !pret} onClick={async () => {
          const r = await faire({ action: 'fiducie_repartir', transaction_id: depot.id, parts: parts.map((p) => ({ type: p.type, montant: Number(p.montant.replace(',', '.')),
            ...(p.type === 'bail' ? { lease_id: p.id } : p.type === 'apport' ? { owner_id: p.id, note: p.note } : { note: p.note }) })) }, 'Dépôt réparti.');
          if (r) fini(); }}>Répartir {cents(depot.amount)}</button>
      </> : <>
        <select className="e70-raison" aria-label="Versement retourné" style={{ minWidth: 320 }} value={ligne} onChange={(e) => setLigne(e.target.value)}><option value="">Choisir le versement envoyé…</option>
          {(D?.lignes ?? []).map((l) => <option key={l.id} value={l.id}>{l.fiducie_lots.date_versement} · {l.owners?.full_name ?? '—'} · {cents(l.montant)}</option>)}</select>
        <p className="gris texte-13" style={{ margin: '6px 0' }}>Le propriétaire est recrédité de {cents(depot.amount)}; ses coordonnées de versement sont à revoir avant le prochain versement.</p>
        <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} disabled={occupe || !ligne} onClick={async () => {
          if (await faire({ action: 'fiducie_retour_versement', transaction_id: depot.id, ligne_id: ligne }, 'Versement retourné : propriétaire recrédité.')) fini(); }}>Enregistrer le retour</button>
      </>}
    </div>
  );
}

/** Section « Sommes en attente de décision ». */
export function Attentes({ faire, occupe, version }: { faire: Faire; occupe: boolean; version: number }) {
  const [D, setD] = useState<Donnees | null>(null), [sortie, setSortie] = useState<Record<string, string>>({});
  const charger = useCallback(async () => setD(await faire<Donnees>({ action: 'fiducie_attentes' })), [faire]);
  useEffect(() => { charger(); }, [charger, version]);
  if (!D || !D.attentes.length) return null;
  const decider = async (a: Attente, decision: 'loyer' | 'proprietaire' | 'a_rembourser', message: string) => {
    const note = decision === 'a_rembourser' ? null : prompt('Note (pourquoi cette décision) :', '');
    if (note === null && decision !== 'a_rembourser') return;
    if (await faire({ action: 'fiducie_decider', attente_id: a.id, decision, note }, message)) charger();
  };
  return (
    <section className="carte-l18" aria-label="Sommes en attente de décision" style={{ marginTop: 16 }}>
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Sommes en attente de décision</h2>
      <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Elles sont dans le compte, mais au registre d’aucun propriétaire : elles ne partent pas au versement du 15.</p>
      <table className="tableau"><thead><tr><th>Reçu le</th><th>Origine</th><th className="droite">Montant</th><th>Décision</th></tr></thead>
        <tbody>{D.attentes.map((a) => { const t = a.bank_transactions, l = a.leases, compat = D.sorties.filter((s) => Math.round(-s.amount * 100) === Math.round(a.montant * 100));
          return <tr key={a.id}><td>{t?.transaction_date ?? '—'}</td>
            <td>{a.motif === 'excedent' ? <>Excédent · {l?.tenants?.full_name ?? '—'} ({l?.units?.reference_paiement ?? '?'}) · {a.owners?.full_name}</> : <>Reçu par erreur</>}
              <span className="sous gris">{t?.description}{a.note ? ` · ${a.note}` : ''}</span></td>
            <td className="droite fort">{cents(a.montant)}</td>
            <td>{a.statut === 'en_attente' ? <span className="ligne-ic" style={{ gap: 12, flexWrap: 'wrap' }}>
                {a.motif === 'excedent' && <button className="lien" disabled={occupe} onClick={() => decider(a, 'loyer', 'Appliqué au loyer ouvert.')}>Au prochain loyer</button>}
                {a.motif === 'excedent' && <button className="lien" disabled={occupe} onClick={() => decider(a, 'proprietaire', 'Versé au registre du propriétaire.')}>Au propriétaire</button>}
                <button className="lien" disabled={occupe} onClick={() => decider(a, 'a_rembourser', 'À rembourser : faites le virement, puis reliez la sortie du relevé.')}>Rembourser l’expéditeur</button></span>
              : <span className="ligne-ic" style={{ gap: 8, flexWrap: 'wrap' }}><span className="puce todo">À rembourser</span>
                {compat.length ? <><select className="e70-raison" aria-label="Sortie du relevé" value={sortie[a.id] ?? ''} onChange={(e) => setSortie({ ...sortie, [a.id]: e.target.value })}>
                  <option value="">Sortie du relevé…</option>{compat.map((s) => <option key={s.id} value={s.id}>{s.transaction_date} · {s.description} · {cents(s.amount)}</option>)}</select>
                  <button className="lien" disabled={occupe || !sortie[a.id]} onClick={async () => { if (await faire({ action: 'fiducie_lier_remboursement', attente_id: a.id, sortie_id: sortie[a.id] }, 'Remboursement relié.')) charger(); }}>Relier</button></>
                  : <span className="gris texte-13">en attente de la sortie de {cents(a.montant)} au relevé</span>}</span>}</td></tr>; })}</tbody></table>
    </section>
  );
}
