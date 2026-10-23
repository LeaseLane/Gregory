'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e38 · Nouveau bon de travail (tiroir de 600 px) : demande liée, logement, travaux, mode (assigner ou demander des soumissions), fournisseurs invités, budget
   avec la référence du catalogue, accès au logement. Un fournisseur sans assurance valide (ou sans licence RBQ requise) n'est pas proposé. */
type Ctx = { demandes: { id: string; numero: string; titre: string; unit_id: string; logement: string; urgence: string; cout_min: number | null; cout_max: number | null; metier: string | null }[];
  logements: { id: string; libelle: string; locataire: string | null; plafond: number }[]; fournisseurs: { id: string; nom: string; specialites: string[]; zones: string[]; note: number | null; conformite: string | null }[];
  catalogue: { id: string; libelle: string; categorie: string; reference: number | null }[] };

export function NouveauBon({ ouvrir = false, demande, fournisseur }: { ouvrir?: boolean; demande?: string; fournisseur?: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(ouvrir), [ctx, setCtx] = useState<Ctx | null>(null), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const [avis, setAvis] = useState<{ locataire: string | null; creneau: string; urgent: boolean; on: boolean } | null>(null), [suggeres, setSuggeres] = useState<string[]>([]);
  const [f, setF] = useState({ service_request_id: demande ?? '', unit_id: '', travaux: '', mode: fournisseur ? 'soumissions' : 'assigner', worker_id: '', invites: fournisseur ? [fournisseur] : [] as string[],
    budget: '', service_catalog_id: '', acces: '', urgent: false });
  useEffect(() => {
    if (!ouvert || ctx) return;
    supabaseNavigateur().rpc('lanceur_bon_contexte', { p_demande: demande ?? null }).then(({ data, error }) => {
      if (error) return setErreur(error.message);
      const c = data as Ctx; setCtx(c);
      const d = c.demandes.find((x) => x.id === demande);
      if (d) { setF((v) => ({ ...v, unit_id: d.unit_id, travaux: d.titre, urgent: d.urgence === 'urgence', budget: d.cout_max ? String(Math.round(d.cout_max)) : v.budget })); preremplir(d.id, c); }
    });
  }, [ouvert, ctx, demande]);
  const L = ctx?.logements.find((l) => l.id === f.unit_id), D = ctx?.demandes.find((d) => d.id === f.service_request_id), cat = ctx?.catalogue.find((c) => c.id === f.service_catalog_id);
  const conformes = (ctx?.fournisseurs ?? []).filter((x) => !x.conformite), plafond = L?.plafond ?? 500;
  const suggestion = D?.metier ? conformes.filter((x) => x.specialites.some((s) => s && D.metier!.toLowerCase().includes(s.toLowerCase().slice(0, 5)))).slice(0, 2) : [];
  async function creer() {
    setEnvoi(true); setErreur(null);
    const acces = avis?.on && avis.locataire && !f.acces ? `Aviser ${avis.locataire} 24 h avant la visite` : f.acces;
    const { data, error } = await supabaseNavigateur().rpc('lanceur_bon_creer', { p: { ...f, acces, service_request_id: f.service_request_id || null } });
    setEnvoi(false); if (error) return setErreur(error.message);
    setOuvert(false); router.push(`/maintenance/bons/${(data as { id: string }).id}`);
  }
  const choisirDemande = (id: string) => { const d = ctx?.demandes.find((x) => x.id === id);
    setF({ ...f, service_request_id: id, unit_id: d?.unit_id ?? f.unit_id, travaux: d && !f.travaux ? d.titre : f.travaux, urgent: d ? d.urgence === 'urgence' : f.urgent, budget: d?.cout_max && !f.budget ? String(Math.round(d.cout_max)) : f.budget });
    if (d && ctx) preremplir(d.id, ctx); };
  // e38 : depuis une demande, mode « soumissions » avec les deux fournisseurs les mieux placés (même classement que « Assigner »), référence du catalogue,
  // et avis de 24 h au locataire sur le premier créneau qui le respecte.
  async function preremplir(id: string, c: Ctx) {
    const { data } = await supabaseNavigateur().rpc('lanceur_assigner_contexte', { p_demande: id });
    const a = data as { urgent: boolean; creneau: string; locataire: { nom: string } | null; fournisseurs: { id: string }[] } | null;
    if (!a) return;
    const conf = new Set(c.fournisseurs.filter((x) => !x.conformite).map((x) => x.id)), deux = a.fournisseurs.map((x) => x.id).filter((x) => conf.has(x)).slice(0, 2);
    setAvis({ locataire: a.locataire?.nom ?? null, creneau: a.creneau, urgent: a.urgent, on: !!a.locataire });
    setF((v) => ({ ...v, mode: deux.length > 1 && !a.urgent ? 'soumissions' : v.mode, invites: deux.length > 1 && !a.urgent ? deux : v.invites, worker_id: v.worker_id || deux[0] || '' }));
    setSuggeres(deux);
  }
  return (
    <>
      <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setOuvert(true)}><Icone nom="plus" taille={16} couleur="#fff" />Nouveau bon de travail</button>
      {ouvert && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOuvert(false)}>
        <form className="tiroir tiroir-large" role="dialog" aria-modal="true" aria-labelledby="nb-t" onSubmit={(e) => { e.preventDefault(); creer(); }}>
          <header className="tiroir-tete"><div><h2 id="nb-t">Nouveau bon de travail</h2><p className="gris texte-13" style={{ margin: 0 }}>{D ? `Créé depuis la demande ${D.numero}, classée « ${D.urgence} ».` : 'Lié à une demande ou créé par l’équipe.'}</p></div>
            <button type="button" className="haut-ibtn" onClick={() => setOuvert(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">
            {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
            {!ctx ? <p className="gris">Chargement…</p> : <>
              <label className="fenetre-lib" htmlFor="nb-d">Demande liée</label>
              <select id="nb-d" className="e70-raison" value={f.service_request_id} onChange={(e) => choisirDemande(e.target.value)}><option value="">Aucune (travaux décidés par l’équipe)</option>
                {ctx.demandes.map((d) => <option key={d.id} value={d.id}>{d.numero} · {d.titre} · {d.logement}</option>)}</select>
              <label className="fenetre-lib" htmlFor="nb-l" style={{ marginTop: 16 }}>Logement <span className="gris texte-12">obligatoire</span></label>
              <select id="nb-l" className="e70-raison" value={f.unit_id} disabled={!!D} onChange={(e) => setF({ ...f, unit_id: e.target.value })}><option value="">Choisir un logement</option>
                {ctx.logements.map((l) => <option key={l.id} value={l.id}>{l.libelle}{l.locataire ? ` · ${l.locataire}` : ''}</option>)}</select>
              <label className="fenetre-lib" htmlFor="nb-t2" style={{ marginTop: 16 }}>Travaux <span className="gris texte-12">obligatoire</span></label>
              <textarea id="nb-t2" className="e70-raison" rows={3} value={f.travaux} onChange={(e) => setF({ ...f, travaux: e.target.value })} />
              <label className="case" style={{ marginTop: 8 }}><input type="checkbox" checked={f.urgent} onChange={(e) => setF({ ...f, urgent: e.target.checked })} />Urgence (sécurité, eau, chauffage)</label>
              <p className="fenetre-lib" style={{ marginTop: 16 }}>Mode</p>
              <div className="lo-segments" style={{ maxWidth: 420 }}>{([['assigner', 'Assigner directement'], ['soumissions', 'Demander des soumissions']] as const).map(([k, l]) =>
                <button type="button" key={k} className={f.mode === k ? 'actif' : ''} onClick={() => setF({ ...f, mode: k })}>{l}</button>)}</div>
              {f.mode === 'assigner' ? <><label className="fenetre-lib" htmlFor="nb-w" style={{ marginTop: 16 }}>Fournisseur <span className="gris texte-12">obligatoire</span></label>
                <select id="nb-w" className="e70-raison" value={f.worker_id} onChange={(e) => setF({ ...f, worker_id: e.target.value })}><option value="">Choisir un fournisseur</option>
                  {ctx.fournisseurs.map((w) => <option key={w.id} value={w.id} disabled={!!w.conformite}>{w.nom} · {w.specialites.filter(Boolean).join(', ')}{w.note ? ` · ${String(w.note).replace('.', ',')} ★` : ''}{w.conformite ? ` — ${w.conformite}` : ''}</option>)}</select></>
                : <><p className="fenetre-lib" style={{ marginTop: 16 }}>Fournisseurs invités</p>
                  <div className="puces" style={{ marginBottom: 8 }}>{f.invites.map((id) => <span key={id} className="puce">{ctx.fournisseurs.find((w) => w.id === id)?.nom}
                    <button type="button" className="puce-x" aria-label="Retirer" onClick={() => setF({ ...f, invites: f.invites.filter((x) => x !== id) })}><Icone nom="close" taille={12} couleur="#2E5788" /></button></span>)}</div>
                  <select className="e70-raison" value="" onChange={(e) => e.target.value && setF({ ...f, invites: [...f.invites, e.target.value] })} aria-label="Ajouter un fournisseur"><option value="">Ajouter un fournisseur</option>
                    {conformes.filter((w) => !f.invites.includes(w.id)).map((w) => <option key={w.id} value={w.id}>{w.nom} · {w.specialites.filter(Boolean).join(', ')}</option>)}</select>
                  {!!suggestion.length && !f.invites.length && <p className="gris texte-12">Suggérés pour « {D?.metier} » : {suggestion.map((s) => <button type="button" key={s.id} className="lien" onClick={() => setF({ ...f, invites: [...f.invites, s.id] })}>{s.nom}</button>)}</p>}
                  {!!suggeres.length && suggeres.every((x) => f.invites.includes(x)) && <p className="gris texte-12">Choisis par Cléo : les mieux notés pour ce métier dans ce secteur.</p>}
                  <p className="gris texte-12">Une tâche vous rappelle d’envoyer la demande de soumission à chacun.</p></>}
              <div className="po-deux" style={{ marginTop: 16 }}><div><label className="fenetre-lib" htmlFor="nb-b">Budget <span className="gris texte-12">obligatoire</span></label>
                <input id="nb-b" className="e70-raison" inputMode="decimal" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/[^\d.]/g, '') })} /></div>
                <div><label className="fenetre-lib" htmlFor="nb-c">Travail du catalogue</label><select id="nb-c" className="e70-raison" value={f.service_catalog_id} onChange={(e) => setF({ ...f, service_catalog_id: e.target.value })}>
                  <option value="">Aucun</option>{ctx.catalogue.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></div></div>
              {cat?.reference && <p className="gris texte-13">Référence du catalogue : {Math.round(cat.reference)} $</p>}
              <p className="ligne-ic texte-12" style={{ color: '#2E5788', fontWeight: 600 }}><Icone nom="info" taille={16} couleur="#2E5788" />Au-delà de {Math.round(plafond)} $, l’accord du propriétaire est requis.</p>
              {avis?.locataire && <label className="ligne-entre carte-case" style={{ marginTop: 16 }}>
                <span><strong>Aviser {avis.locataire} 24 h avant la visite</strong><span className="gris texte-13" style={{ display: 'block' }}>Créneau proposé : {new Date(avis.creneau).toLocaleString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(':', ' h ')}{avis.urgent ? ' · urgence : sans délai' : ''}</span></span>
                <input type="checkbox" className="interrupteur-case" checked={avis.on} onChange={(e) => setAvis({ ...avis, on: e.target.checked })} /></label>}
              <label className="fenetre-lib" htmlFor="nb-a" style={{ marginTop: 16 }}>Accès au logement</label>
              <input id="nb-a" className="e70-raison" value={f.acces} onChange={(e) => setF({ ...f, acces: e.target.value })} placeholder={L?.locataire ? `Ex. : ${L.locataire} présente, ou clé au bureau` : 'Ex. : clé au bureau'} />
              <p className="gris texte-12">Le rendez-vous se fixe sur la fiche du bon : le locataire doit être avisé au moins 24 h avant (sauf urgence).</p>
            </>}
          </div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || !ctx || !f.unit_id || f.travaux.trim().length < 5 || !Number(f.budget) || (f.mode === 'assigner' ? !f.worker_id : !f.invites.length)}>{envoi ? 'Création…' : 'Créer le bon de travail'}</button></footer>
        </form></div>}
    </>
  );
}
