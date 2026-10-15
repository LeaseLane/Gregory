import { supabaseServeur } from '@/lib/supabase/serveur';
import { Notifications } from './Notifications';
import type { Notif } from '@/composants/portail/PageNotifications';

export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('portail_notifications_toutes');
  return <Notifications liste={(data as Notif[] | null) ?? []} erreur={error?.message ?? null} />;
}
