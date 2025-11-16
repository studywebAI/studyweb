'use client';

// This page is no longer in use as the primary login method.
// The AuthDialog component is used instead.
// This file is kept to prevent breaking any potential lingering links,
// but it will simply redirect to the homepage.

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Redirecting...</h1>
      <p>If you are not redirected, <a href="/">click here to go to the homepage</a>.</p>
    </div>
  );
}
