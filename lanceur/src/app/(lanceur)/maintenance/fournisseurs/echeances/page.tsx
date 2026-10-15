import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../../onglets';

/* Maintenance · Fournisseurs › Échéances (x11) : licences RBQ et assurances qui expirent dans 90 jours (expirées en rouge). */
type Ech = { worker_id: string; fournisseur: string; contact: string; quoi: string; numero: string | null; expire: string; jours: number; urgent: boolean; courriel: string | null };
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_echeances_fournisseurs');
  const l = (data as Ech[] | null) ?? [];
  const d = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={2} onglets={ongletsMaint(l.filter((x) => x.jours < 0).length || undefined)}>
      {error && <div className="bandeau erreur" role="alert">{error.code === 'PT403' ? error.message : 'Les échéances n’ont pas pu être lues.'}</div>}
      <section className="carte-l18" aria-label="Échéances">
        <h2 className="titre-carte" style={{ marginBottom: 2 }}>RBQ et assurances qui expirent</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Dans les 90 jours · un fournisseur expiré ne reçoit plus d’offres de travaux</p>
        <div className="po-kpis trois" style={{ marginBottom: 16 }}>{([['Expirées', l.filter((x) => x.jours < 0).length], ['Dans 30 jours', l.filter((x) => x.jours >= 0 && x.jours <= 30).length], ['Dans 31 à 90 jours', l.filter((x) => x.jours > 30).length]] as const).map(([t, n]) =>
          <div key={t} className="carte-l18 kpi-po"><span>{t}</span><b className={t === 'Expirées' && n ? 'rouge' : ''}>{n}</b></div>)}</div>
        <table className="tableau"><thead><tr><th>Fournisseur</th><th>Document</th><th>Expire le</th><th className="droite">Dans</th><th>Urgences</th><th /></tr></thead>
          <tbody>{l.map((x, i) => <tr key={i}><td><strong>{x.fournisseur}</strong><span className="sous gris">{x.contact}</span></td><td>{x.quoi}{x.numero ? ` · ${x.numero}` : ''}</td><td>{d(x.expire)}</td>
            <td className={`droite ${x.jours < 0 ? 'rouge fort' : x.jours <= 30 ? 'rouge' : ''}`}>{x.jours < 0 ? `expirée depuis ${-x.jours} j` : `${x.jours} jours`}</td><td>{x.urgent ? 'Oui' : '—'}</td>
            <td className="droite">{x.courriel && <a className="lien" href={`mailto:${x.courriel}?subject=${encodeURIComponent(`${x.quoi} : document à jour requis`)}`}>Demander le document</a>}</td></tr>)}
            {!l.length && <tr><td colSpan={6} className="gris">Aucune échéance dans les 90 jours.</td></tr>}</tbody></table>
      </section>
    </CadreEspace>
  );
}
