-- Paiement par carte (Moneris GO) · 19 nov. 2026, point 3 du plan. Éteint tant que Moneris n'a pas confirmé par écrit
-- (liens de paiement, mise en service, dépôt au fidéicommis, frais facturés à part).
--  - company_settings.carte_active (faux) : allumé ou éteint dans « Prêt pour le 1er » par fiducie_comptes_maj (alerte EQP-15, garde en base);
--  - allumé : le portail locataire offre « demander un lien de paiement par carte » (message à l'équipe, qui crée le lien dans Moneris GO).
--    Aucuns frais ajoutés au locataire.
--  - le dépôt quotidien de Moneris (plusieurs locataires) se répartit par loyer avec « Répartir… » (fiducie_repartir_depot, déjà en place).
-- ponytail: pas d'import du rapport Moneris tant qu'on n'en a pas un exemple réel; à ajouter avec le format.

alter table public.company_settings add column if not exists carte_active boolean not null default false;

create or replace function crm.carte_offerte() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select carte_active from public.company_settings where id = true), false);
$$;
revoke all on function crm.carte_offerte() from public, anon;
grant execute on function crm.carte_offerte() to authenticated, service_role;

-- Garde des comptes : l'interrupteur de la carte aussi.
create or replace function public.company_settings_comptes_garde() returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('fiducie.comptes_maj', true), '') = '1' then return new; end if;
  if (new.fiducie_institution, new.fiducie_transit, new.fiducie_compte, new.exploitation_nom, new.exploitation_institution, new.exploitation_transit, new.exploitation_compte,
      new.bmo_originateur, new.bmo_centre, new.fiducie_interac_courriel, new.prelevements_actifs, new.carte_active)
     is distinct from
     (old.fiducie_institution, old.fiducie_transit, old.fiducie_compte, old.exploitation_nom, old.exploitation_institution, old.exploitation_transit, old.exploitation_compte,
      old.bmo_originateur, old.bmo_centre, old.fiducie_interac_courriel, old.prelevements_actifs, old.carte_active) then
    raise exception 'Comptes bancaires de LeaseLane : à modifier dans Finances, Fidéicommis, Prêt pour le 1er (alerte aux administrateurs).' using errcode = 'PT403';
  end if;
  return new;
end $$;

do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_comptes_maj(jsonb,uuid)'::regprocedure);
  if position('carte_active' in d) = 0 then
    n := replace(d, '  if p ? ''interac'' then',
      '  if p ? ''carte'' and (p ->> ''carte'')::boolean is distinct from c.carte_active then
    update public.company_settings set carte_active = (p ->> ''carte'')::boolean, updated_at = now() where id = true;
    quoi := quoi || (''Paiement par carte (Moneris) : '' || case when (p ->> ''carte'')::boolean then ''offert aux locataires'' else ''retiré'' end); end if;
  if p ? ''interac'' then');
    if n = d then raise exception 'fiducie_comptes_maj : ancre introuvable'; end if;
    execute n;
  end if;

  d := pg_get_functiondef('public.fiducie_preparation()'::regprocedure);
  if position('carte_active' in d) = 0 then
    n := replace(d, '''etat'', ''info'', ''detail'', ''Pas encore branché : en attente de la confirmation écrite de Moneris.'');',
      '''etat'', case when c.carte_active then ''ok'' else ''info'' end,
    ''detail'', case when c.carte_active then ''Offert aux locataires (lien sur demande, sans frais pour eux). Dépôt Moneris : « Répartir… » par loyer.''
                     else ''Éteint : à allumer quand Moneris aura confirmé par écrit (liens, mise en service, dépôt au fidéicommis, frais à part).'' end);');
    if n = d then raise exception 'fiducie_preparation : ancre introuvable'; end if;
    execute n;
  end if;

  d := pg_get_functiondef('public.portail_locataire_paiements()'::regprocedure);
  if position('carte_offerte' in d) = 0 then
    n := replace(d, '''prelevement_offert'', crm.prelevements_offerts(),', '''prelevement_offert'', crm.prelevements_offerts(), ''carte_offerte'', crm.carte_offerte(),');
    if n = d then raise exception 'portail_locataire_paiements : ancre introuvable'; end if;
    execute n;
  end if;
end $$;
