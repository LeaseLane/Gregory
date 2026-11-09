-- Diagnostic (lecture seule) : facteurs 2FA du compte de démonstration mj.berube (préproduction).
select f.id, f.factor_type, f.status, f.friendly_name, f.created_at, f.updated_at
from auth.mfa_factors f join auth.users u on u.id = f.user_id where u.email = 'mj.berube@leaselane.test' order by f.created_at;
