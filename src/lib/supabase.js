import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client for the public leaderboard.
 *
 * The key here is the *publishable/anon* key, which is meant to ship inside
 * the browser bundle — the actual protection is Row Level Security on the
 * `scores` table, which allows select + insert and nothing else. A service
 * role key must never appear in this file.
 *
 * `supabase` is null when the env vars aren't set (a fresh clone with no
 * .env). Every caller checks for that and falls back to offline behaviour
 * rather than crashing, so the game itself still works with no backend.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false }, // nobody signs in; don't touch localStorage
      })
    : null;

export const hasSupabase = Boolean(supabase);
