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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

const otpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6, { message: 'Token must be 6 digits.' }).max(6),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const { toast } = useToast();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const handleEmailSubmit: SubmitHandler<EmailFormValues> = async (data) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setAuthEmail(data.email);
        setShowOtpForm(true);
        toast({
          title: 'Check your email',
          description: 'We sent you a one-time password.',
        });
      }
    });
  };

  const handleOtpSubmit: SubmitHandler<OtpFormValues> = async (data) => {
    startTransition(async () => {
        const { data: { session }, error } = await supabase.auth.verifyOtp({
            email: authEmail,
            token: data.token,
            type: 'email',
        });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else if(session) {
        toast({
          title: 'Success!',
          description: 'You are now signed in.',
        });
        onOpenChange(false);
        // The onAuthStateChange listener in AppProvider will handle the rest
      }
    });
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
        // Reset state on close
        setShowOtpForm(false);
        setAuthEmail('');
        emailForm.reset();
        otpForm.reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Started</DialogTitle>
          <DialogDescription>
            {showOtpForm 
             ? 'Enter the 6-digit code sent to your email.'
             : 'Sign in or create an account with a secure magic link.'}
          </DialogDescription>
        </DialogHeader>
        
        {!showOtpForm ? (
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...emailForm.register('email')} />
                    {emailForm.formState.errors.email && <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue with Email
                </Button>
            </form>
        ) : (
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="token">One-Time Password</Label>
                    <Input id="token" type="text" placeholder="123456" {...otpForm.register('token')} />
                    {otpForm.formState.errors.token && <p className="text-sm text-destructive">{otpForm.formState.errors.token.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </form>
        )}

        <DialogFooter className="text-xs text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
