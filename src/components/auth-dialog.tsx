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

const codeSchema = z.object({
  code: z.string().min(6, { message: 'Code must be 6 digits.' }).max(6),
});


type AuthFormValues = z.infer<typeof authSchema>;
type CodeFormValues = z.infer<typeof codeSchema>;


interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { supabase } = useApp();
  const [isPending, startTransition] = useTransition();
  const [authView, setAuthView] = useState<'form' | 'awaiting_verification'>('form');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [verificationEmail, setVerificationEmail] = useState('');
  const { toast } = useToast();

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
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
            emailRedirectTo: undefined,
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
              description: 'Please check your email for a 6-digit verification code.',
            });
            setVerificationEmail(data.email);
            setAuthView('awaiting_verification');
        }
      }
    });
  };

  const handleCodeSubmit: SubmitHandler<CodeFormValues> = async (data) => {
     startTransition(async () => {
        const { error } = await supabase.auth.verifyOtp({
            email: verificationEmail,
            token: data.code,
            type: 'signup',
        });
        
        if (error) {
             toast({
                title: 'Verification Failed',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            // After successful verification, the user is also logged in
            toast({
                title: 'Email Verified!',
                description: "You're now logged in.",
            });
            onOpenChange(false);
        }
     });
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      authForm.reset();
      codeForm.reset();
      setAuthView('form');
      setVerificationEmail('');
    }
    onOpenChange(isOpen);
  };
  
  const AuthForms = () => (
    <>
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
    </>
  );

  const VerificationForm = () => (
    <>
         <DialogHeader>
          <DialogTitle>Check your email</DialogTitle>
          <DialogDescription>
            We've sent a 6-digit code to <span className="font-medium text-foreground">{verificationEmail}</span>. Enter it below to verify your email.
          </DialogDescription>
        </DialogHeader>
        <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and Login
                </Button>
              </form>
        </Form>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        {authView === 'form' ? <AuthForms /> : <VerificationForm />}
      </DialogContent>
    </Dialog>
  );
}
