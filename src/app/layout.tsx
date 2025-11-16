import { Inter, Space_Grotesk } from 'next/font/google';
import { AppProvider } from '@/components/app-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-serif',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <AppProvider>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {children}
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
