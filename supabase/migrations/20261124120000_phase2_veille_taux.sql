-- Phase 2 · veille des taux (plan du 13 nov. 2026 : taux directeur, taux hypothécaires, refinancement).
-- Source : Banque du Canada, API Valet (lue le 23 nov. 2026). Valeurs de départ datées; le rafraîchissement automatique se branche sur
-- crm.taux_enregistrer (service_role). Pas de taux hypothécaire variable affiché : la Banque ne publie que le taux préférentiel, qui sert de repère.
create table if not exists crm.taux_marche (serie text primary key, libelle text not null, valeur numeric(5,2) not null, date_obs date not null, source text not null, mis_a_jour timestamptz not null default now());
alter table crm.taux_marche enable row level security;
revoke all on crm.taux_marche from public, anon, authenticated;
insert into crm.taux_marche (serie, libelle, valeur, date_obs, source) values
  ('V39079', 'Taux directeur', 2.50, '2026-11-20', 'Banque du Canada, V39079'),
  ('V80691311', 'Taux préférentiel (repère du taux variable)', 4.70, '2026-11-18', 'Banque du Canada, V80691311'),
  ('V80691335', 'Hypothèque conventionnelle, 5 ans fixe (taux affiché)', 6.19, '2026-11-18', 'Banque du Canada, V80691335')
on conflict (serie) do nothing;

create or replace function crm.taux_enregistrer(p_serie text, p_valeur numeric, p_date date) returns void language sql security definer set search_path = '' as $$
  update crm.taux_marche set valeur = p_valeur, date_obs = p_date, mis_a_jour = now() where serie = p_serie and p_date >= date_obs;
$$;
revoke all on function crm.taux_enregistrer(text, numeric, date) from public, anon, authenticated;
grant execute on function crm.taux_enregistrer(text, numeric, date) to service_role;

create or replace function public.lanceur_taux() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('serie', serie, 'libelle', libelle, 'valeur', valeur, 'date', date_obs, 'source', source) order by libelle) from crm.taux_marche), '[]'::jsonb);
end $$;

-- Mensualité canadienne : intérêt composé semi-annuellement, paiements mensuels.
create or replace function crm.mensualite(p_capital numeric, p_taux numeric, p_ans int) returns numeric language sql immutable set search_path = '' as $$
  select case when p_taux = 0 then p_capital / (p_ans * 12)
    else p_capital * ((1 + p_taux / 200) ^ (1.0 / 6) - 1) / (1 - ((1 + p_taux / 200) ^ (1.0 / 6)) ^ (-p_ans * 12)) end;
$$;

create or replace function public.lanceur_refinancement(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_cap numeric := (p ->> 'capital')::numeric; v_a numeric := (p ->> 'taux_actuel')::numeric; v_n numeric := (p ->> 'taux_nouveau')::numeric; v_ans int := coalesce((p ->> 'amortissement')::int, 25);
  m_a numeric; m_n numeric;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  if v_cap is null or v_cap <= 0 or v_a is null or v_n is null or v_a < 0 or v_n < 0 or v_a > 30 or v_n > 30 or v_ans < 1 or v_ans > 40 then raise exception 'Capital, taux et amortissement invalides.' using errcode = 'PT422'; end if;
  m_a := crm.mensualite(v_cap, v_a, v_ans); m_n := crm.mensualite(v_cap, v_n, v_ans);
  return jsonb_build_object('mensualite_actuelle', round(m_a, 2), 'mensualite_nouvelle', round(m_n, 2), 'ecart_mensuel', round(m_a - m_n, 2), 'ecart_annuel', (round(m_a, 2) - round(m_n, 2)) * 12);  -- 12 fois l'écart mensuel affiché : les deux chiffres concordent
end $$;
revoke all on function public.lanceur_taux(), public.lanceur_refinancement(jsonb) from public, anon;
grant execute on function public.lanceur_taux(), public.lanceur_refinancement(jsonb) to authenticated;
