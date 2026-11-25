'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { CATALOGUE_SERVICES } from '@/lib/drapeaux';
import { useT } from '@/composants/Langue';
import { argentL } from '@/lib/format';

/* x13 · Réglages › Entreprise : identité et taxes (admin), honoraires datés (un nouveau taux s'ajoute à une date, jamais au passé), catalogue
   de services (maintenance). La règle du 13 oct. vit dans les honoraires : 6 % des loyers; travaux : rien jusqu'au seuil, au-delà le taux sur
   la facture complète avant taxes. */
type Ent = { legal_name: string | null; address: string | null; gst_number: string | null; qst_number: string | null; gst_rate: number; qst_rate: number; neq: string | null; phone_main: string | null; phone_emergency: string | null };
type Hon = { valid_from: string; gestion_pct: number; travaux_seuil: number; travaux_pct: number; source: string; valide: boolean; en_vigueur: boolean };
type Serv = { id: string; category: string; task_type: string; label: string; pricing_model: string; requires_rbq: boolean; fixed_owner_price: number | null; fixed_worker_pay: number | null; estimated_duration_minutes: number | null; urgent_eligible: boolean; active: boolean };
export type DonneesEntreprise = { admin: boolean; entreprise: Ent | null; honoraires: Hon[]; catalogue: Serv[] };
const CHAMPS: [keyof Ent, string][] = [['legal_name', 'Nom légal'], ['neq', 'NEQ'], ['address', 'Adresse'], ['gst_number', 'Numéro de TPS'], ['qst_number', 'Numéro de TVQ'], ['gst_rate', 'TPS (%)'], ['qst_rate', 'TVQ (%)'],
  ['phone_main', 'Téléphone principal'], ['phone_emergency', 'Ligne d’urgence 24/7']];
const TARIF: Record<string, string> = { forfait: 'Forfait', horaire: 'Horaire', diagnostic: 'Diagnostic' };

export function Entreprise({ donnees: D, erreurLecture }: { donnees: DonneesEntreprise | null; erreurLecture: string | null }) {
  const router = useRouter();
  const { t, locale } = useT();
  const argent = (n: number | null) => n == null ? '—' : argentL(n, locale, !Number.isInteger(n));
  const [edit, setEdit] = useState<Ent | null>(null), [hon, setHon] = useState<{ valid_from: string; gestion_pct: string; travaux_seuil: string; travaux_pct: string; source: string } | null>(null), [serv, setServ] = useState<Partial<Serv> | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau ? t(bandeau) : bandeau}</div>;
  async function rpc(f: string, p: object, msg: string) {
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc(f, { p });
    if (error) return setBandeau(error.message); setOk(msg); setEdit(null); setHon(null); setServ(null); router.refresh();
  }
  const E = D.entreprise;
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{t(bandeau)}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="po-fiche">
        <section className="carte-l18" aria-label={t('Entreprise')}><header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>{t('Identité et taxes')}</h2>
          {D.admin && <button className="lien" onClick={() => setEdit(E ?? ({ gst_rate: 5, qst_rate: 9.975 } as Ent))}>{t('Modifier')}</button>}</header>
          <dl className="lo-lignes">{CHAMPS.map(([k, l]) => <div key={k}><dt>{t(l)}</dt><dd>{E?.[k] == null || E[k] === '' ? <span className="rouge">{t('À inscrire')}</span> : (locale.startsWith('en') ? String(E[k]) : String(E[k]).replace('.', ','))}</dd></div>)}</dl>
          {!D.admin && <p className="gris texte-12">{t('Modification réservée à l’administration.')}</p>}</section>
        <section className="carte-l18" aria-label={t('Honoraires')}><header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>{t('Honoraires')}</h2>
          {D.admin && <button className="lien" onClick={() => setHon({ valid_from: new Date().toISOString().slice(0, 10), gestion_pct: '6', travaux_seuil: '1000', travaux_pct: '10', source: '' })}>{t('Nouveau taux à une date')}</button>}</header>
          <p className="gris texte-13">{t('Le taux en vigueur à la date du loyer ou de la facture s’applique; un taux ne change jamais le passé.')}</p>
          <ul className="planifier">{D.honoraires.map((h) => <li key={h.valid_from}><div><strong>{t('Depuis le {date}', { date: new Date(`${h.valid_from}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</strong>
            <span>{t('{gestion} % des loyers · travaux : rien jusqu’à {seuil}, au-delà {travaux} % avant taxes · {source}', { gestion: h.gestion_pct, seuil: argent(h.travaux_seuil), travaux: h.travaux_pct, source: h.source })}</span></div>
            <span className={`puce ${h.en_vigueur ? 'final' : 'neutral'}`}>{h.en_vigueur ? t('En vigueur') : new Date(`${h.valid_from}T12:00:00`) > new Date() ? t('À venir') : t('Remplacé')}</span></li>)}</ul></section>
      </div>
      {CATALOGUE_SERVICES && <><section className="carte-l18" id="catalogue" aria-label={t('Catalogue de services')}><header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>{t('Catalogue de services')}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{t('Travaux types, prix au propriétaire et paie du fournisseur')}</p></div>
        <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setServ({ pricing_model: 'forfait', active: true, urgent_eligible: true, requires_rbq: false })}><Icone nom="plus" taille={16} couleur="#0C2147" />{t('Ajouter un service')}</button></header>
        <table className="tableau"><thead><tr><th>{t('Service')}</th><th>{t('Tarification')}</th><th className="droite">{t('Prix propriétaire')}</th><th className="droite">{t('Paie fournisseur')}</th><th>RBQ</th><th>{t('Actif')}</th><th /></tr></thead>
          <tbody>{D.catalogue.map((c) => <tr key={c.id} className={c.active ? '' : 'gris'}><td><strong>{t(c.label)}</strong><span className="sous gris">{t(c.category)} · {c.task_type}</span></td><td>{t(TARIF[c.pricing_model] ?? c.pricing_model)}</td>
            <td className="droite">{argent(c.fixed_owner_price)}</td><td className="droite">{argent(c.fixed_worker_pay)}</td><td>{c.requires_rbq ? t('Oui') : '—'}</td><td>{c.active ? t('Oui') : t('Non')}</td>
            <td className="droite"><button className="lien" onClick={() => setServ(c)}>{t('Modifier')}</button></td></tr>)}
            {!D.catalogue.length && <tr><td colSpan={7} className="gris">{t('Aucun service au catalogue.')}</td></tr>}</tbody></table></section></>}

      {edit && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ent-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_entreprise_maj', edit, t('Fiche de l’entreprise enregistrée.')); }}>
          <div className="fenetre-tete"><h2 id="ent-t">{t('Identité et taxes')}</h2><button type="button" className="fermer" onClick={() => setEdit(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <div className="po-deux">{CHAMPS.map(([k, l]) => <div key={k}><label className="fenetre-lib" htmlFor={`ent-${k}`}>{t(l)}</label>
            <input id={`ent-${k}`} className="e70-raison" type={k.endsWith('rate') ? 'number' : 'text'} step="0.001" value={(edit[k] ?? '') as string} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>)}</div>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(null)}>{t('Annuler')}</button><button className="bouton bouton-principal">{t('Enregistrer')}</button></div>
        </form></div>}
      {hon && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setHon(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="hon-t" style={{ marginTop: 100 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_honoraires_ajouter', hon, t('Nouveau taux enregistré.')); }}>
          <div className="fenetre-tete"><h2 id="hon-t">{t('Nouveau taux d’honoraires')}</h2><button type="button" className="fermer" onClick={() => setHon(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">{t('S’applique aux loyers et aux factures datés de ce jour ou après. Les relevés déjà émis ne changent pas.')}</p>
          <div className="po-deux">{([['valid_from', 'À partir du', 'date'], ['gestion_pct', 'Gestion (% des loyers)', 'number'], ['travaux_seuil', 'Seuil des travaux ($)', 'number'], ['travaux_pct', 'Travaux (% avant taxes)', 'number']] as const).map(([k, l, ty]) =>
            <div key={k}><label className="fenetre-lib" htmlFor={`hon-${k}`}>{t(l)}</label><input id={`hon-${k}`} className="e70-raison" type={ty} step="0.01" value={hon[k]} onChange={(e) => setHon({ ...hon, [k]: e.target.value })} /></div>)}</div>
          <label className="fenetre-lib" htmlFor="hon-s">{t('Source de la décision')}</label><input id="hon-s" className="e70-raison" value={hon.source} onChange={(e) => setHon({ ...hon, source: e.target.value })} placeholder={t('Ex. : décision de Steven du 1er déc. 2026')} />
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setHon(null)}>{t('Annuler')}</button><button className="bouton bouton-principal" disabled={hon.source.trim().length < 5}>{t('Enregistrer le taux')}</button></div>
        </form></div>}
      {serv && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setServ(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="srv-t" style={{ marginTop: 80 }} onSubmit={(e) => { e.preventDefault(); rpc('lanceur_catalogue_maj', serv, t('Service enregistré.')); }}>
          <div className="fenetre-tete"><h2 id="srv-t">{serv.id ? t('Modifier le service') : t('Ajouter un service')}</h2><button type="button" className="fermer" onClick={() => setServ(null)} aria-label={t('Fermer')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <div className="po-deux">{([['label', 'Service', 'text'], ['category', 'Catégorie', 'text'], ['task_type', 'Type de tâche (unique)', 'text'], ['estimated_duration_minutes', 'Durée (minutes)', 'number'],
            ['fixed_owner_price', 'Prix propriétaire ($)', 'number'], ['fixed_worker_pay', 'Paie fournisseur ($)', 'number']] as const).map(([k, l, ty]) =>
            <div key={k}><label className="fenetre-lib" htmlFor={`srv-${k}`}>{t(l)}</label><input id={`srv-${k}`} className="e70-raison" type={ty} value={(serv[k] ?? '') as string | number} onChange={(e) => setServ({ ...serv, [k]: e.target.value })} /></div>)}
            <div><label className="fenetre-lib" htmlFor="srv-p">{t('Tarification')}</label><select id="srv-p" className="e70-raison" value={serv.pricing_model} onChange={(e) => setServ({ ...serv, pricing_model: e.target.value })}>{Object.entries(TARIF).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div></div>
          {([['requires_rbq', 'Licence RBQ requise'], ['urgent_eligible', 'Admissible en urgence'], ['active', 'Actif']] as const).map(([k, l]) =>
            <label key={k} className="case"><input type="checkbox" checked={!!serv[k]} onChange={(e) => setServ({ ...serv, [k]: e.target.checked })} />{t(l)}</label>)}
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setServ(null)}>{t('Annuler')}</button><button className="bouton bouton-principal">{t('Enregistrer')}</button></div>
        </form></div>}
    </>
  );
}
