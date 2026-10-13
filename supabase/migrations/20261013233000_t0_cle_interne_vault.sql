-- T0 : internal_call_headers() lit d'abord le secret dans Supabase Vault.
--
-- POURQUOI. Le plan du lot G11 passait par
--   alter database postgres set app.internal_call_secret = '…';
-- mais ce réglage ne touche que les NOUVELLES connexions. Les connexions
-- déjà ouvertes du pool (API, portails) ne le voient pas avant d'être
-- recyclées : leurs déclencheurs enverraient des appels sans clé, refusés
-- dès que INTERNAL_CALL_SECRET est défini côté fonctions. Vault est lu à
-- chaque appel, par toutes les connexions, tout de suite.
--
-- ACTIVATION, dans cet ordre :
--   1. select vault.create_secret('<secret>', 'internal_call_secret');
--   2. Supabase › Edge Functions › Secrets : INTERNAL_CALL_SECRET = <secret>.
-- L'ancien réglage app.internal_call_secret reste lu en secours.

create or replace function internal_call_headers()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  cle text;
  anon text := 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR';
  entetes jsonb := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon,
    'apikey', anon
  );
begin
  begin
    select decrypted_secret into cle
    from vault.decrypted_secrets
    where name = 'internal_call_secret'
    limit 1;
  exception when others then
    cle := null;  -- Vault absent ou inaccessible : on retombe sur le réglage
  end;
  cle := coalesce(nullif(cle, ''), nullif(current_setting('app.internal_call_secret', true), ''));
  if cle is not null then
    entetes := entetes || jsonb_build_object('x-internal-call-key', cle);
  end if;
  return entetes;
end;
$$;
revoke execute on function internal_call_headers() from public, anon, authenticated;
