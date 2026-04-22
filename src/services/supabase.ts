import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

// Supabase client is only created when credentials are configured.
// All callers must guard with `if (!supabase)` before using.
export const supabase =
  ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY
    ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
    : null;
