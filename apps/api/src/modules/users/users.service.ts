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

    const currentSettings = user.settings as Record<string, any>;
    const updatedSettings = { ...currentSettings, ...settings };

    return this.prisma.user.update({
      where: { id: userId },
      data: { settings: updatedSettings },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
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
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
