-- Studio › Site web › Demandes (20 nov. 2026) : les demandes envoyées par les formulaires du site (public.inquiries : contact, mandat, visite).
-- L'accueil de l'admin les comptait (« nouvelles demandes du site ») sans écran pour les lire; Greg ne voyait pas les 2 nouvelles.
-- Lecture : studio.lire (comme le compteur). Statut : studio.ecrire, journalisé. Une demande anonymisée (Loi 25) ne montre plus rien.

create or replace function public.lanceur_demandes_site() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.studio(false);
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', i.id, 'recu_le', i.created_at, 'type', i.type, 'statut', i.status, 'anonymise', i.anonymized_at is not null,
        'nom', case when i.anonymized_at is null then i.full_name end, 'courriel', case when i.anonymized_at is null then i.email end,
        'telephone', case when i.anonymized_at is null then i.phone end, 'message', case when i.anonymized_at is null then i.message end,
        'resume', i.ai_summary, 'portes', i.num_doors, 'secteur', i.sector, 'rappel', i.best_call_time,
        'logement', case when i.unit_id is not null then crm.libelle_logement(i.unit_id) end) order by i.created_at desc)
      from (select * from public.inquiries order by created_at desc limit 300) i), '[]'::jsonb),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;

create or replace function public.lanceur_demande_site_statut(p_id uuid, p_statut text) returns void language plpgsql security definer set search_path = '' as $$
declare v_avant text;
begin
  perform crm.studio(true);
  if p_statut not in ('new', 'contacted', 'closed') then raise exception 'Statut inconnu.' using errcode = 'PT422'; end if;
  select status into v_avant from public.inquiries where id = p_id for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if v_avant = p_statut then return; end if;
  update public.inquiries set status = p_statut where id = p_id;
  perform crm.journal('inquiry.status_changed', 'public.inquiries', p_id, jsonb_build_object('statut', v_avant), jsonb_build_object('statut', p_statut), 'update-inquiry-status');
end $$;

revoke all on function public.lanceur_demandes_site(), public.lanceur_demande_site_statut(uuid, text) from public, anon;
grant execute on function public.lanceur_demandes_site(), public.lanceur_demande_site_statut(uuid, text) to authenticated;
