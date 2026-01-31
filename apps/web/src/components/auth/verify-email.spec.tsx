'use client';

import { render, screen, waitFor, act } from '@testing-library/react';
import { VerifyEmail } from './verify-email';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/auth/verify-email',
  useParams: () => ({}),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    verifyEmail: jest.fn(),
    hasTokens: jest.fn(),
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockRefreshUser = jest.fn();

describe('VerifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseAuthStore.mockImplementation((selector?: any) =>
      selector ? selector({ refreshUser: mockRefreshUser }) : { refreshUser: mockRefreshUser }
    );
  });

  it('shows error when token is missing', async () => {
    render(<VerifyEmail />);

    expect(await screen.findByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText('No verification token provided.')).toBeInTheDocument();
  });

  it('verifies token and redirects to dashboard when signed in', async () => {
    jest.useFakeTimers();
    mockSearchParams = new URLSearchParams('token=valid-token');
    mockApiClient.verifyEmail.mockResolvedValue({ message: 'ok' });
    mockApiClient.hasTokens.mockReturnValue(true);

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(mockApiClient.verifyEmail).toHaveBeenCalledWith('valid-token');
    });

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.refresh).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
