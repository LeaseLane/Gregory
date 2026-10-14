-- TT · Prospecteurs et classement (x18, prototype « Appelants ») : prospects assignés, appels sur 30 jours
-- (comms.calls + anciens appels saisis dans prospects.call_history), mandats signés, relances dues.
create or replace function public.lanceur_prospecteurs() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (crm.can('ventes.lire') or crm.can('operations.lire')) then raise exception 'Votre rôle ne donne pas accès aux prospecteurs.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'signes')::int desc, (x ->> 'appels')::int desc) from (
    select jsonb_build_object('id', cc.id, 'nom', cc.full_name, 'courriel', cc.email, 'tel', cc.phone, 'actif', coalesce(cc.active, true),
      'prospects', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.anonymized_at is null and p.stage not in ('signed', 'lost')),
      'appels', (select count(*) from comms.calls c where c.cold_caller_id = cc.id and c.started_at > now() - interval '30 days')
              + (select coalesce(sum((select count(*) from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) h
                   where (h ->> 'date')::timestamptz > now() - interval '30 days')), 0) from public.prospects p where p.assigned_caller_id = cc.id),
      'signes', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage = 'signed'),
      'relances', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage not in ('signed', 'lost') and p.next_followup_date <= current_date)) as x
    from public.cold_callers cc) y), '[]'::jsonb);
end $$;
revoke all on function public.lanceur_prospecteurs() from public, anon;
grant execute on function public.lanceur_prospecteurs() to authenticated;
