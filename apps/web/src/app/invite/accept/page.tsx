'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Loader2, CheckCircle, XCircle, Clock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface InvitePreview {
  workspace: { name: string };
  email: string;
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user, loadWorkspaces } = useAuthStore();
  const { toast } = useToast();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load invite preview
  useEffect(() => {
    if (!token) {
      setError('Invalid invite link - no token provided');
      setIsLoading(false);
      return;
    }

    const loadPreview = async () => {
      try {
        const data = await apiClient.previewInvite(token);
        setPreview(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid or expired invite';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      await apiClient.acceptInvite(token);
      await loadWorkspaces();
      setSuccess(true);
      toast({
        title: 'Invitation accepted',
        description: `You've joined ${preview?.workspace.name}`,
        variant: 'success',
      });
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invite';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLogin = () => {
    // Store the invite URL to redirect back after login
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
    }
    router.push('/auth/login');
  };

  const handleSignup = () => {
    // Store the invite URL to redirect back after signup
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
    }
    router.push('/auth/signup');
  };

  const isExpired = preview ? new Date(preview.expiresAt) < new Date() : false;
  const emailMismatch = isAuthenticated && user && preview && user.email !== preview.email;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You&apos;ve successfully joined {preview?.workspace.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Redirecting to dashboard...</p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>You&apos;ve been invited to join a workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Workspace</p>
              <p className="font-semibold">{preview?.workspace.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invited email</p>
              <p className="font-medium">{preview?.email}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                {isExpired
                  ? 'This invite has expired'
                  : `Expires ${new Date(preview?.expiresAt || '').toLocaleDateString()}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          {isExpired ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Please ask the workspace owner to send a new invitation.
              </p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>
          ) : isAuthenticated ? (
            emailMismatch ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="font-medium text-amber-800">Email mismatch</p>
                  <p className="text-amber-700 mt-1">
                    This invite was sent to <strong>{preview?.email}</strong>, but you&apos;re
                    logged in as <strong>{user?.email}</strong>.
                  </p>
                  <p className="text-amber-700 mt-1">
                    Please log in with the correct account or ask for a new invite.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Store the invite URL to redirect back after login with different account
                    if (typeof window !== 'undefined') {
                      const currentUrl =
                        window.location.pathname + window.location.search + window.location.hash;
                      sessionStorage.setItem('redirectAfterLogin', currentUrl);
                    }
                    useAuthStore.getState().logout();
                    router.push('/auth/login');
                  }}
                >
                  Log in with different account
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Please log in or create an account to accept this invitation
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleLogin}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Button>
                <Button className="flex-1" onClick={handleSignup}>
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
