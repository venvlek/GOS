import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase credentials. Create a .env file at the project root with ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — see .env.example.'
  );
}

export const supabase = createClient(url || '', anonKey || '');
