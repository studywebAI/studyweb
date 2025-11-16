import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import LoginPage from './login/page';

export default async function Home() {
  const supabase = createClient(cookies());

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return <LoginPage />;
  }

  // Render your authenticated home page content here
  return (
      <div>
        <h1>Welcome!</h1>
        <p>You are logged in.</p>
      </div>
  );
}
