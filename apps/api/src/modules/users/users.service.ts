import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsDto } from '@goals/shared';
import { User } from '@goals/database';

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
        settings: true,
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
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string }
  ): Promise<UserWithoutPassword> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
        timezone: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
