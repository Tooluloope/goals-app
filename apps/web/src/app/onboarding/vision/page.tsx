'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Briefcase,
  Check,
  Coins,
  HelpCircle,
  Palette,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  buildAreaConfigFromFocus,
  markOnboardingFocusSynced,
  loadOnboardingSelection,
  saveOnboardingSelection,
} from '@/lib/onboarding';

const focusAreas = [
  { id: 'faith', label: 'Faith', icon: Sun },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'career', label: 'Career', icon: Briefcase },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'finances', label: 'Finances', icon: Coins },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'community', label: 'Community', icon: Sparkles },
  { id: 'creativity', label: 'Creativity', icon: Palette },
];

export default function OnboardingVisionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logout, currentWorkspace } = useAuthStore();
  const { setAreasForWorkspace } = useConfigStore();
  const [selected, setSelected] = useState<string[]>(['family']);
  const [isSaving, setIsSaving] = useState(false);

  const progress = 25;

  useEffect(() => {
    const saved = loadOnboardingSelection();
    if (saved.length > 0) {
      setSelected(saved.filter((id) => focusAreas.some((area) => area.id === id)));
    }
  }, []);

  const toggleFocus = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const handleNext = async () => {
    if (selected.length === 0) {
      toast({
        title: 'Pick at least one focus area',
        description: 'Select one or more pillars to continue.',
        variant: 'destructive',
      });
      return;
    }

    saveOnboardingSelection(selected);

    if (!currentWorkspace) {
      router.push('/onboarding/invite');
      return;
    }

    setIsSaving(true);
    try {
      const areas = buildAreaConfigFromFocus(selected);
      setAreasForWorkspace(currentWorkspace.id, areas);
      await apiClient.updateWorkspaceConfig(currentWorkspace.id, { areas });
      markOnboardingFocusSynced();
      toast({
        title: 'Vision saved',
        description: 'Your focus areas are set for 2026.',
      });
      router.push('/onboarding/invite');
    } catch (error) {
      toast({
        title: 'Failed to save vision',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f0f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-[380px] w-[380px] rounded-full bg-amber-400/20 blur-[140px]" />
        <div className="absolute right-[-15%] top-[20%] h-[420px] w-[420px] rounded-full bg-amber-200/10 blur-[160px]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[460px] w-[460px] rounded-full bg-amber-500/10 blur-[170px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Tempo</p>
              <h1 className="text-lg font-semibold tracking-tight">Alignia</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="h-10 rounded-full border border-white/10 bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10"
              onClick={handleLogout}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex flex-1 justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-5xl">
            <div className="mb-10 flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                <span>Step 1 of 4: Vision</span>
                <span className="text-white/60">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mb-12 text-center md:text-left">
              <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Welcome to your 2026
              </h2>
              <p className="mt-4 text-base text-white/60 sm:text-lg">
                Select the pillars of your year. These choices shape your workspace, goals, and the
                rhythm you want to protect.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {focusAreas.map((area) => {
                const isSelected = selected.includes(area.id);
                const Icon = area.icon;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleFocus(area.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative flex aspect-square flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all',
                      'hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-white/10',
                      isSelected &&
                        'border-amber-300/80 bg-amber-300/10 shadow-[0_0_28px_rgba(238,189,43,0.22)]'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <Icon
                        className={cn(
                          'h-7 w-7 text-white/35 transition-colors',
                          isSelected && 'text-amber-200',
                          !isSelected && 'group-hover:text-amber-200/80'
                        )}
                      />
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-all',
                          isSelected
                            ? 'border-amber-300 bg-amber-300 text-[#15110a]'
                            : 'border-white/20 text-transparent group-hover:border-amber-300/60'
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className={cn('text-base font-semibold', isSelected && 'text-amber-200')}>
                      {area.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2">
              <div
                className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(8,8,8,0.6), rgba(8,8,8,0.6)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuCp201xYRB-kutBdX2i4YOVO30BcjhZw_cys6eppuBSLFJNo4yfvLTDHGQYc_kjMSJ31nv62eZzquKNETsPHx6rSGRgjE-XSsDOljMKN3E5BHv8A0cMd5vuGY2uij37fM7TC5rxObS_2muF35SI2FnliGZOCIQABJpbZnVpiTKSzJv4NwBm1Vo0_8q3NP559bkPsdL5OkkoZpkQWpCI_AzRVdkPmGktgRCwqvlQKRe3XgVNohBlljYyptEuHz5NVAKRHo3n0dp2gRE)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="text-sm font-medium text-white/80 transition-opacity group-hover:text-white">
                  Visualizing your future...
                </span>
              </div>
              <div
                className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(8,8,8,0.6), rgba(8,8,8,0.6)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuCAWrBBjuGPplsxkxZ3TWCgW0ONClTwoa5fb9cz39rFHt7-h-n7DddAANwajDYZVDb4NXMjXnKxclAP2v1vSjFn4rr5HJcsEo6lk8pF30SySsyO0tQzwz-QIRtSyc22HbI7CvXu4HBAPg8GDfUepK-QkCo8RiA72NNZXmhv2e9LYX8v_w6Dxi0G58Pg-pCSwta0lEyWujgdaWexMMKB0kjGddV1NBCw_9mlrEp44SKmzlS--SwEb6A7tdf7EGIfcaDBf7IBkqvQP90)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="text-sm font-medium text-white/80 transition-opacity group-hover:text-white">
                  Designing your workspace...
                </span>
              </div>
            </div>

            <div className="mt-14 flex flex-col items-center gap-6">
              <Button
                className="h-14 w-full max-w-lg rounded-2xl bg-amber-300 text-base font-bold text-[#16110a] shadow-[0_20px_45px_rgba(238,189,43,0.25)] transition hover:brightness-110"
                onClick={handleNext}
                disabled={isSaving || selected.length === 0}
              >
                <span className="flex items-center justify-center gap-3">
                  {isSaving ? 'Saving...' : 'Next: Set Up Family Workspace'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
              <p className="text-xs text-white/40">
                You can always update these focus areas later in settings.
              </p>
            </div>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-6 text-xs text-white/40 sm:px-10 lg:px-16">
          <div className="flex gap-6">
            <a className="transition-colors hover:text-amber-200" href="#">
              Privacy Policy
            </a>
            <a className="transition-colors hover:text-amber-200" href="#">
              Terms of Service
            </a>
          </div>
          <p>2025 Alignia. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
