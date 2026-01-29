import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let _prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.png',
    passwordHash: 'hashed-password',
    defaultWorkspaceId: 'workspace-123',
    timezone: 'America/New_York',
    settings: {
      theme: 'dark',
      emailPreferences: {
        weeklySummary: true,
        habitReminders: false,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockUserWithoutPassword = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    avatar: mockUser.avatar,
    defaultWorkspaceId: mockUser.defaultWorkspaceId,
    timezone: mockUser.timezone,
    settings: mockUser.settings,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const makeDataUrl = (mime: string, bytes: number[]) =>
    `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
  const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xdb];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    _prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user without password hash when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithoutPassword);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          defaultWorkspaceId: true,
          hasSetPassword: true,
          timezone: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        settings: {
          theme: 'light',
          emailPreferences: {
            weeklySummary: true,
            habitReminders: false,
          },
        },
      });

      const result = await service.updateSettings('user-123', {
        theme: 'light',
      });

      expect(result.settings).toEqual({
        theme: 'light',
        emailPreferences: {
          weeklySummary: true,
          habitReminders: false,
        },
      });
    });

    it('should update timezone separately from settings', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        timezone: 'Europe/London',
      });

      await service.updateSettings('user-123', {
        timezone: 'Europe/London',
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timezone: 'Europe/London',
          }),
        })
      );
    });

    it('should deep merge email preferences', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        settings: {
          theme: 'dark',
          emailPreferences: {
            weeklySummary: false,
            habitReminders: false,
            monthlySummary: true,
          },
        },
      });

      await service.updateSettings('user-123', {
        emailPreferences: {
          weeklySummary: false,
          monthlySummary: true,
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            settings: expect.objectContaining({
              emailPreferences: expect.objectContaining({
                weeklySummary: false,
                habitReminders: false, // Preserved from existing
                monthlySummary: true,
              }),
            }),
          }),
        })
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateSettings('non-existent', { theme: 'light' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle user with no existing settings', async () => {
      const userWithNoSettings = {
        ...mockUser,
        settings: {},
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithNoSettings);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        settings: { theme: 'dark' },
      });

      await service.updateSettings('user-123', { theme: 'dark' });

      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should handle updating multiple settings at once', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        timezone: 'UTC',
        settings: {
          theme: 'light',
          compactMode: true,
          emailPreferences: {
            weeklySummary: true,
            habitReminders: true,
          },
        },
      });

      await service.updateSettings('user-123', {
        timezone: 'UTC',
        theme: 'light',
        compactMode: true,
        emailPreferences: {
          habitReminders: true,
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            timezone: 'UTC',
            settings: expect.objectContaining({
              theme: 'light',
              compactMode: true,
            }),
          }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        name: 'New Name',
      });

      const result = await service.updateProfile('user-123', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'New Name' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          defaultWorkspaceId: true,
          hasSetPassword: true,
          timezone: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should update user avatar', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        avatar: 'https://example.com/new-avatar.png',
      });

      const result = await service.updateProfile('user-123', {
        avatar: 'https://example.com/new-avatar.png',
      });

      expect(result.avatar).toBe('https://example.com/new-avatar.png');
    });

    it('should accept data URL avatar', async () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        avatar: dataUrl,
      });

      const result = await service.updateProfile('user-123', {
        avatar: dataUrl,
      });

      expect(result.avatar).toBe(dataUrl);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatar: dataUrl },
        select: expect.any(Object),
      });
    });

    it('should reject non-https avatar URLs', async () => {
      await expect(
        service.updateProfile('user-123', {
          avatar: 'http://example.com/avatar.png',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should update both name and avatar', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        name: 'New Name',
        avatar: 'https://example.com/new-avatar.png',
      });

      const result = await service.updateProfile('user-123', {
        name: 'New Name',
        avatar: 'https://example.com/new-avatar.png',
      });

      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('https://example.com/new-avatar.png');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: 'New Name',
          avatar: 'https://example.com/new-avatar.png',
        },
        select: expect.any(Object),
      });
    });

    it('should handle empty update data', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUserWithoutPassword);

      const result = await service.updateProfile('user-123', {});

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {},
        select: expect.any(Object),
      });
    });
  });
});
