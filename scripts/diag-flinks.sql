-- Identifiant du compte de test P6-A (domaine .test, ne reçoit aucun courriel).
select o.id from owners o join users u on u.id = o.user_id
where u.email = 'test-owner-a@leaselane.test';
