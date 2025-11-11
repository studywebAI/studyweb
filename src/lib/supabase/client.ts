import { createClient } from '@supabase/supabase-js';

// The ! after the environment variable asserts that it's non-null.
// This is safe because the app will fail to build if these are not set.
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
