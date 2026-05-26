#!/usr/bin/env node
/**
 * Verifies production URLs from apps/mobile/eas.json preview profile.
 * Run: pnpm verify:deploy
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const easPath = join(root, 'apps/mobile/eas.json');
const eas = JSON.parse(readFileSync(easPath, 'utf8'));
const env = eas.build?.preview?.env ?? {};

const apiUrl = (env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const supabaseUrl = (env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let failed = false;

async function check(label, url, validate, headers = {}) {
  if (!url) {
    console.error(`[FAIL] ${label}: missing URL in eas.json preview env`);
    failed = true;
    return;
  }
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers,
    });
    const text = await res.text();
    if (validate(res, text)) {
      console.log(`[OK] ${label}: ${url}`);
    } else {
      console.error(`[FAIL] ${label}: ${url} → HTTP ${res.status} ${text.slice(0, 120)}`);
      failed = true;
    }
  } catch (err) {
    console.error(`[FAIL] ${label}: ${url} → ${err instanceof Error ? err.message : err}`);
    failed = true;
  }
}

await check('Roam API /', `${apiUrl}/`, (res, text) => {
  if (!res.ok) return false;
  try {
    return JSON.parse(text)?.name === 'Roam API';
  } catch {
    return false;
  }
});

await check('Roam API /health', `${apiUrl}/health`, (res, text) => {
  if (!res.ok) return false;
  try {
    return JSON.parse(text)?.status === 'ok';
  } catch {
    return false;
  }
});

await check(
  'Supabase /auth/v1/health',
  `${supabaseUrl}/auth/v1/health`,
  (res) => res.ok,
  {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  }
);

if (failed) {
  console.error('\nDeploy check failed. Fix Render API (Node blueprint) and Supabase project URL in eas.json.');
  process.exit(1);
}

console.log('\nAll deploy health checks passed.');
