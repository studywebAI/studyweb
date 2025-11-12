'use client';

import { AppProvider } from '@/components/app-provider';
import { AppContainer } from '@/components/app-container';

export default function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Supabase Credentials Missing</h1>
          <p className="mt-2 text-muted-foreground">
            Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      <AppContainer />
    </AppProvider>
  );
}
