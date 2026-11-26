-- Portée client → immeuble (phase 1) : la recherche de destinataires d'un document ne propose que les clients, locataires et
-- immeubles du client ou de l'immeuble choisi (relevé par phase1_portee_test le 26 nov. 2026; la fonction lisait public.*).
create or replace function public.lanceur_document_cibles(q text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m text := '%' || lower(btrim(coalesce(q, ''))) || '%';
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(q, ''))) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(x) from (
    (select jsonb_build_object('cible', 'proprietaire', 'id', o.id, 'libelle', o.full_name, 'sous', coalesce(o.company_name, o.email)) x from portee.owners o
      where lower(o.full_name) like m or lower(coalesce(o.company_name, '')) like m order by o.full_name limit 5)
    union all
    (select jsonb_build_object('cible', 'locataire', 'id', t.id, 'libelle', t.full_name, 'sous', t.email) from portee.tenants t
      where t.anonymized_at is null and lower(t.full_name) like m order by t.full_name limit 5)
    union all
    (select jsonb_build_object('cible', 'immeuble', 'id', b.id, 'libelle', b.address, 'sous', (select full_name from portee.owners where id = b.owner_id), 'proprietaire_id', b.owner_id) from portee.buildings b
      where lower(b.address) like m order by b.address limit 5)) z), '[]'::jsonb);
end $$;
