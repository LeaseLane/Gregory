import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ETAPES } from '@/lib/propositions';
import { VENTES } from '@/lib/ventes';

/* « À rappeler » (Octa, 2026-11-11) : le module du prospecteur pour sa journée d'appels. Ses prospects en retard, du jour, des 7 prochains
   jours et ceux jamais appelés; un clic ouvre la fiche pour noter l'appel. ?comme=<prospecteur> : un admin voit la liste d'un prospecteur. */
type P = { id: string; nom: string; entreprise: string | null; tel: string | null; portes: number | null; etape: string | null; relance: string | null;
  prochaine_action: string | null; interet: string | null; groupe: string; dernier_appel: { le: string; resume: string | null } | null; deal_id: string | null };
const GROUPES: [string, string, string][] = [
  ['1_retard', 'En retard', 'La date de rappel est passée : à appeler en premier.'],
  ['2_aujourdhui', 'Aujourd’hui', 'Rappels prévus aujourd’hui.'],
  ['3_semaine', '7 prochains jours', 'Pour préparer la semaine.'],
  ['4_jamais', 'Jamais appelés', 'Prospects sans appel ni date de rappel.'],
];
const jour = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });

export default async function Page({ searchParams }: { searchParams: Promise<{ comme?: string }> }) {
  const { comme } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_a_rappeler', comme ? { p_caller: comme } : {});
  const liste = ((data as { prospects: P[] } | null)?.prospects ?? []);
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={0} onglets={[{ libelle: 'À rappeler', href: '/ventes/a-rappeler' }]} actions={null}>
      {error && <div className="bandeau erreur" role="alert">{error.code === 'PT403' ? error.message : 'La liste n’a pas pu être lue.'}</div>}
      {!error && !data && <div className="bandeau info" role="status">Cette page est la liste d’appels d’un prospecteur.</div>}
      {data && !liste.length && <section className="carte-l18"><p className="gris" style={{ margin: 0 }}>Rien à rappeler : aucun rappel en retard ni prévu cette semaine.</p></section>}
      {GROUPES.map(([g, titre, aide]) => {
        const lignes = liste.filter((p) => p.groupe === g);
        if (!lignes.length) return null;
        return (
          <section key={g} className="carte-l18" aria-label={titre}>
            <h2 className="titre-carte" style={{ marginBottom: 2, color: g === '1_retard' ? '#9B2E28' : undefined }}>{titre} · {lignes.length}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{aide}</p>
            <table className="tableau">
              <thead><tr><th style={{ width: '30%' }}>Prospect</th><th>Téléphone</th><th>Rappel</th><th style={{ width: '40%' }}>Dernier appel · prochaine action</th></tr></thead>
              <tbody>{lignes.map((p) => <tr key={p.id}>
                <td>{p.deal_id ? <Link className="fort" href={`/ventes/deals/${p.deal_id}`}>{p.entreprise || p.nom}</Link> : <strong>{p.entreprise || p.nom}</strong>}
                  <span className="gris" style={{ display: 'block', fontSize: 13 }}>{[p.entreprise ? p.nom : null, p.portes ? `${p.portes} portes` : null, ETAPES[p.etape ?? 'new'] ?? p.etape].filter(Boolean).join(' · ')}</span></td>
                <td>{p.tel ? <a className="lien ligne-ic" href={`tel:${p.tel.replace(/[^\d+]/g, '')}`}><Icone nom="phone" taille={14} couleur="#2E5788" />{p.tel}</a> : <span className="gris">—</span>}</td>
                <td style={g === '1_retard' ? { color: '#9B2E28', fontWeight: 600 } : undefined}>{p.relance ? jour(p.relance) : '—'}</td>
                <td className="texte-13">{p.dernier_appel ? <><span className="gris">{jour(p.dernier_appel.le)} · </span>{(p.dernier_appel.resume ?? '').slice(0, 140)}{(p.dernier_appel.resume ?? '').length > 140 ? '…' : ''}</> : <span className="gris">Aucun appel</span>}
                  {p.prochaine_action && <span style={{ display: 'block', marginTop: 4 }}><strong>Prochaine action : </strong>{p.prochaine_action}</span>}</td></tr>)}</tbody>
            </table>
          </section>
        );
      })}
    </CadreEspace>
  );
}
