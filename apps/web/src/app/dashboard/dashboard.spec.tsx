'use client';

import { render, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { setShouldShowOnboarding } from '@/lib/onboarding';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/dashboard',
  useParams: () => ({}),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getSubscriptionStatus: jest.fn(),
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
  useViewMode: jest.fn(() => 'focus'),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/onboarding', () => ({
  setShouldShowOnboarding: jest.fn(),
}));

jest.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dashboard/daily-focus', () => ({
  DailyFocus: () => <div />,
}));

jest.mock('@/components/dashboard/upcoming-deadlines', () => ({
  UpcomingDeadlines: () => <div />,
}));

jest.mock('@/components/dashboard/reviews-due', () => ({
  ReviewsDue: () => <div />,
}));

jest.mock('@/components/dashboard/stale-projects', () => ({
  StaleProjects: () => <div />,
}));

jest.mock('@/components/dashboard/quick-actions', () => ({
  QuickActions: () => <div />,
}));

jest.mock('@/components/dashboard/progress-stats', () => ({
  ProgressStats: () => <div />,
}));

jest.mock('@/components/ai/ai-insights-panel', () => ({
  AiInsightsPanel: () => <div />,
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockUpdateSettings = jest.fn();
const mockToast = jest.fn();

const baseState = {
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  currentWorkspace: { id: 'ws-1', type: 'personal' },
  updateSettings: mockUpdateSettings,
};

const setupAuthStore = () => {
  mockUseAuthStore.mockImplementation((selector?: any) =>
    selector ? selector(baseState) : baseState
  );
};

describe('Dashboard checkout redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthStore();
    mockUseToast.mockReturnValue({ toast: mockToast } as any);
    mockSearchParams = new URLSearchParams();
  });

  it('handles checkout cancelled by restoring focus mode and redirecting', async () => {
    mockSearchParams = new URLSearchParams('checkout=cancelled');

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ viewMode: 'focus' });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Checkout cancelled',
      })
    );
    expect(setShouldShowOnboarding).toHaveBeenCalledWith(true);
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });

  it('handles checkout success by enabling power mode and redirecting', async () => {
    mockSearchParams = new URLSearchParams('checkout=success');
    mockApiClient.getSubscriptionStatus.mockResolvedValue({ plan: 'PRO' } as any);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ viewMode: 'power' });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Subscription active',
      })
    );
    expect(setShouldShowOnboarding).toHaveBeenCalledWith(true);
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });
});
