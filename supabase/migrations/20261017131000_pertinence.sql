-- T3b / T8b · Pertinence : l'IA la donne parfois en fraction (0,95) : acceptée et ramenée sur 100.

create or replace function crm.pertinence(p text) returns int language sql immutable set search_path = '' as $$
  select case when p ~ '^\s*-?\d+(\.\d+)?\s*$' then least(100, greatest(0, round(case when p::numeric <= 1 then p::numeric * 100 else p::numeric end)))::int else 50 end
$$;

create or replace function crm.deposer_suggestions(p_run uuid, p_items jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare i jsonb; n int := 0; v_tel text; v_mail text;
begin
  for i in select * from jsonb_array_elements(p_items) loop
    v_mail := lower(nullif(btrim(i ->> 'courriel'), '')); v_tel := crm.normaliser_tel(i ->> 'telephone');
    if coalesce(btrim(i ->> 'nom'), '') = '' or coalesce(i ->> 'source_url', '') !~ '^https?://' or (v_mail is null and v_tel is null) then continue; end if;
    -- déjà connu (contact, prospect, suggestion) : ignoré
    if exists (select 1 from crm.contacts c where c.merged_into is null and ((v_mail is not null and v_mail = any(c.emails)) or (v_tel is not null and v_tel = any(c.phones_e164))))
       or exists (select 1 from crm.prospect_suggestions s where s.status <> 'rejected' and ((v_mail is not null and lower(s.courriel) = v_mail) or (v_tel is not null and crm.normaliser_tel(s.telephone) = v_tel))) then continue; end if;
    insert into crm.prospect_suggestions (run_id, nom, entreprise, telephone, courriel, ville, portes, immeubles, source_url, extrait, raison, pertinence)
    values (p_run, btrim(i ->> 'nom'), nullif(btrim(i ->> 'entreprise'), ''), i ->> 'telephone', v_mail, nullif(btrim(i ->> 'ville'), ''),
            round(nullif(i ->> 'portes', '')::numeric)::int, round(nullif(i ->> 'immeubles', '')::numeric)::int, i ->> 'source_url', left(i ->> 'extrait', 1000), left(i ->> 'raison', 500),
            crm.pertinence(i ->> 'pertinence'));
    n := n + 1;
  end loop;
  update crm.agent_runs set retenus = n where id = p_run;
  return n;
end $$;

create or replace function maint.deposer_candidats(p_run uuid, p_search uuid, p_items jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare i jsonb; n int := 0; v_mail text; v_tel text;
begin
  for i in select * from jsonb_array_elements(p_items) loop
    v_mail := lower(nullif(btrim(i ->> 'courriel'), '')); v_tel := crm.normaliser_tel(i ->> 'telephone');
    if coalesce(btrim(i ->> 'entreprise'), '') = '' or coalesce(i ->> 'source_url', '') !~ '^https?://' or (v_mail is null and v_tel is null) then continue; end if;
    if exists (select 1 from public.workers w where (v_mail is not null and lower(w.email) = v_mail) or (v_tel is not null and crm.normaliser_tel(w.phone) = v_tel)
                 or (nullif(i ->> 'rbq', '') is not null and w.rbq_license = i ->> 'rbq') or (nullif(i ->> 'neq', '') is not null and w.neq = i ->> 'neq'))
       or exists (select 1 from maint.supplier_candidates c where c.status <> 'rejected' and ((v_mail is not null and lower(c.contact_email) = v_mail) or (v_tel is not null and crm.normaliser_tel(c.contact_phone) = v_tel))) then continue; end if;
    insert into maint.supplier_candidates (search_id, run_id, company_name, specialties, sector, rbq_number, neq, rbq_status, rbq_source_url, insurance_declared, rating,
      source_url, extrait, raison, pertinence, contact_email, contact_phone)
    values (p_search, p_run, btrim(i ->> 'entreprise'), coalesce((select array_agg(x) from jsonb_array_elements_text(i -> 'specialites') x), '{}'), nullif(i ->> 'secteur', ''),
            nullif(i ->> 'rbq', ''), nullif(i ->> 'neq', ''),
            case when i ->> 'rbq_statut' in ('valide', 'expiree', 'introuvable', 'non_requise') then i ->> 'rbq_statut' else 'a_verifier' end,
            nullif(i ->> 'rbq_source_url', ''), nullif(i ->> 'assurance', ''), nullif(i ->> 'note', '')::numeric, i ->> 'source_url', left(i ->> 'extrait', 1000), left(i ->> 'raison', 500),
            crm.pertinence(i ->> 'pertinence'), v_mail, i ->> 'telephone');
    n := n + 1;
  end loop;
  update crm.agent_runs set retenus = n where id = p_run;
  update maint.recruitment_searches set last_run_at = now() where id = p_search;
  return n;
end $$;
