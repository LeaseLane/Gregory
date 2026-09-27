-- « Mon compte » : chaque utilisateur lit et modifie SON nom et SON
-- téléphone, quelle que soit sa table (propriétaire, locataire,
-- travailleur, prospecteur). Le courriel reste l'identifiant de connexion
-- et ne change pas ici.
create or replace function public.mon_profil()
returns table (role text, nom text, telephone text, courriel text)
language sql stable security definer set search_path = public
as $$
  select * from (
    select 'owner'::text, full_name, phone, (select email from users where id = auth.uid()) from owners where user_id = auth.uid()
    union all select 'tenant', full_name, phone, email from tenants where user_id = auth.uid()
    union all select 'worker', name, phone, email from workers where user_id = auth.uid()
    union all select 'caller', full_name, phone, email from cold_callers where user_id = auth.uid()
    union all select 'admin', null, null, email from users where id = auth.uid() and is_admin
  ) p limit 1
$$;

create or replace function public.maj_mon_profil(p_nom text, p_telephone text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_nom text := nullif(btrim(p_nom), '');
  v_tel text := nullif(btrim(p_telephone), '');
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if v_nom is null or length(v_nom) > 120 then raise exception 'nom invalide'; end if;
  if v_tel is not null and length(v_tel) > 30 then raise exception 'téléphone invalide'; end if;
  update owners set full_name = v_nom, phone = v_tel where user_id = auth.uid();
  update tenants set full_name = v_nom, phone = v_tel where user_id = auth.uid();
  update workers set name = v_nom, phone = v_tel where user_id = auth.uid();
  update cold_callers set full_name = v_nom, phone = v_tel where user_id = auth.uid();
end;
$$;

revoke all on function public.mon_profil() from public, anon;
revoke all on function public.maj_mon_profil(text, text) from public, anon;
grant execute on function public.mon_profil() to authenticated;
grant execute on function public.maj_mon_profil(text, text) to authenticated;
