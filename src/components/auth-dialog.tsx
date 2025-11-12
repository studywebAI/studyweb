'use client';

import React, { useState, useTransition } from 'react';
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
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { useApp } from './app-provider';

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { supabase } = useApp();
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { toast } = useToast();

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleAuthSubmit: SubmitHandler<AuthFormValues> = async (data) => {
    startTransition(async () => {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success!',
            description: 'You are now logged in.',
          });
          onOpenChange(false);
        }
      } else { // Sign Up
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
           toast({
            title: 'Sign Up Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
            toast({
              title: 'Account Created!',
              description: 'Please check your email for a confirmation link.',
            });
            onOpenChange(false);
        }
      }
    });
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      authForm.reset();
    }
    onOpenChange(isOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Get Started</DialogTitle>
            <DialogDescription>
              {authMode === 'login' 
                  ? 'Login to your account to access your saved sessions.'
                  : 'Create an account to save your progress.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs
              value={authMode}
              onValueChange={(value) => setAuthMode(value as 'login' | 'signup')}
              className="w-full"
          >
              <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
              <Form {...authForm}>
                  <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4 pt-4">
                  <FormField
                      control={authForm.control}
                      name="email"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={authForm.control}
                      name="password"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                  </Button>
                  </form>
              </Form>
              </TabsContent>
              <TabsContent value="signup">
                  <Form {...authForm}>
                  <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4 pt-4">
                      <FormField
                      control={authForm.control}
                      name="email"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                              <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                      control={authForm.control}
                      name="password"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                      </Button>
                  </form>
                  </Form>
              </TabsContent>
          </Tabs>
          <DialogFooter className="pt-4 text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service.
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
