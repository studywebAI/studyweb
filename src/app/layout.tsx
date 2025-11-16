// src/app/layout.tsx
import { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {children}
        </div>
      </body>
    </html>
  );
}
