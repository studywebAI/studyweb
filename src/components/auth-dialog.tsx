'use client';
import React, { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useApp } from './app-provider';

export function AuthDialog() {
  const { isAuthDialogOpen, setAuthDialogOpen, supabase } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      setAuthDialogOpen(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a confirmation link.');
      // Don't close the dialog, show the message
    }
  };
  
  const handleGitHubLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  // Reset state when dialog opens/closes or switches mode
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError(null);
    setMessage(null);
  }, [isAuthDialogOpen, isSignUp]);

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create an account' : 'Sign In'}</DialogTitle>
          <DialogDescription>
            {isSignUp ? 'Enter your email and password to create an account.' : 'Sign in to save and access your study sessions.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             <Button type="submit" className="w-full mt-6">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && <p className="text-sm text-green-500 text-center">{message}</p>}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button variant="outline" onClick={handleGitHubLogin}>
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
        <DialogFooter className="text-sm text-center justify-center">
          <p>
            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
