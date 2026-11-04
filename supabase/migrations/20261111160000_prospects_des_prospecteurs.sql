-- Ventes › Mes prospects, vue de l'équipe (Octa, 2026-11-04) : les prospects ajoutés par les prospecteurs téléphoniques ou qui leur
-- sont assignés, avec le nom du prospecteur. Le prospecteur lui-même lit les siens par la RLS « prospecteur lit ses prospects ».
create or replace function public.lanceur_prospects_prospecteurs() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name, 'company_name', p.company_name, 'phone', p.phone, 'email', p.email,
      'num_doors', p.num_doors, 'stage', p.stage, 'next_followup_date', p.next_followup_date, 'created_by_caller_id', p.created_by_caller_id, 'created_at', p.created_at,
      'prospecteur', c.full_name) order by p.created_at desc)
    from public.prospects p join public.cold_callers c on c.id = coalesce(p.created_by_caller_id, p.assigned_caller_id)
    where p.archived_at is null and (p.created_by_caller_id is not null or p.assigned_caller_id is not null)), '[]'::jsonb);
end $$;
revoke all on function public.lanceur_prospects_prospecteurs() from public, anon;
grant execute on function public.lanceur_prospects_prospecteurs() to authenticated;
