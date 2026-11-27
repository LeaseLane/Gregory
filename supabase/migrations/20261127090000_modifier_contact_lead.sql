-- Ventes · modifier le nom, le courriel et le téléphone d'un contact de lead (27 nov. 2026, demande d'Octa : on ne pouvait que les saisir
-- à la création). Mêmes droits que les autres gestes sur un deal : écriture sur son pipeline, et un prospecteur seulement sur les siens.
-- Le courriel et le téléphone modifiés sont les PRINCIPAUX (premiers de la liste); les autres sont gardés.
-- Un contact rattaché à un propriétaire, un locataire ou un travailleur se modifie depuis sa fiche (sinon les deux divergeraient).
-- Le changement s'inscrit au fil du deal (avant → après). Doublon possible signalé, jamais bloquant (on ne fusionne rien ici).
create or replace function public.lanceur_contact_lead(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_deal uuid := nullif(p ->> 'deal_id', '')::uuid; v_contact uuid := nullif(p ->> 'contact_id', '')::uuid;
  v_perm text; d crm.deals; c crm.contacts;
  v_nom text := btrim(coalesce(p ->> 'nom', '')); v_courriel text := lower(btrim(coalesce(p ->> 'courriel', ''))); v_tel_saisi text := btrim(coalesce(p ->> 'telephone', ''));
  v_tel text; v_emails text[]; v_tels text[]; quoi text[] := '{}'; v_doublon text;
begin
  perform crm.exiger_mon_deal(v_deal);
  perform crm.require_aal2();
  select * into d from crm.deals where id = v_deal;
  select replace(pl.permission, '.lire', '.ecrire') into v_perm from crm.pipelines pl where pl.id = d.pipeline_id;
  if d.id is null or v_perm is null then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  if not crm.can(v_perm) then raise exception 'Votre rôle ne permet pas d’écrire sur ce deal.' using errcode = 'PT403'; end if;
  if not exists (select 1 from crm.deal_contacts where deal_id = v_deal and contact_id = v_contact) then
    raise exception 'Ce contact n’est pas sur ce deal.' using errcode = 'PT404'; end if;
  select * into c from crm.contacts where id = v_contact for update;
  if c.merged_into is not null or c.anonymized_at is not null then raise exception 'Ce contact a été fusionné ou anonymisé.' using errcode = 'PT409'; end if;
  if c.owner_id is not null or c.tenant_id is not null or c.worker_id is not null then
    raise exception 'Ce contact est déjà un client, un locataire ou un fournisseur : modifiez-le depuis sa fiche.' using errcode = 'PT409'; end if;

  if v_nom = '' then raise exception 'Le nom est obligatoire.' using errcode = 'PT422'; end if;
  if char_length(v_nom) > 120 then raise exception 'Nom trop long (120 caractères au plus).' using errcode = 'PT422'; end if;
  if v_courriel <> '' and v_courriel !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  v_tel := case when v_tel_saisi = '' then null else crm.normaliser_tel(v_tel_saisi) end;
  if v_tel_saisi <> '' and v_tel is null then raise exception 'Téléphone invalide (10 chiffres).' using errcode = 'PT422'; end if;

  -- Le principal remplacé (ou retiré si vide), les autres gardés, sans doublon.
  v_emails := array_remove(array[nullif(v_courriel, '')], null) || array(select e from unnest(coalesce(c.emails[2:], '{}')) e where e is distinct from nullif(v_courriel, ''));
  v_tels := array_remove(array[v_tel], null) || array(select t from unnest(coalesce(c.phones_e164[2:], '{}')) t where t is distinct from v_tel);

  if v_nom is distinct from c.full_name then quoi := quoi || ('nom : ' || coalesce(c.full_name, '—') || ' → ' || v_nom); end if;
  if nullif(v_courriel, '') is distinct from c.emails[1] then quoi := quoi || ('courriel : ' || coalesce(c.emails[1], '—') || ' → ' || coalesce(nullif(v_courriel, ''), '—')); end if;
  if v_tel is distinct from c.phones_e164[1] then quoi := quoi || ('téléphone : ' || coalesce(c.phones_e164[1], '—') || ' → ' || coalesce(v_tel, '—')); end if;
  if cardinality(quoi) = 0 then return jsonb_build_object('change', false); end if;

  update crm.contacts set full_name = v_nom, emails = v_emails, phones_e164 = v_tels, updated_at = now() where id = c.id;
  -- Le titre du deal reprend le nom quand il était le nom du contact (cas d'un lead créé à la main).
  if d.title = c.full_name then update crm.deals set title = v_nom, updated_at = now() where id = d.id; end if;
  insert into crm.activities (deal_id, contact_id, type, title, body, author_user_id)
  values (d.id, c.id, 'note', 'Coordonnées modifiées', array_to_string(quoi, E'\n'), auth.uid());

  select x.full_name into v_doublon from crm.contacts x
   where x.id <> c.id and x.merged_into is null and x.anonymized_at is null
     and ((nullif(v_courriel, '') is not null and nullif(v_courriel, '') = any (x.emails)) or (v_tel is not null and v_tel = any (x.phones_e164)))
   limit 1;
  return jsonb_build_object('change', true, 'doublon', v_doublon);
end $$;
revoke all on function public.lanceur_contact_lead(jsonb) from public, anon;
grant execute on function public.lanceur_contact_lead(jsonb) to authenticated;
