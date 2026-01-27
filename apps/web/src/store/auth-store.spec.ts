import { useAuthStore } from './auth-store';
import { apiClient } from '@/lib/api-client';

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getWorkspaces: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUserSettings: jest.fn(),
    updateProfile: jest.fn(),
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
    setPassword: jest.fn(),
    deleteAccount: jest.fn(),
    hasTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('auth-store', () => {
  const mockApiUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    defaultWorkspaceId: 'ws-1',
    timezone: 'America/New_York',
    hasSetPassword: true,
    settings: {
      theme: 'light' as const,
      compactMode: false,
      showWelcomeOnLogin: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockApiWorkspace = {
    id: 'ws-1',
    name: 'My Workspace',
    type: 'personal' as const,
    ownerId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockApiWorkspace2 = {
    id: 'ws-2',
    name: 'Family Workspace',
    type: 'family' as const,
    ownerId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  // Helper to create a complete mock user for setState
  const createMockUser = (
    overrides: { name?: string; hasSetPassword?: boolean; defaultWorkspaceId?: string } = {}
  ) => ({
    id: 'user-1',
    name: overrides.name ?? 'Test',
    email: 'test@example.com',
    defaultWorkspaceId: overrides.defaultWorkspaceId ?? 'ws-1',
    timezone: 'UTC',
    hasSetPassword: overrides.hasSetPassword ?? true,
    settings: { theme: 'light' as const, compactMode: false, showWelcomeOnLogin: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      user: null,
      currentWorkspace: null,
      workspaces: [],
      isLoading: false,
      isAuthenticated: false,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.currentWorkspace).toBeNull();
      expect(state.workspaces).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully and set user state', async () => {
      mockApiClient.login.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace] as any);

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toBe(true);
      expect(mockApiClient.login).toHaveBeenCalledWith('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-1');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.currentWorkspace?.id).toBe('ws-1');
      expect(state.workspaces).toHaveLength(1);
    });

    it('should return false when login fails', async () => {
      mockApiClient.login.mockResolvedValue(null as any);

      const result = await useAuthStore.getState().login('test@example.com', 'wrong-password');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should return false and reset loading on error', async () => {
      mockApiClient.login.mockRejectedValue(new Error('Network error'));

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should use persisted workspace if it exists', async () => {
      // Set a persisted workspace first
      useAuthStore.setState({
        currentWorkspace: {
          id: 'ws-2',
          name: 'Family Workspace',
          type: 'family',
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockApiClient.login.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace, mockApiWorkspace2] as any);

      await useAuthStore.getState().login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.currentWorkspace?.id).toBe('ws-2');
    });

    it('should use default workspace if persisted is not found', async () => {
      mockApiClient.login.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace, mockApiWorkspace2] as any);

      await useAuthStore.getState().login('test@example.com', 'password');

      const state = useAuthStore.getState();
      // Should use ws-1 because it matches defaultWorkspaceId
      expect(state.currentWorkspace?.id).toBe('ws-1');
    });
  });

  describe('signup', () => {
    it('should signup successfully and set user state', async () => {
      mockApiClient.signup.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace] as any);

      const result = await useAuthStore
        .getState()
        .signup('Test User', 'test@example.com', 'password', 'UTC');

      expect(result).toBe(true);
      expect(mockApiClient.signup).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'password',
        'UTC'
      );

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-1');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should return false on signup error', async () => {
      mockApiClient.signup.mockRejectedValue(new Error('Email already exists'));

      const result = await useAuthStore.getState().signup('Test', 'test@example.com', 'password');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user from API response (for magic link auth)', async () => {
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace] as any);

      await useAuthStore.getState().setUser(mockApiUser as any);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-1');
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentWorkspace?.id).toBe('ws-1');
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      // First set authenticated state
      useAuthStore.setState({
        user: createMockUser(),
        currentWorkspace: {
          id: 'ws-1',
          name: 'Test',
          type: 'personal' as const,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        workspaces: [
          {
            id: 'ws-1',
            name: 'Test',
            type: 'personal' as const,
            ownerId: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isAuthenticated: true,
      });

      mockApiClient.logout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.currentWorkspace).toBeNull();
      expect(state.workspaces).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear state even if API logout fails', async () => {
      useAuthStore.setState({
        user: createMockUser(),
        isAuthenticated: true,
      });

      mockApiClient.logout.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('setCurrentWorkspace', () => {
    it('should set current workspace', () => {
      const workspace = {
        id: 'ws-1',
        name: 'Test',
        type: 'personal' as const,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useAuthStore.getState().setCurrentWorkspace(workspace);

      expect(useAuthStore.getState().currentWorkspace).toEqual(workspace);
    });
  });

  describe('loadWorkspaces', () => {
    it('should load workspaces when user is logged in', async () => {
      useAuthStore.setState({
        user: createMockUser({ defaultWorkspaceId: 'ws-1' }),
        currentWorkspace: null,
      });

      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace, mockApiWorkspace2] as any);

      await useAuthStore.getState().loadWorkspaces();

      const state = useAuthStore.getState();
      expect(state.workspaces).toHaveLength(2);
      expect(state.currentWorkspace?.id).toBe('ws-1');
    });

    it('should not load workspaces when user is not logged in', async () => {
      await useAuthStore.getState().loadWorkspaces();

      expect(mockApiClient.getWorkspaces).not.toHaveBeenCalled();
    });

    it('should preserve current workspace if it still exists', async () => {
      const currentWorkspace = {
        id: 'ws-2',
        name: 'Family',
        type: 'family' as const,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useAuthStore.setState({
        user: createMockUser(),
        currentWorkspace,
      });

      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace, mockApiWorkspace2] as any);

      await useAuthStore.getState().loadWorkspaces();

      expect(useAuthStore.getState().currentWorkspace?.id).toBe('ws-2');
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      useAuthStore.setState({
        user: createMockUser(),
      });

      const updatedUser = {
        ...mockApiUser,
        settings: {
          theme: 'dark' as const,
          compactMode: false,
          showWelcomeOnLogin: true,
        },
      };
      mockApiClient.updateUserSettings.mockResolvedValue(updatedUser as any);

      await useAuthStore.getState().updateSettings({ theme: 'dark' } as any);

      expect(mockApiClient.updateUserSettings).toHaveBeenCalledWith({ theme: 'dark' });
    });

    it('should not update settings when user is not logged in', async () => {
      await useAuthStore.getState().updateSettings({ theme: 'dark' } as any);

      expect(mockApiClient.updateUserSettings).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      useAuthStore.setState({
        user: createMockUser(),
      });

      const updatedUser = { ...mockApiUser, name: 'New Name' };
      mockApiClient.updateProfile.mockResolvedValue(updatedUser as any);

      await useAuthStore.getState().updateProfile({ name: 'New Name' });

      expect(mockApiClient.updateProfile).toHaveBeenCalledWith({ name: 'New Name' });
      expect(useAuthStore.getState().user?.name).toBe('New Name');
    });

    it('should not update profile when user is not logged in', async () => {
      await useAuthStore.getState().updateProfile({ name: 'New Name' });

      expect(mockApiClient.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    it('should change email and logout', async () => {
      useAuthStore.setState({
        user: createMockUser(),
        isAuthenticated: true,
        workspaces: [
          {
            id: 'ws-1',
            name: 'Test',
            type: 'personal' as const,
            ownerId: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentWorkspace: {
          id: 'ws-1',
          name: 'Test',
          type: 'personal' as const,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockApiClient.changeEmail.mockResolvedValue({
        message: 'Email changed',
        email: 'new@example.com',
      });

      const result = await useAuthStore.getState().changeEmail('new@example.com', 'password');

      expect(result).toBe(true);
      expect(mockApiClient.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('new@example.com');
      expect(state.isAuthenticated).toBe(false);
      expect(state.workspaces).toEqual([]);
    });

    it('should return false when user is not logged in', async () => {
      const result = await useAuthStore.getState().changeEmail('new@example.com', 'password');

      expect(result).toBe(false);
      expect(mockApiClient.changeEmail).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password and logout', async () => {
      useAuthStore.setState({
        user: createMockUser(),
        isAuthenticated: true,
      });

      mockApiClient.changePassword.mockResolvedValue({ message: 'Password changed' });

      const result = await useAuthStore.getState().changePassword('oldpass', 'newpass');

      expect(result).toBe(true);
      expect(mockApiClient.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });
      expect(mockApiClient.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should return false when user is not logged in', async () => {
      const result = await useAuthStore.getState().changePassword('oldpass', 'newpass');

      expect(result).toBe(false);
    });
  });

  describe('setPassword', () => {
    it('should set password and logout', async () => {
      useAuthStore.setState({
        user: createMockUser({ hasSetPassword: false }),
        isAuthenticated: true,
      });

      mockApiClient.setPassword.mockResolvedValue({ message: 'Password set' });

      const result = await useAuthStore.getState().setPassword('newpassword');

      expect(result).toBe(true);
      expect(mockApiClient.setPassword).toHaveBeenCalledWith('newpassword');
      expect(mockApiClient.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should return false when user is not logged in', async () => {
      const result = await useAuthStore.getState().setPassword('newpassword');

      expect(result).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and clear state', async () => {
      useAuthStore.setState({
        user: createMockUser(),
        isAuthenticated: true,
      });

      mockApiClient.deleteAccount.mockResolvedValue({ message: 'Account deleted' });

      const result = await useAuthStore.getState().deleteAccount('password');

      expect(result).toBe(true);
      expect(mockApiClient.deleteAccount).toHaveBeenCalledWith('password');
      expect(mockApiClient.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should return false when user is not logged in', async () => {
      const result = await useAuthStore.getState().deleteAccount('password');

      expect(result).toBe(false);
    });
  });

  describe('refreshUser', () => {
    it('should refresh user data', async () => {
      useAuthStore.setState({
        user: createMockUser({ name: 'Old Name' }),
      });

      const refreshedUser = { ...mockApiUser, name: 'New Name' };
      mockApiClient.getCurrentUser.mockResolvedValue(refreshedUser as any);

      await useAuthStore.getState().refreshUser();

      expect(useAuthStore.getState().user?.name).toBe('New Name');
    });

    it('should not refresh when user is not logged in', async () => {
      await useAuthStore.getState().refreshUser();

      expect(mockApiClient.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should not update state if getCurrentUser returns null', async () => {
      useAuthStore.setState({
        user: createMockUser(),
      });

      mockApiClient.getCurrentUser.mockResolvedValue(null as any);

      await useAuthStore.getState().refreshUser();

      expect(useAuthStore.getState().user?.name).toBe('Test');
    });
  });

  describe('initializeAuth', () => {
    it('should initialize auth when tokens exist and user is valid', async () => {
      mockApiClient.hasTokens.mockReturnValue(true);
      mockApiClient.getCurrentUser.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace] as any);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-1');
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentWorkspace?.id).toBe('ws-1');
    });

    it('should clear state when no tokens exist', async () => {
      mockApiClient.hasTokens.mockReturnValue(false);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear state when getCurrentUser returns null', async () => {
      mockApiClient.hasTokens.mockReturnValue(true);
      mockApiClient.getCurrentUser.mockResolvedValue(null as any);

      await useAuthStore.getState().initializeAuth();

      expect(mockApiClient.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should clear state when getCurrentUser throws', async () => {
      mockApiClient.hasTokens.mockReturnValue(true);
      mockApiClient.getCurrentUser.mockRejectedValue(new Error('Token expired'));

      await useAuthStore.getState().initializeAuth();

      expect(mockApiClient.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should use persisted workspace during initialization', async () => {
      useAuthStore.setState({
        currentWorkspace: {
          id: 'ws-2',
          name: 'Family',
          type: 'family' as const,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockApiClient.hasTokens.mockReturnValue(true);
      mockApiClient.getCurrentUser.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace, mockApiWorkspace2] as any);

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().currentWorkspace?.id).toBe('ws-2');
    });
  });

  describe('transformUser helper', () => {
    it('should handle missing optional fields', async () => {
      mockApiClient.login.mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        // Missing avatar, timezone, hasSetPassword, createdAt, updatedAt
        settings: {
          theme: 'light',
          compactMode: false,
          showWelcomeOnLogin: true,
        },
      } as any);
      mockApiClient.getWorkspaces.mockResolvedValue([mockApiWorkspace] as any);

      await useAuthStore.getState().login('test@example.com', 'password');

      const user = useAuthStore.getState().user;
      expect(user?.avatar).toBeUndefined();
      expect(user?.timezone).toBe('UTC');
      expect(user?.hasSetPassword).toBe(true);
      expect(user?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('transformWorkspace helper', () => {
    it('should handle missing ownerId', async () => {
      mockApiClient.login.mockResolvedValue(mockApiUser as any);
      mockApiClient.getWorkspaces.mockResolvedValue([
        {
          id: 'ws-1',
          name: 'Test',
          type: 'personal',
          // Missing ownerId
        } as any,
      ]);

      await useAuthStore.getState().login('test@example.com', 'password');

      const workspace = useAuthStore.getState().currentWorkspace;
      // Should fall back to workspace id
      expect(workspace?.ownerId).toBe('ws-1');
    });
  });

  describe('viewMode functionality', () => {
    it('should default to "focus" when user has no settings', () => {
      useAuthStore.setState({
        user: null,
      });

      const state = useAuthStore.getState();
      const viewMode = state.user?.settings?.viewMode || 'focus';
      expect(viewMode).toBe('focus');
    });

    it('should default to "focus" when user settings do not include viewMode', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            // viewMode is undefined
          },
        },
      });

      const state = useAuthStore.getState();
      const viewMode = state.user?.settings?.viewMode || 'focus';
      expect(viewMode).toBe('focus');
    });

    it('should return "focus" when viewMode is explicitly set to "focus"', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'focus',
          },
        },
      });

      const state = useAuthStore.getState();
      expect(state.user?.settings?.viewMode).toBe('focus');
    });

    it('should return "power" when viewMode is set to "power"', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'power',
          },
        },
      });

      const state = useAuthStore.getState();
      expect(state.user?.settings?.viewMode).toBe('power');
    });

    it('should update viewMode when state changes', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'focus',
          },
        },
      });

      let state = useAuthStore.getState();
      expect(state.user?.settings?.viewMode).toBe('focus');

      // Update settings to power mode
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'power',
          },
        },
      });

      state = useAuthStore.getState();
      expect(state.user?.settings?.viewMode).toBe('power');
    });
  });

  describe('isPowerMode logic', () => {
    it('should return false by default when user has no settings', () => {
      useAuthStore.setState({
        user: null,
      });

      const state = useAuthStore.getState();
      const isPower = state.user?.settings?.viewMode === 'power';
      expect(isPower).toBe(false);
    });

    it('should return false when user settings do not include viewMode', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            // viewMode is undefined
          },
        },
      });

      const state = useAuthStore.getState();
      const isPower = state.user?.settings?.viewMode === 'power';
      expect(isPower).toBe(false);
    });

    it('should return false when viewMode is "focus"', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'focus',
          },
        },
      });

      const state = useAuthStore.getState();
      const isPower = state.user?.settings?.viewMode === 'power';
      expect(isPower).toBe(false);
    });

    it('should return true when viewMode is "power"', () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'power',
          },
        },
      });

      const state = useAuthStore.getState();
      const isPower = state.user?.settings?.viewMode === 'power';
      expect(isPower).toBe(true);
    });
  });

  describe('updateSettings with viewMode', () => {
    it('should update viewMode setting to power', async () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'focus',
          },
        },
      });

      const updatedUser = {
        ...mockApiUser,
        settings: {
          theme: 'light' as const,
          compactMode: false,
          showWelcomeOnLogin: true,
          viewMode: 'power' as const,
        },
      };
      mockApiClient.updateUserSettings.mockResolvedValue(updatedUser as any);

      await useAuthStore.getState().updateSettings({ viewMode: 'power' });

      expect(mockApiClient.updateUserSettings).toHaveBeenCalledWith({ viewMode: 'power' });
      expect(useAuthStore.getState().user?.settings?.viewMode).toBe('power');
    });

    it('should update viewMode setting to focus', async () => {
      useAuthStore.setState({
        user: {
          ...createMockUser(),
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'power',
          },
        },
      });

      const updatedUser = {
        ...mockApiUser,
        settings: {
          theme: 'light' as const,
          compactMode: false,
          showWelcomeOnLogin: true,
          viewMode: 'focus' as const,
        },
      };
      mockApiClient.updateUserSettings.mockResolvedValue(updatedUser as any);

      await useAuthStore.getState().updateSettings({ viewMode: 'focus' });

      expect(mockApiClient.updateUserSettings).toHaveBeenCalledWith({ viewMode: 'focus' });
      expect(useAuthStore.getState().user?.settings?.viewMode).toBe('focus');
    });
  });
});
