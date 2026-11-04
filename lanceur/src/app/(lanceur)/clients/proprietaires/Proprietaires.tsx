'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { jourCourt } from '@/lib/format';
const depuis = (iso: string) => Date.now() - new Date(iso).getTime() < 365 * 864e5 ? `depuis le ${new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}` : `depuis ${new Date(iso).getFullYear()}`;

/* e19 · Propriétaires : décisions attendues d'abord; loyers payés chez eux ce mois-ci (suivis par Lease Lane; jamais « encaissés » ni « versés »);
   approbations à relancer; relevés du mois précédent émis le 5. */
type Pro = { id: string; nom: string; entreprise: string | null; depuis: string; immeubles: number; portes: number; quartiers: string | null; payes_mois: number; loyers_payes: number; loyers: number; portail: string; approbations: number };
type Appro = { type: string; id: string; owner_id: string; proprietaire: string; quoi: string; demande_le: string | null; echeance?: string; recue?: string };
export type DonneesProprios = { proprietaires: Pro[]; quartiers: string[]; approbations: Appro[]; seuil: number; releves: { mois: string; emis: number; attendus: number; a_verifier: { owner_id: string; proprietaire: string; raison: string }[] } };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const jour = jourCourt;
const PORTAIL: Record<string, [string, string]> = { actif: ['Actif', 'ok'], invite: ['Invitation envoyée', 'att'], aucun: ['Sans portail', 'off'] };

export function Proprietaires({ donnees: D, filtres, maintenant, erreurLecture, peutSupprimer = false }: { donnees: DonneesProprios | null; filtres: Record<string, string | undefined>; maintenant: string; erreurLecture: string | null; peutSupprimer?: boolean }) {
  const router = useRouter();
  const [supprimer, setSupprimer] = useState<Pro | null>(null), [q, setQ] = useState(filtres.q ?? ''), [tous, setTous] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const aller = (k: string, v: string) => { const s = new URLSearchParams(Object.entries({ ...filtres, [k]: v }).filter(([, x]) => x) as [string, string][]); router.push(`/clients/proprietaires?${s}`); };
  async function relancer(a: Appro) {
    const { error } = await supabaseNavigateur().rpc('lanceur_relancer_proprietaire', { p: { type: a.type, id: a.id } });
    if (error) return setBandeau(error.message); setOk(`Relance envoyée à ${a.proprietaire} dans son portail.`);
  }
  const P = tous ? D.proprietaires : D.proprietaires.slice(0, 8), T = D.proprietaires.reduce((s, p) => ({ imm: s.imm + p.immeubles, portes: s.portes + p.portes }), { imm: 0, portes: 0 });
  const moisLib = new Date(`${D.releves.mois.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <div className="filtres-ligne">
            <form className="lo-recherche" style={{ maxWidth: 300 }} onSubmit={(e) => { e.preventDefault(); aller('q', q); }}><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un propriétaire" aria-label="Rechercher un propriétaire" /></form>
            <select className="e70-raison filtre" value={filtres.quartier ?? ''} onChange={(e) => aller('quartier', e.target.value)} aria-label="Quartier"><option value="">Quartier : tous</option>{D.quartiers.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="e70-raison filtre" value={filtres.portail ?? ''} onChange={(e) => aller('portail', e.target.value)} aria-label="Portail"><option value="">Portail : tous</option><option value="actif">Portail actif</option><option value="aucun">Sans portail</option></select>
          </div>
          <section className="carte-l18" aria-label="Propriétaires"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Propriétaires</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.proprietaires.length} clients · {T.imm} immeubles · {T.portes} logements · décisions attendues d’abord</p>
            <table className="tableau tab-fixe"><colgroup><col style={{ width: peutSupprimer ? '28%' : '30%' }} /><col style={{ width: peutSupprimer ? '22%' : '24%' }} /><col style={{ width: '18%' }} /><col style={{ width: peutSupprimer ? '15%' : '16%' }} /><col />{peutSupprimer && <col style={{ width: 56 }} />}</colgroup>
              <thead><tr><th>Propriétaire</th><th>Immeubles · portes</th><th className="droite">Revenus du mois</th><th>Portail</th><th>Approbations</th>{peutSupprimer && <th><span className="sr">Supprimer</span></th>}</tr></thead>
              <tbody>{P.map((p) => { const [l, t] = PORTAIL[p.portail] ?? PORTAIL.aucun;
                return <tr key={p.id} className="ligne-lien" onClick={() => router.push(`/clients/proprietaires/${p.id}`)}>
                  <td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(p.entreprise ?? p.nom)}</span><span><Link className="fort" href={`/clients/proprietaires/${p.id}`} onClick={(e) => e.stopPropagation()}>{p.entreprise ?? p.nom}</Link>
                    <span className="sous gris">{depuis(p.depuis)}{p.entreprise ? ` · ${p.nom}` : ''}</span></span></span></td>
                  <td>{p.immeubles} immeuble{p.immeubles > 1 ? 's' : ''} · {p.portes} porte{p.portes > 1 ? 's' : ''}<span className="sous gris">{p.quartiers ?? '—'}</span></td>
                  <td className="droite"><b>{argent(p.payes_mois)}</b><span className={`sous ${p.loyers_payes < p.loyers ? 'fort' : 'gris'}`}>{p.loyers_payes} loyer{p.loyers_payes > 1 ? 's' : ''} sur {p.loyers}</span></td>
                  <td><span className="ligne-ic"><i className={`point-etat ${t}`} />{l}</span></td><td>{p.approbations ? <span className="compte">{p.approbations}</span> : <span className="gris">—</span>}</td>
                  {peutSupprimer && <td><button className="haut-ibtn" title={`Supprimer ${p.entreprise ?? p.nom}`} aria-label={`Supprimer ${p.entreprise ?? p.nom}`} onClick={(e) => { e.stopPropagation(); setSupprimer(p); }}>
                    <Icone nom="trash" taille={18} couleur="#9B2E28" /></button></td>}</tr>; })}
                {!D.proprietaires.length && <tr><td colSpan={peutSupprimer ? 6 : 5} className="gris">Aucun propriétaire. Convertissez un deal.</td></tr>}</tbody></table>
            {D.proprietaires.length > 8 && !tous && <button className="lien" onClick={() => setTous(true)}>Afficher les {D.proprietaires.length - 8} autres propriétaires</button>}
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Approbations en attente"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Approbations en attente</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.approbations.length} décision{D.approbations.length > 1 ? 's' : ''} de propriétaires</p>
            <ul className="lo-docs">{D.approbations.map((a) => { const total = a.echeance && a.recue ? (new Date(a.echeance).getTime() - new Date(a.recue).getTime()) / 864e5 : 0, fait = a.recue ? (new Date(maintenant).getTime() - new Date(a.recue).getTime()) / 864e5 : 0;
              return <li key={a.id}><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(a.proprietaire)}</span><div><span className="tete-action"><strong>{a.proprietaire}</strong><button className="lien" onClick={() => relancer(a)}>Relancer</button></span>
                <span className="gris texte-13">{a.quoi}</span>
                {a.echeance ? <span className="ligne-ic gris texte-13"><span className="jauge" style={{ width: 72 }}><i style={{ width: `${Math.min(100, (100 * fait) / Math.max(1, total))}%` }} /></span>Jour {Math.ceil(fait)} sur {Math.round(total)} · réponse due le {jour(a.echeance)}</span>
                  : a.demande_le && <span className="gris texte-13">Demandée le {jour(a.demande_le)}</span>}</div></li>; })}
              {!D.approbations.length && <li className="gris texte-13">Aucune décision attendue.</li>}</ul>
            <p className="ligne-ic gris texte-12"><Icone nom="info" taille={14} couleur="#58697F" />Au-delà du plafond du mandat, l’accord du propriétaire est requis.</p></section>
          <section className="carte-l18" aria-label="Relevés du mois"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Relevés de {moisLib}</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Émis le 5 · portail et courriel</p>
            <p className="tete-action" style={{ margin: 0 }}><span><b style={{ fontSize: 24 }}>{D.releves.emis}</b> <span className="gris">émis sur {D.releves.attendus}</span></span>{!!D.releves.a_verifier.length && <b>{D.releves.a_verifier.length} à vérifier</b>}</p>
            <span className="jauge large" style={{ margin: '12px 0' }}><i style={{ width: `${(100 * D.releves.emis) / Math.max(1, D.releves.attendus)}%` }} /></span>
            <ul className="lo-docs">{D.releves.a_verifier.slice(0, 3).map((r) => <li key={r.owner_id}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span><div><strong>{r.proprietaire}</strong><span className="gris texte-13">{r.raison}</span></div></li>)}</ul>
            <Link className="bouton bouton-contour" href={`/finances/releves?m=${D.releves.mois.slice(0, 7)}`}><Icone nom="check" taille={16} couleur="#0C2147" />Vérifier les relevés</Link></section>
        </div>
      </div>
      {supprimer && <SupprimerProprio p={supprimer} fermer={() => setSupprimer(null)} fait={(m) => { setSupprimer(null); setBandeau(null); setOk(m); router.refresh(); }} />}
    </>
  );
}

// Suppression d'un propriétaire (administrateur) : on tape son nom pour confirmer. La base refuse s'il a des mouvements au fidéicommis.
function SupprimerProprio({ p, fermer, fait }: { p: Pro; fermer: () => void; fait: (message: string) => void }) {
  const nom = p.entreprise ?? p.nom;
  const [saisie, setSaisie] = useState(''), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_proprietaire_supprimer', { p: { id: p.id, confirmation: saisie } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    const r = data as { immeubles: number; logements: number; locataires: number };
    fait(`${nom} est supprimé, avec ${r.immeubles} immeuble${r.immeubles > 1 ? 's' : ''}, ${r.logements} logement${r.logements > 1 ? 's' : ''} et ${r.locataires} locataire${r.locataires > 1 ? 's' : ''} sans autre bail.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="sup-t" style={{ marginTop: 120, width: 'min(520px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="sup-t">Supprimer {nom} ?</h2><button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Part définitivement avec ce propriétaire : {p.immeubles} immeuble{p.immeubles > 1 ? 's' : ''}, {p.portes} logement{p.portes > 1 ? 's' : ''}, leurs baux, loyers, factures,
          documents et visites, et ses locataires qui n’ont aucun autre bail. Pour les comptes d’essai seulement : un client qui a des mouvements au compte en fidéicommis ne peut pas être supprimé.</p>
        <label className="fenetre-lib" htmlFor="sup-n">Tapez <b>{nom}</b> pour confirmer</label>
        <input id="sup-n" className="e70-raison" autoComplete="off" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-danger" disabled={envoi || saisie.trim().toLowerCase() !== nom.trim().toLowerCase()}>{envoi ? 'Suppression…' : 'Supprimer définitivement'}</button></div>
      </form>
    </div>
  );
}
