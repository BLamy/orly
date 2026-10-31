// Secrets for the film pipeline. Keys live in the gitignored repo .env; never print them.
//
//   const key = secret('ELEVENLABS_API_KEY');   // throws "ELEVENLABS_API_KEY missing" (no value echoed)
//   console.error(redact(errText));              // masks every loaded secret value in a string
import path from 'node:path';
import { ROOT } from './paths.mjs';

let loaded = false;
const SECRET_NAMES = ['ELEVENLABS_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'NOUN_PROJECT_KEY', 'NOUN_PROJECT_SECRET'];

export function loadEnv() {
  if (loaded) return;
  loaded = true;
  try {
    process.loadEnvFile(path.join(ROOT, '.env')); // does not override existing env vars
  } catch {
    /* no .env: rely on the environment */
  }
}

export function secret(name) {
  loadEnv();
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`${name} missing (set it in the gitignored .env)`);
  return v.trim();
}

export function hasSecret(name) {
  loadEnv();
  return !!process.env[name]?.trim();
}

export function redact(s) {
  let out = String(s);
  for (const n of SECRET_NAMES) {
    const v = process.env[n]?.trim();
    if (v && v.length > 6) out = out.split(v).join('***');
  }
  return out.replace(/(xi-api-key|authorization)["']?\s*[:=]\s*["']?[^\s"',}]+/gi, '$1: ***');
}
