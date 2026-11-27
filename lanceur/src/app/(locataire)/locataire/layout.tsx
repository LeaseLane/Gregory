/* Styles de la passe de Steven (27 nov. 2026, branche claude/locataire-mobile-fixes 5c270e5), pour le portail locataire seulement
   (28 nov., demande d'Octa) : copie entière de son globals.css, chargée après le nôtre. Entière et non un extrait : un extrait
   change l'ordre des règles (vérifié : le menu de gauche s'espaçait autrement). Il ne retire aucune propriété des règles existantes.
   ponytail: ~430 Ko bruts en double sur les pages locataire; à retirer quand sa branche entière est intégrée dans globals.css. */
import './locataire.css';
import { moiPortail } from '@/composants/portail/Moi';
import { CoquilleLocataire, type Pastilles } from '@/composants/portail/CoquilleLocataire';
import { supabaseServeur } from '@/lib/supabase/serveur';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const moi = await moiPortail('locataire');
  const { data } = await (await supabaseServeur()).rpc('portail_locataire_pastilles');
  return <CoquilleLocataire moi={moi} pastilles={(data as Pastilles) ?? null}>{children}</CoquilleLocataire>;
}
