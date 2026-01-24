import type { AreaConfig } from '@/types/config';
import { generateId } from '@/lib/utils';

export const ONBOARDING_FOCUS_STORAGE_KEY = 'onboarding-focus-areas';
const ONBOARDING_FOCUS_SYNC_KEY = 'onboarding-focus-synced';

export const onboardingFocusAreas = [
  {
    id: 'faith',
    label: 'Faith',
    color: 'violet',
    description: 'Spiritual growth and practices',
  },
  {
    id: 'family',
    label: 'Family',
    color: 'pink',
    description: 'Family relationships and rituals',
  },
  {
    id: 'career',
    label: 'Career',
    color: 'emerald',
    description: 'Professional growth and direction',
  },
  {
    id: 'health',
    label: 'Health',
    color: 'red',
    description: 'Physical and mental wellbeing',
  },
  {
    id: 'finances',
    label: 'Finances',
    color: 'amber',
    description: 'Financial goals and stewardship',
  },
  {
    id: 'growth',
    label: 'Growth',
    color: 'sky',
    description: 'Learning, curiosity, and personal development',
  },
  {
    id: 'community',
    label: 'Community',
    color: 'blue',
    description: 'Relationships and shared impact',
  },
  {
    id: 'creativity',
    label: 'Creativity',
    color: 'purple',
    description: 'Making, building, and creative expression',
  },
];

export function loadOnboardingSelection(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ONBOARDING_FOCUS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOnboardingSelection(selection: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_FOCUS_STORAGE_KEY, JSON.stringify(selection));
}

export function clearOnboardingSelection() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ONBOARDING_FOCUS_STORAGE_KEY);
  window.localStorage.removeItem(ONBOARDING_FOCUS_SYNC_KEY);
}

export function markOnboardingFocusSynced() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_FOCUS_SYNC_KEY, 'true');
}

export function isOnboardingFocusSynced(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ONBOARDING_FOCUS_SYNC_KEY) === 'true';
}

export function buildAreaConfigFromFocus(selection: string[]): AreaConfig[] {
  const orderMap = new Map<string, number>();
  selection.forEach((id, index) => orderMap.set(id, index + 1));

  return onboardingFocusAreas
    .filter((area) => selection.includes(area.id))
    .map((area) => ({
      id: `area-${area.id}-${generateId()}`,
      name: area.label,
      color: area.color,
      order: orderMap.get(area.id) ?? 1,
      description: area.description,
      isDefault: true,
    }));
}
