import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export type AdminRole = 'USER' | 'ADMIN';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview(
    currentUser: { role?: string },
    options: { limit?: number; offset?: number; includeEmail?: boolean }
  ) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);
    const includeEmail = currentUser.role === 'SUPER_ADMIN' && options.includeEmail === true;

    const [totalUsers, planCounts, statusCounts, users] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        orderBy: { plan: 'asc' },
        _count: { _all: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          loginCount: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              trialEndsAt: true,
              currentPeriodEnd: true,
            },
          },
        },
        orderBy: [{ lastLoginAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
    ]);

    const planCountMap: Record<'FREE' | 'PRO' | 'FAMILY', number> = {
      FREE: 0,
      PRO: 0,
      FAMILY: 0,
    };
    let countedPlans = 0;
    for (const row of planCounts) {
      const plan = row.plan as 'FREE' | 'PRO' | 'FAMILY';
      const count = (row as { _count?: { _all?: number } })._count?._all ?? 0;
      planCountMap[plan] = count;
      countedPlans += count;
    }
    const missingSubscriptions = Math.max(totalUsers - countedPlans, 0);
    planCountMap.FREE += missingSubscriptions;

    const statusCountMap: Record<string, number> = {};
    for (const row of statusCounts) {
      const count = (row as { _count?: { _all?: number } })._count?._all ?? 0;
      statusCountMap[row.status] = count;
    }

    return {
      totals: {
        users: totalUsers,
        plans: planCountMap,
        statuses: statusCountMap,
      },
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: includeEmail ? user.email : this.maskEmail(user.email),
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount ?? 0,
        plan: user.subscription?.plan ?? 'FREE',
        subscriptionStatus: user.subscription?.status ?? 'NONE',
        trialEndsAt: user.subscription?.trialEndsAt ?? null,
        currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
      })),
    };
  }

  async updateUserRole(targetUserId: string, role: AdminRole) {
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Role must be USER or ADMIN');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot change SUPER_ADMIN role');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        role: true,
      },
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';

    const localMasked =
      local.length <= 2 ? `${local[0] ?? ''}***` : `${local[0]}***${local.slice(-1)}`;
    const domainParts = domain.split('.');
    const domainName = domainParts[0] || '';
    const domainMasked =
      domainName.length <= 2
        ? `${domainName[0] ?? ''}***`
        : `${domainName[0]}***${domainName.slice(-1)}`;
    const tld = domainParts.slice(1).join('.') || '';

    return `${localMasked}@${domainMasked}${tld ? `.${tld}` : ''}`;
  }
}
