import { AppProvider } from '@/components/app-provider';
import { AppContainer } from '@/components/app-container';

export default function Home() {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}
