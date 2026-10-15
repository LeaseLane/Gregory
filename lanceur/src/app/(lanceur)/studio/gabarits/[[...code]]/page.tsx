import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO } from '../../onglets';
import { rendreCourriel, rendreSms, type Contenu } from '@partage/gabarits.ts';
import { Gabarits, type Gabarit } from './Gabarits';

/* Studio · Gabarits (maquette e54) : tableau filtré à gauche, aperçu du gabarit choisi (tel que reçu) et sa
   version SMS à droite. Le rendu est celui de l'envoyeur (_shared/gabarits.ts), avec les valeurs d'exemple. */
export default async function Page({ params }: { params: Promise<{ code?: string[] }> }) {
  const { code = [] } = await params;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_gabarits');
  const ORDRE = ['LOC', 'PRO', 'FOU', 'PSP', 'EQP'];  // ordre du catalogue de la maquette (build_mail.py)
  const liste = ((data as Gabarit[] | null) ?? []).sort((a, b) => ORDRE.indexOf(a.code.slice(0, 3)) - ORDRE.indexOf(b.code.slice(0, 3)) || a.code.localeCompare(b.code));
  const g = liste.find((x) => x.code === code[0]) ?? liste[0] ?? null;
  const exemple = (g?.contenu as { exemple?: Record<string, unknown> } | undefined)?.exemple ?? {};
  const rendu = g ? rendreCourriel(g.contenu as Contenu, exemple) : null;
  const apercu = g && rendu ? { sujet: rendu.subject, html: rendu.html, sms: g.sms_text ? rendreSms(g.sms_text, exemple) : null } : null;
  return (
    <CadreEspace
      icone="globe"
      nom="Studio"
      sous="Site web, campagnes, sources et gabarits de messages"
      actif={3}
      onglets={ONGLETS_STUDIO}
    >
      <Gabarits
        liste={liste}
        selection={g?.code ?? null}
        apercu={apercu}
        prod={process.env.LL_ENV === 'production'}
        erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les gabarits n’ont pas pu être lus.') : null}
      />
    </CadreEspace>
  );
}
