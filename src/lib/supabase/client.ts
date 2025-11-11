import { createClient } from '@supabase/supabase-js';

// The ! after the environment variable asserts that it's non-null.
// This is safe because the app will fail to build if these are not set.
export const supabase = createClient(
    'https://your-project-id.supabase.co',
    'your-anon-key'
);