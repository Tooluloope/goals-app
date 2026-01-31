'use client';

import { useState } from 'react';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationPromptProps {
  email?: string | null;
}

export function EmailVerificationPrompt({ email }: EmailVerificationPromptProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      await apiClient.resendVerificationEmail();
      setSent(true);
      toast({
        title: 'Verification email sent',
        description: email
          ? `We sent a new verification link to ${email}.`
          : 'We sent a new verification link to your inbox.',
        variant: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to resend verification email';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Verify your email to continue</CardTitle>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to {email || 'your email address'}. Please verify to access
            your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border bg-background/80 px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Need a new link? We can resend it anytime.</span>
          </div>
          <Button onClick={handleResend} disabled={isSending} className="w-full">
            {isSending ? (
              'Sending...'
            ) : sent ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Send again
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
