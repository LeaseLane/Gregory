-- Compte en fidéicommis, étape 2 : une référence de paiement par logement.
--
-- Le locataire l'écrit dans le message de son virement Interac; le rapprochement
-- (étape 3) s'en sert pour savoir à quel logement — donc à quel propriétaire —
-- appartient un dépôt arrivé dans le compte unique.
--   Format : « LL-10001 » (préfixe + 5 chiffres). Court à taper, sans lettre
--   ambiguë; stable : elle ne change pas si le loyer, le locataire ou
--   l'adresse change. Jamais réutilisée.

create sequence if not exists public.units_reference_paiement_seq start 10001;

alter table public.units
  add column if not exists reference_paiement text;

update public.units
   set reference_paiement = 'LL-' || nextval('public.units_reference_paiement_seq')
 where reference_paiement is null;

alter table public.units
  alter column reference_paiement set default ('LL-' || nextval('public.units_reference_paiement_seq')),
  alter column reference_paiement set not null;

do $$ begin
  alter table public.units add constraint units_reference_paiement_unique unique (reference_paiement);
exception when duplicate_object then null; end $$;

-- Adresse Interac du compte en fidéicommis. Vide tant que le compte (BMO)
-- n'est pas ouvert : le portail locataire n'affiche alors AUCUNE consigne
-- de paiement, pour ne pas envoyer de loyers vers un compte qui n'existe pas.
alter table public.company_settings
  add column if not exists fiducie_interac_courriel text;

-- Consigne de paiement pour le locataire connecté : son logement actif et sa
-- référence, plus l'adresse Interac. Ne révèle rien d'autre (pas d'accès à
-- company_settings pour les locataires).
create or replace function public.consigne_paiement_locataire()
  returns table (reference_paiement text, courriel_interac text, monthly_rent numeric, unit_number text, address text)
  language sql stable security definer set search_path to 'public' as $$
  select u.reference_paiement, cs.fiducie_interac_courriel, l.monthly_rent, u.unit_number, b.address
    from tenants t
    join leases l on l.tenant_id = t.id and l.status = 'active'
    join units u on u.id = l.unit_id
    join buildings b on b.id = u.building_id
    cross join (select fiducie_interac_courriel from company_settings where id = true) cs
   where t.user_id = auth.uid()
     and cs.fiducie_interac_courriel is not null
   order by l.start_date desc
   limit 1;
$$;
revoke all on function public.consigne_paiement_locataire() from public, anon;
grant execute on function public.consigne_paiement_locataire() to authenticated;
