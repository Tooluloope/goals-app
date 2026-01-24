'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Coins,
  Palette,
  RefreshCcw,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  buildAreaConfigFromFocus,
  clearOnboardingSelection,
  markOnboardingFocusSynced,
  saveOnboardingSelection,
} from '@/lib/onboarding';

const focusAreas = [
  { id: 'faith', label: 'Faith', icon: Sun, color: 'text-violet-500' },
  { id: 'family', label: 'Family', icon: Users, color: 'text-pink-500' },
  { id: 'career', label: 'Career', icon: Briefcase, color: 'text-emerald-500' },
  { id: 'health', label: 'Health', icon: Activity, color: 'text-red-500' },
  { id: 'finances', label: 'Finances', icon: Coins, color: 'text-amber-500' },
  { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-sky-500' },
  { id: 'community', label: 'Community', icon: Sparkles, color: 'text-blue-500' },
  { id: 'creativity', label: 'Creativity', icon: Palette, color: 'text-purple-500' },
];

const features = [
  {
    title: 'Shared Habits',
    description: 'Track daily routines together',
    icon: RefreshCcw,
  },
  {
    title: 'Joint Goals',
    description: 'Align on big milestones',
    icon: Target,
  },
  {
    title: 'Collaborative Journal',
    description: 'Shared memories & reflections',
    icon: BookOpen,
  },
];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace } = useAuthStore();
  const { setAreasForWorkspace } = useConfigStore();

  const [step, setStep] = useState<'vision' | 'invite'>('vision');
  const [selected, setSelected] = useState<string[]>(['family']);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = step === 'vision' ? 50 : 100;

  const toggleFocus = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleVisionNext = async () => {
    if (selected.length === 0) {
      toast({
        title: 'Select at least one focus area',
        description: 'Choose the areas you want to focus on.',
        variant: 'destructive',
      });
      return;
    }

    saveOnboardingSelection(selected);

    if (currentWorkspace) {
      setIsSubmitting(true);
      try {
        const areas = buildAreaConfigFromFocus(selected);
        setAreasForWorkspace(currentWorkspace.id, areas);
        await apiClient.updateWorkspaceConfig(currentWorkspace.id, { areas });
        markOnboardingFocusSynced();
      } catch {
        // Continue anyway
      } finally {
        setIsSubmitting(false);
      }
    }

    setStep('invite');
  };

  const handleFinish = async (skipInvite = false) => {
    setIsSubmitting(true);
    try {
      if (!skipInvite && partnerEmail.trim() && currentWorkspace) {
        await apiClient.inviteToWorkspace(currentWorkspace.id, partnerEmail.trim());
        toast({
          title: 'Invite sent!',
          description: `We sent an invitation to ${partnerEmail}`,
        });
      }

      clearOnboardingSelection();
      onOpenChange(false);
      router.push('/dashboard');
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Progress bar */}
        <div className="border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {step === 'vision' ? 'Step 1: Choose Your Focus' : 'Step 2: Invite Partner'}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </div>

        {step === 'vision' ? (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Welcome to Alignia</DialogTitle>
              <DialogDescription className="text-base">
                Select the life areas you want to focus on. These will shape your goals and habits.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {focusAreas.map((area) => {
                const isSelected = selected.includes(area.id);
                const Icon = area.icon;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleFocus(area.id)}
                    className={cn(
                      'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      'hover:border-primary/50 hover:bg-muted/50',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                        isSelected ? 'bg-primary/10' : 'bg-muted'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          isSelected ? area.color : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {area.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  clearOnboardingSelection();
                  onOpenChange(false);
                  router.push('/dashboard');
                }}
              >
                Skip for now
              </Button>
              <Button onClick={handleVisionNext} disabled={isSubmitting || selected.length === 0}>
                {isSubmitting ? 'Saving...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Better Together</DialogTitle>
              <DialogDescription className="text-base">
                Invite your partner or family member to share goals and build habits together.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-6 space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-6">
              <Label htmlFor="partner-email" className="text-sm font-medium">
                Partner&apos;s email address
              </Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="partner@email.com"
                className="mt-2"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => handleFinish(true)} disabled={isSubmitting}>
                Skip for now
              </Button>
              <Button onClick={() => handleFinish(false)} disabled={isSubmitting}>
                {isSubmitting
                  ? 'Sending...'
                  : partnerEmail.trim()
                    ? 'Send Invite & Finish'
                    : 'Finish Setup'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              You can always invite them later from settings.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
