// Inscrit le deuxième facteur (TOTP) du compte de démonstration equipe-admin@leaselane.test (préproduction)
// et range son secret dans ~/.leaselane-staging-roles-totp.json (clé « admin »), comme les autres rôles. Rejouable.
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { MDP, TOTP, totp } from './connexion-role.mjs';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
if (env.NEXT_PUBLIC_SUPABASE_URL.includes('kdmwfbcziokygfcmjxeq')) throw new Error('Production : refusé.');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: e1 } = await sb.auth.signInWithPassword({ email: 'equipe-admin@leaselane.test', password: MDP });
if (e1) throw e1;
const { data: f } = await sb.auth.mfa.listFactors();
if (f.totp.some((x) => x.status === 'verified')) { console.log('Déjà inscrit :', TOTP.admin ? 'secret connu' : 'SECRET INCONNU'); process.exit(0); }
for (const x of f.all.filter((x) => x.status !== 'verified')) await sb.auth.mfa.unenroll({ factorId: x.id });
const { data: en, error: e2 } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'demo' });
if (e2) throw e2;
const { error: e3 } = await sb.auth.mfa.challengeAndVerify({ factorId: en.id, code: totp(en.totp.secret) });
if (e3) throw e3;
const fichier = process.env.HOME + '/.leaselane-staging-roles-totp.json';
writeFileSync(fichier, JSON.stringify({ ...TOTP, admin: en.totp.secret }, null, 2), { mode: 0o600 });
console.log('Facteur inscrit et secret rangé (clé « admin »).');
