import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/components/app-provider';
import { Toaster } from '@/components/ui/toaster';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontHeadline = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});


export const metadata = {
  title: 'StudyGeniusAI',
  description: 'Generate study materials from your notes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontHeadline.variable
        )}
      >
        <AppProvider>
            {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}
