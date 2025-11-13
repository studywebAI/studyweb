'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from './ui/label';
import { useApp } from './app-provider';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { supabase } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when dialog is closed or auth mode changes
    if (!open) {
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setError(null);
      }, 200); // delay to allow for closing animation
    }
  }, [open]);
  
  useEffect(() => {
      setEmail('');
      setPassword('');
      setError(null);
  }, [authMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const credentials = { email, password };

    try {
        if (authMode === 'login') {
            const { error } = await supabase.auth.signInWithPassword(credentials);
            if (error) throw error;
            toast({ title: 'Success!', description: 'You are now logged in.' });
        } else { // Sign Up
            const { error } = await supabase.auth.signUp({
                ...credentials,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
            toast({ title: 'Account Created!', description: 'Please check your email for a confirmation link.' });
        }
        onOpenChange(false);
    } catch (err: any) {
        const errorMessage = err.message || `An error occurred during ${authMode}.`;
        setError(errorMessage);
        toast({ title: `${authMode === 'login' ? 'Login' : 'Sign Up'} Failed`, description: errorMessage, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const AuthForm = ({ mode }: { mode: 'login' | 'signup' }) => (
    <form onSubmit={handleAuthSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>Email Address</Label>
            <Input 
                id={`${mode}-email`}
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor={`${mode}-password`}>Password</Label>
            <Input 
                id={`${mode}-password`}
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
            />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Login' : 'Create Account'}
        </Button>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Get Started</DialogTitle>
            <DialogDescription>
              {authMode === 'login' 
                  ? 'Login to access your saved study sessions.'
                  : 'Create an account to save your progress and history.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login"><AuthForm mode="login" /></TabsContent>
              <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
          </Tabs>
          <DialogFooter className="pt-2 text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service.
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
