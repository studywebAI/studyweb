import { AppProvider } from '@/components/app-provider';
import { AppContainer } from '@/components/app-container';

export default function Home() {
  return (
    // AppProvider will now handle the Supabase session
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}
