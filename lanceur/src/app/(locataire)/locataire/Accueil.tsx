'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { heureQc } from '@/composants/portail/dates';
import { BandeauLocataire, useLocataire } from '@/composants/portail/CoquilleLocataire';
import { fenetreAvis } from '@/composants/portail/format';

/* Locataire · 01 Accueil : parcours du mois, intervention à confirmer, prochain loyer, demande en cours, bail, gestionnaire,
   raccourcis, 4 indicateurs, loyer comparé au marché. « À confirmer » en puce marine (D3); vouvoiement; dates « 1er » (D13). */
export type AccueilLoc = {
  logement: string | null; bail: { debut: string; fin: string | null; loyer: number; statut: string; fenetre: string | null } | null;
  prochain_loyer: { montant: number; echeance: string; en_retard: boolean; prelevement: boolean } | null;
  a_confirmer: { id: string; quand: string; qui: string | null; quoi: string; numero: string }[];
  demande: { id: string; titre: string; cree: string; etape: number } | null;
  parcours: { date: string; type: string; titre: string; sous: string; fait: boolean }[];
  gestionnaire: { nom: string; initiales: string; courriel: string } | null;
  indicateurs: { paye_annee: number; loyers_payes: number; prevu_annee: number; ponctualite: boolean[]; reponse_min: number | null; reglees_h: number | null };
  loyers: { debut: string; loyer: number }[]; marche: number | null;
};
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;
const jour = (iso: string) => { const x = new Date(`${iso.slice(0, 10)}T12:00:00`); const j = x.getDate(); return `${j === 1 ? '1er' : j} ${x.toLocaleDateString('fr-CA', { month: 'short' })}`; };
const jourLong = (iso: string) => { const x = new Date(`${iso.slice(0, 10)}T12:00:00`); const j = x.getDate(); return `${j === 1 ? '1er' : j} ${x.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`; };
const ETAPES = ['Signalée', 'Qualifiée', 'Assignée', 'Visite', 'Fermée'];
const ICONE_PARCOURS: Record<string, string> = { loyer: 'card', demande: 'wrench', intervention: 'calendar' };

export function Accueil({ prenom, maintenant, donnees, erreur }: { prenom: string; maintenant: string; donnees: AccueilLoc | null; erreur: string | null }) {
  const router = useRouter(), { pastilles } = useLocataire();
  const [envoi, setEnvoi] = useState(false), [toast, setToast] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  const auj = new Date(maintenant);   // une seule « maintenant », celle du serveur : aucun écart à l'hydratation
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert" style={{ margin: 24 }}>{erreur ?? 'Votre accueil n’a pas pu être lu.'}</div>;
  const D = donnees, I = D.indicateurs, c = D.a_confirmer[0];
  // Parcours : du 1er du mois à environ 6 semaines; position proportionnelle à la date.
  const debut = new Date(auj.getFullYear(), auj.getMonth(), 1), fin = new Date(auj.getFullYear(), auj.getMonth() + 1, 15), duree = fin.getTime() - debut.getTime();
  const pos = (iso: string) => Math.min(100, Math.max(0, (100 * (new Date(`${iso.slice(0, 10)}T12:00:00`).getTime() - debut.getTime())) / duree));
  const jalons = D.parcours.filter((e) => pos(e.date) < 100);
  // Deux jalons trop proches : on garde le libellé du plus récent (le premier reste lisible au survol).
  const muets = new Set(jalons.map((e, k) => (k + 1 < jalons.length && pos(jalons[k + 1].date) - pos(e.date) < 9 ? k : -1)).filter((k) => k >= 0));
  const bail = D.bail, moisBail = bail?.fin ? Math.max(1, Math.round((new Date(bail.fin).getTime() - new Date(bail.debut).getTime()) / (30.44 * 864e5))) : null;
  const moisFaits = bail ? Math.max(0, Math.round((auj.getTime() - new Date(bail.debut).getTime()) / (30.44 * 864e5))) : 0;
  const restants = bail?.fin ? Math.max(0, Math.round((new Date(bail.fin).getTime() - auj.getTime()) / 864e5)) : null;
  const fen = fenetreAvis(bail?.fenetre);

  async function confirmer(choix: 'present' | 'acces') {
    if (!c) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_confirmer_intervention', { p: { id: c.id, choix } });
    setEnvoi(false); if (error) { setBandeau(error.message); return; }
    setToast(choix === 'present' ? 'C’est noté : vous serez présent.' : 'C’est noté : l’accès est autorisé en votre absence.'); router.refresh();
  }

  return (
    <>
      <BandeauLocataire bas surtitre={auj.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' })} titre={`Bonjour, ${prenom}`}
        sous={c ? 'Une seule chose demande votre attention cette semaine.' : 'Rien ne demande votre attention cette semaine.'}>
        <div className="lo-parcours">
          <p className="lo-parcours-titre">Mon parcours · {auj.toLocaleDateString('fr-CA', { month: 'long' })} à {fin.toLocaleDateString('fr-CA', { month: 'long' })}</p>
          <div className="lo-ligne"><i className="lo-fait" style={{ width: `${pos(auj.toISOString())}%` }} /><span className="lo-auj" style={{ left: `${pos(auj.toISOString())}%` }}>Aujourd’hui</span>
            {jalons.map((e, k) => <div key={k} className={`lo-jalon ${e.fait ? 'fait' : ''} ${e.type} ${muets.has(k) ? 'muet' : ''}`} title={muets.has(k) ? `${e.titre} · ${e.sous}` : undefined} style={{ left: `${pos(e.date)}%` }}>
              <span className="lo-pastille">{e.fait && e.type === 'loyer' ? <Icone nom="check" taille={14} couleur="#0C2147" trait={2.6} /> : <Icone nom={ICONE_PARCOURS[e.type] ?? 'calendar'} taille={14} couleur="#fff" />}</span>
              <small>{jour(e.date)}</small><strong>{e.titre}</strong><span>{e.sous}</span></div>)}</div>
        </div>
      </BandeauLocataire>

      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-grille lo-remonte">
        <section className="carte-l18 e2 lo-action" aria-label="À confirmer">
          {c ? <><span className="a-faire-ic"><Icone nom="calendar" taille={20} couleur="#0C2147" /></span>
              <div><p><span className="puce action">À confirmer</span><span className="gris texte-13"> {new Date(c.quand).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })} · {heureQc(c.quand)}</span></p>
                <strong>{c.qui ?? 'Le fournisseur'} passe {new Date(c.quand).toLocaleDateString('fr-CA', { weekday: 'long' })}</strong><span className="gris texte-13">{c.quoi} · {c.numero}</span></div>
              <div className="a-faire-actions"><button className="bouton bouton-principal" disabled={envoi} onClick={() => confirmer('present')}>Je serai présent</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => confirmer('acces')}>Autoriser l’accès</button></div></>
            : <p className="ligne-ic" style={{ margin: 0 }}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Aucune intervention à confirmer.</p>}
        </section>
        <section className="carte-l18 e2" aria-label="Prochain loyer">
          {D.prochain_loyer ? <><header className="tete-action"><span className="texte-13 fort">Prochain loyer</span><span className={`puce ${D.prochain_loyer.en_retard ? 'todo' : 'ok'}`}>{D.prochain_loyer.en_retard ? 'En retard' : 'À jour'}</span></header>
              <p className="lo-montant"><b>{argent(D.prochain_loyer.montant)}</b><span>{D.prochain_loyer.en_retard ? `dû depuis le ${jour(D.prochain_loyer.echeance)}` : `dans ${Math.max(0, Math.round((new Date(`${D.prochain_loyer.echeance}T12:00:00`).getTime() - auj.getTime()) / 864e5))} jours`}</span></p>
              <p className="gris texte-13" style={{ margin: 0 }}>{D.prochain_loyer.en_retard ? 'à payer au propriétaire · une entente reste possible' : `le ${jour(D.prochain_loyer.echeance)} · ${D.prochain_loyer.prelevement ? 'prélèvement automatique' : 'à payer au propriétaire'}`}</p></>
            : <p className="gris texte-13" style={{ margin: 0 }}>Aucun loyer à venir.</p>}
        </section>
      </div>

      <div className="lo-grille trois">
        <section className="carte-l18" aria-label="Demande en cours">
          <header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>Demande en cours</h2>{D.demande && <span className="puce">{ETAPES[D.demande.etape]}</span>}</header>
          {D.demande ? <><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>{D.demande.titre}</p>
              <ol className="lo-etapes">{ETAPES.map((e, i) => <li key={e} className={i < D.demande!.etape ? 'fait' : i === D.demande!.etape ? 'actuel' : ''}><i /><strong>{e}</strong></li>)}</ol>
              <Link className="lien ligne-ic" style={{ marginTop: 16 }} href={`/locataire/demandes?d=${D.demande.id}`}>Ouvrir le dossier<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link></>
            : <p className="gris texte-13">Aucune demande en cours.</p>}
        </section>
        <section className="carte-l18" aria-label="Mon bail">
          <header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>Mon bail</h2>{bail && <span className="puce ok">{bail.statut === 'active' ? 'Actif' : 'Terminé'}</span>}</header>
          {bail ? <><p className="gris texte-13" style={{ margin: '4px 0 20px' }}>{moisBail ? `Mois ${Math.min(moisFaits + 1, moisBail)} sur ${moisBail} · ${restants} jours restants` : 'Bail sans date de fin'}</p>
              {bail.fin && <div className="lo-bail"><span className="jauge large"><i style={{ width: `${Math.min(100, (100 * moisFaits) / (moisBail ?? 12))}%` }} /></span>
                <div className="lo-bail-dates"><span>{jourLong(bail.debut)}</span><span>{jourLong(bail.fin)}</span></div></div>}
              {fen && <p className="texte-13" style={{ margin: '12px 0 0' }}>Avis de renouvellement du {jour(fen[0])} au {jour(fen[1])}</p>}</>
            : <p className="gris texte-13">Aucun bail actif.</p>}
        </section>
        <section className="carte-l18" aria-label="Votre gestionnaire">
          {D.gestionnaire ? <><div className="personne-ligne"><span className="ini" style={{ width: 56, height: 56, fontSize: 16 }}>{D.gestionnaire.initiales}</span><div><strong style={{ fontSize: 16 }}>{D.gestionnaire.nom}</strong><span className="gris">Votre gestionnaire</span></div></div>
              {pastilles?.contact?.telephone ? <p className="ligne-ic" style={{ margin: '16px 0 0' }}><Icone nom="phone" taille={16} couleur="#3E4A59" />{pastilles.contact.telephone}</p>
                : <p className="ligne-ic" style={{ margin: '16px 0 0' }}><Icone nom="mail" taille={16} couleur="#3E4A59" />{D.gestionnaire.courriel}</p>}
              <p className="ligne-ic" style={{ margin: '8px 0 16px' }}><Icone nom="clock" taille={16} couleur="#3E4A59" />Lun.–ven., 8 h à 17 h</p>
              <p className="a-faire-actions" style={{ margin: 0 }}><Link className="bouton bouton-contour" style={{ width: 'auto', display: 'inline-flex', padding: '0 20px', alignItems: 'center' }} href="/locataire/messages?nouveau=1">Écrire à {D.gestionnaire.nom.split(' ')[0]}</Link>
                {pastilles?.contact?.telephone && <a className="lien" href={`tel:+1${pastilles.contact.telephone.replace(/,.*$/, '').replace(/\D/g, '').slice(-10)}`}>Appeler</a>}</p></>
            : <p className="gris texte-13">Votre gestionnaire vous sera présentée bientôt.</p>}
        </section>
      </div>

      <div className="lo-grille trois">{[['plus', 'Nouvelle demande', 'Photo ou vidéo, 2 min', '/locataire/demandes/nouvelle'], ['receipt', 'Mes reçus', 'Reçus de loyer', '/locataire/paiements'], ['file', 'Documents', 'Bail et annexes', '/locataire/documents']].map(([ic, t, s, h]) =>
        <Link key={t} href={h} className="carte-l18 lo-raccourci"><span className="a-faire-ic"><Icone nom={ic} taille={20} couleur="#0C2147" /></span><div><strong>{t}</strong><span className="gris texte-13">{s}</span></div><Icone nom="chevron" taille={18} couleur="#8A99AB" /></Link>)}</div>

      <div className="po-section"><div><h2>Mes indicateurs</h2><p>Vos chiffres clés, mis à jour chaque jour</p></div></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Payé en {auj.getFullYear()}</span><b>{argent(I.paye_annee)}</b><small>{I.loyers_payes} loyer{I.loyers_payes > 1 ? 's' : ''} sur 12</small>
          <span className="jauge large"><i style={{ width: `${Math.min(100, (100 * I.paye_annee) / Math.max(1, I.prevu_annee))}%` }} /></span><small>{argent(I.prevu_annee)} prévus</small></div>
        <div className="carte-l18 kpi-po"><span>Ponctualité</span><b>{I.ponctualite.filter(Boolean).length} sur {I.ponctualite.length || 12}</b><small>Loyers payés à temps</small>
          <span className="lo-ponct">{[...I.ponctualite].reverse().map((ok, k) => <i key={k} className={ok ? 'ok' : 'retard'}><Icone nom={ok ? 'check' : 'alert'} taille={12} couleur={ok ? '#12694F' : '#fff'} trait={2.4} /></i>)}</span></div>
        <div className="carte-l18 kpi-po"><span>Délai de réponse</span><b>{I.reponse_min == null ? '—' : I.reponse_min < 120 ? `${I.reponse_min} min` : `${Math.round(I.reponse_min / 60)} h`}</b><small>Réponse de l’équipe à vos demandes (médiane)</small></div>
        <div className="carte-l18 kpi-po"><span>Demandes réglées</span><b>{I.reglees_h == null ? '—' : `${I.reglees_h} h`}</b><small>en moyenne · promesse 48 h</small>
          {I.reglees_h != null && <span className="jauge large"><i style={{ width: `${Math.min(100, (100 * I.reglees_h) / 48)}%` }} /></span>}</div>
      </div>

      {D.loyers.length > 0 && <section className="carte-l18" aria-label="Mon loyer">
        <h2 className="titre-carte" style={{ margin: 0 }}>Mon loyer depuis {new Date(D.loyers[0].debut).getFullYear()}</h2>
        <p className="gris texte-13" style={{ margin: '4px 0 16px' }}>{D.marche ? `Comparé au marché · ${D.logement ?? ''}` : 'Historique de vos baux'}</p>
        <Escalier loyers={D.loyers} marche={D.marche} fin={bail?.fin ?? null} maintenant={auj.getTime()} />
        {D.marche && bail && <p className="puce" style={{ marginTop: 16 }}>{bail.loyer <= D.marche ? `${argent(D.marche - bail.loyer)} par mois sous le marché (${argent(D.marche)})` : `${argent(bail.loyer - D.marche)} par mois au-dessus du marché (${argent(D.marche)})`}</p>}
      </section>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

// Loyer en marches depuis le premier bail, marché en ligne de repère, « Aujourd’hui » en pointillé.
function Escalier({ loyers, marche, fin, maintenant }: { loyers: { debut: string; loyer: number }[]; marche: number | null; fin: string | null; maintenant: number }) {
  const W = 1000, H = 150, t0 = new Date(loyers[0].debut).getTime(), t1 = new Date(fin ?? maintenant + 180 * 864e5).getTime();
  const vals = [...loyers.map((l) => l.loyer), ...(marche ? [marche] : [])], lo = Math.min(...vals) * 0.97, hi = Math.max(...vals) * 1.02;
  const x = (t: number) => (W * (t - t0)) / Math.max(1, t1 - t0), y = (v: number) => H - (H * (v - lo)) / Math.max(1, hi - lo);
  const pts = loyers.map((l, i) => { const a = x(new Date(l.debut).getTime()), b = i + 1 < loyers.length ? x(new Date(loyers[i + 1].debut).getTime()) : W; return `M${a} ${y(l.loyer)}H${b}`; }).join('')
    + loyers.slice(1).map((l, i) => `M${x(new Date(l.debut).getTime())} ${y(loyers[i].loyer)}V${y(l.loyer)}`).join('');
  return (
    <svg className="lo-escalier" viewBox={`0 -20 ${W} ${H + 40}`} preserveAspectRatio="none" role="img" aria-label="Loyer comparé au marché">
      {marche && <><line x1="0" x2={W} y1={y(marche)} y2={y(marche)} stroke="#8A99AB" strokeWidth="2" vectorEffect="non-scaling-stroke" /><text x={W} y={y(marche) - 6} textAnchor="end" className="lo-esc-txt">Marché : {argent(marche)}</text></>}
      <path d={pts} stroke="#4581CB" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
      {loyers.map((l) => <circle key={l.debut} cx={x(new Date(l.debut).getTime())} cy={y(l.loyer)} r="4" fill="#4581CB" />)}
      <text x={W} y={y(loyers[loyers.length - 1].loyer) + 18} textAnchor="end" className="lo-esc-txt fort">{argent(loyers[loyers.length - 1].loyer)}</text>
      <line x1={x(maintenant)} x2={x(maintenant)} y1="-10" y2={H + 10} stroke="#58697F" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
