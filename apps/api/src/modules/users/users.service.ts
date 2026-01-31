import { Injectable, NotFoundException } from '@nestjs/common';

import type { User } from '@goals/database';
import type { UpdateUserSettingsDto } from '@goals/shared';

import { validateImageUrl } from '../../common/utils/image-validation';
import { PrismaService } from '../../prisma/prisma.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
        timezone: true,
        emailVerifiedAt: true,
        settings: true,
        hasSetPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateSettings(
    userId: string,
    settings: UpdateUserSettingsDto
  ): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Extract timezone from settings (it's a top-level field, not in JSON)
    const { timezone, emailPreferences, ...otherSettings } = settings;

    const currentSettings = user.settings as Record<string, any>;

    // Deep merge emailPreferences if provided
    const updatedEmailPreferences = emailPreferences
      ? { ...(currentSettings.emailPreferences || {}), ...emailPreferences }
      : currentSettings.emailPreferences;

    const updatedSettings = {
      ...currentSettings,
      ...otherSettings,
      ...(updatedEmailPreferences && { emailPreferences: updatedEmailPreferences }),
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: updatedSettings,
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
        timezone: true,
        emailVerifiedAt: true,
        settings: true,
        hasSetPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string }
  ): Promise<UserWithoutPassword> {
    const updateData = { ...data };
    if (updateData.avatar !== undefined) {
      const trimmed = updateData.avatar.trim();
      if (trimmed) {
        updateData.avatar = validateImageUrl(trimmed, {
          allowData: true,
          maxBytes: 2 * 1024 * 1024,
          context: 'Avatar image',
        });
      } else {
        updateData.avatar = undefined;
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
        timezone: true,
        emailVerifiedAt: true,
        settings: true,
        hasSetPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
