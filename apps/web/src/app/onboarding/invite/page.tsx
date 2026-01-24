'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, RefreshCcw, Sparkles, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  buildAreaConfigFromFocus,
  clearOnboardingSelection,
  isOnboardingFocusSynced,
  loadOnboardingSelection,
  markOnboardingFocusSynced,
} from '@/lib/onboarding';
import { useConfigStore } from '@/store/config-store';

const features = [
  {
    title: 'Shared Habits',
    description: 'Track daily routines as a team.',
    icon: RefreshCcw,
  },
  {
    title: 'Joint Goals',
    description: 'Align on big-picture milestones for 2026.',
    icon: Target,
  },
  {
    title: 'Collaborative Journal',
    description: 'A private space for shared memories.',
    icon: BookOpen,
  },
];

export default function OnboardingInvitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace } = useAuthStore();
  const { setAreasForWorkspace } = useConfigStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  useEffect(() => {
    setSelectedFocus(loadOnboardingSelection());
  }, []);

  const focusCount = useMemo(() => selectedFocus.length, [selectedFocus]);

  const applyFocusIfNeeded = async () => {
    if (!currentWorkspace || selectedFocus.length === 0 || isOnboardingFocusSynced()) return;
    const areas = buildAreaConfigFromFocus(selectedFocus);
    setAreasForWorkspace(currentWorkspace.id, areas);
    await apiClient.updateWorkspaceConfig(currentWorkspace.id, { areas });
    markOnboardingFocusSynced();
  };

  const handleContinue = async () => {
    if (!currentWorkspace) {
      router.push('/dashboard');
      return;
    }

    setIsSubmitting(true);
    try {
      await applyFocusIfNeeded();

      if (email.trim()) {
        await apiClient.inviteToWorkspace(currentWorkspace.id, email.trim());
      }

      clearOnboardingSelection();
      router.push('/dashboard');
      toast({
        title: email.trim() ? 'Invite sent' : 'All set!',
        description: email.trim()
          ? 'We sent an invite to your partner.'
          : 'Your workspace is ready.',
      });
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await applyFocusIfNeeded();
    } catch {
      // Ignore config errors on skip to avoid blocking navigation.
    }
    clearOnboardingSelection();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0c1713] text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center px-8 py-14 lg:w-1/2 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-lg lg:mx-0">
            <div className="mb-10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                <span>Step 2 of 4</span>
                <span className="text-white/50">Onboarding Progress</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-300/20">
                <div className="h-full w-1/2 rounded-full bg-emerald-300" />
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">Better Together</h1>
              <p className="mt-4 text-base text-white/60 sm:text-lg">
                Set your 2026 expectations and build lasting habits with your partner.
              </p>
              {focusCount > 0 && (
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  {focusCount} focus areas selected
                </p>
              )}
            </div>

            <div className="mb-10 space-y-1">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200 transition group-hover:bg-emerald-300/25">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{feature.title}</p>
                      <p className="text-sm text-white/50">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="partner-email"
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60"
                >
                  Partner email address
                </label>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@email.com"
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-300"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <Button
                className="h-12 w-full rounded-2xl bg-emerald-300 font-semibold text-[#0b1511] shadow-[0_18px_35px_rgba(17,212,147,0.25)] transition hover:brightness-110"
                onClick={handleContinue}
                disabled={isSubmitting}
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Send Invite & Continue'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs font-semibold uppercase tracking-[0.2em] text-white/50 hover:bg-white/5 hover:text-emerald-200"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip for now
              </Button>
            </div>

            <p className="mt-8 text-center text-xs text-white/40">
              You can always invite them later from your settings.
            </p>
          </div>
        </div>

        <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-white/5 p-12 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-emerald-300/20 blur-[140px]" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-emerald-200/10 blur-[120px]" />
          </div>

          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#101d18] p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Family Workspace</p>
                  <p className="text-xs text-white/40">Shared goals for 2026</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-white/20" />
                <div className="h-2 w-2 rounded-full bg-white/20" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-2xl border border-white/5 bg-white/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                  2026 outlook
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <h2 className="text-3xl font-bold">74% aligned</h2>
                  <div className="flex items-end gap-1">
                    {[8, 12, 16, 20, 14].map((height, index) => (
                      <div
                        key={`bar-${index}`}
                        className="w-3 rounded-t bg-emerald-300/30"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                    <div className="h-24 w-3 rounded-t bg-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <Sparkles className="mb-3 h-5 w-5 text-emerald-200" />
                <p className="text-sm font-semibold">New Home Fund</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-emerald-300" />
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Joint goal • Active
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <BookOpen className="mb-3 h-5 w-5 text-emerald-200" />
                <p className="text-sm font-semibold">Paris Trip 2026</p>
                <div className="mt-3 flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-[#101d18] bg-white/10" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#101d18] bg-emerald-300 text-[10px] font-bold text-[#0b1511]">
                    +1
                  </div>
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Shared journal entry
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/5">
              <div
                className="relative h-32 w-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(4,12,8,0.7), rgba(4,12,8,0.2)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuADgglFEct4ZI0x5DqqOW58jzGI0MYzvzF2fXGdUMvOq2oTCoV5eJkDVKVwOlHEi1XFIIA9vySCbnTP9vHob6gJrrGzhjaAS0bbLMM8UuXNTqZBdQTeCJ8qbGDaavF_y7xSk8rTL5-5qnxqzPBWBJ5qFcc3pX4sHZ27byKLrGxBKgOS4cuOucTZyYfY6Vl4aSMKo83WXNEL5NT9-WhVQ-ZNN0ZnO-4X26nb__bG1lpFk5U5gLm1hIOejDZxLEPz9gRoco--PKZpmR8)',
                  backgroundPosition: 'center',
                }}
              />
              <div className="flex items-center justify-between bg-[#0f1915] px-4 py-3">
                <span className="text-xs text-white/60">Capture your 2026 memories together.</span>
                <Link
                  href="/onboarding/vision"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200"
                >
                  Preview
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 right-16 rounded-full bg-emerald-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0b1511] shadow-xl">
            Preview mode
          </div>
        </div>
      </div>
    </div>
  );
}
