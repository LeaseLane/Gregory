-- Juridique · Tribunal (TAL) (maquette e48) et Modèles (e49).
-- TAL : motif, avis d'audience, mode et note d'audience, décision; pièces du dossier lues dans les vraies traces
-- (bail, relevé, mise en demeure envoyée, preuve de signification, avis d'audience). Modèles : prochaine révision juridique.

alter table jur.cases add column if not exists motif text not null default 'Non-paiement de loyer',
  add column if not exists hearing_notice_on date, add column if not exists hearing_mode text, add column if not exists hearing_note text,
  add column if not exists decision_on date, add column if not exists decision_text text;
alter table jur.templates add column if not exists next_review_on date;

create or replace function public.lanceur_juridique_tal() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossiers', coalesce((select jsonb_object_agg(c.id, jsonb_build_object(
        'motif', c.motif, 'avis_audience', c.hearing_notice_on, 'mode', c.hearing_mode, 'note_audience', c.hearing_note, 'decision', c.decision_on, 'decision_texte', c.decision_text,
        'pieces', jsonb_build_array(
          jsonb_build_object('icone', 'file', 'texte', 'Bail signé', 'ok', true),
          jsonb_build_object('icone', 'receipt', 'texte', 'Relevé de compte au ' || to_char(current_date, 'DD/MM'), 'ok', exists (select 1 from public.payments p where p.lease_id = c.lease_id)),
          jsonb_build_object('icone', 'mail', 'texte', 'Mise en demeure' || coalesce(' du ' || to_char(n.sent_at at time zone 'America/Toronto', 'DD/MM'), ''), 'ok', n.sent_at is not null),
          jsonb_build_object('icone', 'shieldc', 'texte', 'Preuve de signification' || coalesce(' (' || n.proof_mode || ')', ''), 'ok', n.proof_mode is not null),
          jsonb_build_object('icone', 'calendar', 'texte', 'Avis d’audience' || coalesce(' du ' || to_char(c.hearing_notice_on, 'DD/MM'), ''), 'ok', c.hearing_notice_on is not null),
          jsonb_build_object('icone', 'user', 'texte', 'Présence à l’audience confirmée', 'ok', c.hearing_note is not null)),
        'payes_depuis', (select count(*) from public.payments p where p.lease_id = c.lease_id and p.status = 'paid' and p.due_date > coalesce(c.tal_filed_at, c.opened_at::date)),
        'en_retard_depuis', (select count(*) from public.payments p where p.lease_id = c.lease_id and p.status <> 'paid' and p.due_date < current_date and p.due_date > coalesce(c.tal_filed_at, c.opened_at::date))))
      from jur.cases c left join lateral (select * from jur.notices x where x.case_id = c.id and x.status = 'sent' order by x.sent_at desc limit 1) n on true
      where c.stage in ('mise_en_demeure', 'tal') or c.tal_number is not null), '{}'::jsonb),
    'modeles', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('prochaine_revision', t.next_review_on,
        'remplace', (select 'v' || p.version || ' · ' || to_char(p.created_at, 'DD/MM/YYYY') from jur.templates p where p.code = t.code and p.version = t.version - 1)))
      from jur.templates t), '{}'::jsonb));
end $$;

-- Mise à jour du dossier au TAL : en plus du numéro, du dépôt et de l'audience, l'avis d'audience, le mode, la note et la décision.
create or replace function public.lanceur_tal_details(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un dossier.' using errcode = 'PT403'; end if;
  update jur.cases set
    motif = coalesce(nullif(btrim(p ->> 'motif'), ''), motif),
    hearing_notice_on = case when p ? 'avis_audience' then nullif(p ->> 'avis_audience', '')::date else hearing_notice_on end,
    hearing_mode = case when p ? 'mode' then nullif(btrim(p ->> 'mode'), '') else hearing_mode end,
    hearing_note = case when p ? 'note_audience' then nullif(btrim(p ->> 'note_audience'), '') else hearing_note end,
    decision_on = case when p ? 'decision' then nullif(p ->> 'decision', '')::date else decision_on end,
    decision_text = case when p ? 'decision_texte' then nullif(btrim(p ->> 'decision_texte'), '') else decision_text end,
    updated_at = now()
  where id = (p ->> 'case_id')::uuid;
  if not found then raise exception 'Dossier introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('case.tal_updated', 'jur.cases', (p ->> 'case_id')::uuid, null, p - 'case_id', 'update-tal-case');
end $$;

revoke all on function public.lanceur_juridique_tal(), public.lanceur_tal_details(jsonb) from public, anon;
grant execute on function public.lanceur_juridique_tal(), public.lanceur_tal_details(jsonb) to authenticated;
