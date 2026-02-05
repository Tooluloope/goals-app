import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DataAggregatorService } from './services/data-aggregator.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;
  let redisService: any;
  let workspacesService: any;
  let subscriptionsService: any;
  let anthropicProvider: any;

  const mockProject = {
    id: 'project-1',
    workspaceId: 'workspace-1',
    name: 'Learn TypeScript',
    objective: 'Master TypeScript for better code quality',
    successMetric: 'Complete 5 projects using TypeScript',
    targetDate: new Date('2024-12-31'),
  };

  const mockSuggestedHabits = [
    {
      name: 'Code for 30 minutes',
      frequency: 'daily',
      frequencyDays: [],
      description: 'Practice coding daily',
      icon: 'code',
      suggestedWeight: 40,
    },
    {
      name: 'Read TypeScript docs',
      frequency: 'daily',
      frequencyDays: [],
      description: 'Study TypeScript documentation',
      icon: 'book-open',
      suggestedWeight: 30,
    },
    {
      name: 'Build a project',
      frequency: 'weekly',
      frequencyDays: [],
      description: 'Work on a TypeScript project',
      icon: 'target',
      suggestedWeight: 30,
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      project: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
      incrementWithTTL: jest.fn(),
      ttl: jest.fn(),
    };

    const mockWorkspacesService = {
      verifyAccess: jest.fn(),
    };

    const mockSubscriptionsService = {
      getOrCreateSubscription: jest.fn(),
    };

    const mockAnthropicProvider = {
      createMessage: jest.fn(),
    };

    const mockDataAggregatorService = {
      getUserContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: WorkspacesService, useValue: mockWorkspacesService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: AnthropicProvider, useValue: mockAnthropicProvider },
        { provide: DataAggregatorService, useValue: mockDataAggregatorService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get(PrismaService);
    redisService = module.get(RedisService);
    workspacesService = module.get(WorkspacesService);
    subscriptionsService = module.get(SubscriptionsService);
    anthropicProvider = module.get(AnthropicProvider);
  });

  describe('generateHabitSuggestions', () => {
    const userId = 'user-1';
    const workspaceId = 'workspace-1';
    const projectId = 'project-1';

    beforeEach(() => {
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prisma.project.findUnique.mockResolvedValue(mockProject);
    });

    describe('rate limiting', () => {
      it('should allow free users one suggestion per day', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue(null); // No usage yet
        redisService.getJson.mockResolvedValue(null); // No cache
        redisService.incrementWithTTL.mockResolvedValue(1);
        redisService.setJson.mockResolvedValue(true);
        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(mockSuggestedHabits),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(3);
        expect(redisService.incrementWithTTL).toHaveBeenCalledWith(
          `habit_suggestions_usage:${userId}`,
          86400 // 24 hours
        );
      });

      it('should throw ForbiddenException when free user exceeds daily limit', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue('1'); // Already used once
        redisService.ttl.mockResolvedValue(7200); // 2 hours remaining

        await expect(
          service.generateHabitSuggestions(userId, workspaceId, projectId)
        ).rejects.toThrow(ForbiddenException);

        expect(anthropicProvider.createMessage).not.toHaveBeenCalled();
      });

      it('should include hours remaining in rate limit error message', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue('1');
        redisService.ttl.mockResolvedValue(10800); // 3 hours remaining

        await expect(
          service.generateHabitSuggestions(userId, workspaceId, projectId)
        ).rejects.toThrow(/3 hours/);
      });

      it('should allow unlimited suggestions for Pro users', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        redisService.setJson.mockResolvedValue(true);
        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(mockSuggestedHabits),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(3);
        expect(redisService.get).not.toHaveBeenCalled(); // No rate limit check
        expect(redisService.incrementWithTTL).not.toHaveBeenCalled();
      });

      it('should allow unlimited suggestions for Family users', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FAMILY' });
        redisService.getJson.mockResolvedValue(null);
        redisService.setJson.mockResolvedValue(true);
        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(mockSuggestedHabits),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(3);
        expect(redisService.incrementWithTTL).not.toHaveBeenCalled();
      });
    });

    describe('caching', () => {
      it('should return cached suggestions if available', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(mockSuggestedHabits);

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toEqual(mockSuggestedHabits);
        expect(anthropicProvider.createMessage).not.toHaveBeenCalled();
      });

      it('should count cached results against rate limit for free users', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue(null);
        redisService.getJson.mockResolvedValue(mockSuggestedHabits);
        redisService.incrementWithTTL.mockResolvedValue(1);

        await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(redisService.incrementWithTTL).toHaveBeenCalled();
      });

      it('should cache new suggestions', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        redisService.setJson.mockResolvedValue(true);
        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(mockSuggestedHabits),
          tokensUsed: 100,
        });

        await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(redisService.setJson).toHaveBeenCalledWith(
          `habit_suggestions_cache:${projectId}`,
          expect.any(Array),
          3600 // 1 hour cache TTL
        );
      });

      it('should not cache empty suggestions', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        anthropicProvider.createMessage.mockResolvedValue({
          content: '[]',
          tokensUsed: 100,
        });

        await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(redisService.setJson).not.toHaveBeenCalled();
      });
    });

    describe('workspace and project validation', () => {
      it('should verify workspace access', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(mockSuggestedHabits);

        await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(workspacesService.verifyAccess).toHaveBeenCalledWith(workspaceId, userId);
      });

      it('should throw NotFoundException when project not found', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        prisma.project.findUnique.mockResolvedValue(null);

        await expect(
          service.generateHabitSuggestions(userId, workspaceId, projectId)
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when project is in different workspace', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        prisma.project.findUnique.mockResolvedValue({
          ...mockProject,
          workspaceId: 'other-workspace',
        });

        await expect(
          service.generateHabitSuggestions(userId, workspaceId, projectId)
        ).rejects.toThrow('Project not found in this workspace');
      });
    });

    describe('AI response parsing', () => {
      beforeEach(() => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'PRO' });
        redisService.getJson.mockResolvedValue(null);
        redisService.setJson.mockResolvedValue(true);
      });

      it('should parse valid JSON response', async () => {
        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(mockSuggestedHabits),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('Code for 30 minutes');
      });

      it('should handle markdown code block in response', async () => {
        anthropicProvider.createMessage.mockResolvedValue({
          content: '```json\n' + JSON.stringify(mockSuggestedHabits) + '\n```',
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(3);
      });

      it('should return empty array for invalid JSON', async () => {
        anthropicProvider.createMessage.mockResolvedValue({
          content: 'This is not valid JSON',
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toEqual([]);
      });

      it('should validate and filter invalid suggestions', async () => {
        const invalidSuggestions = [
          { name: 'Valid habit', frequency: 'daily', frequencyDays: [], suggestedWeight: 50 },
          { name: 'Missing frequency', frequencyDays: [], suggestedWeight: 50 },
          {
            name: 'Invalid frequency',
            frequency: 'hourly',
            frequencyDays: [],
            suggestedWeight: 50,
          },
          { frequency: 'daily', frequencyDays: [], suggestedWeight: 50 }, // Missing name
        ];

        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(invalidSuggestions),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Valid habit');
      });

      it('should enforce max name length', async () => {
        const longNameHabit = {
          name: 'A'.repeat(100),
          frequency: 'daily',
          frequencyDays: [],
          suggestedWeight: 50,
        };

        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify([longNameHabit]),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result[0].name.length).toBe(50);
      });

      it('should enforce weight bounds (1-100)', async () => {
        const habitsWithBadWeights = [
          { name: 'Low weight', frequency: 'daily', frequencyDays: [], suggestedWeight: -10 },
          { name: 'High weight', frequency: 'daily', frequencyDays: [], suggestedWeight: 150 },
        ];

        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify(habitsWithBadWeights),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result[0].suggestedWeight).toBe(1); // Clamped to min
        expect(result[1].suggestedWeight).toBe(100); // Clamped to max
      });

      it('should default icon to target when not provided', async () => {
        const habitWithoutIcon = {
          name: 'No icon habit',
          frequency: 'daily',
          frequencyDays: [],
          suggestedWeight: 50,
        };

        anthropicProvider.createMessage.mockResolvedValue({
          content: JSON.stringify([habitWithoutIcon]),
          tokensUsed: 100,
        });

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result[0].icon).toBe('target');
      });
    });

    describe('error handling', () => {
      it('should not count rate limit on API error for free users', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue(null);
        redisService.getJson.mockResolvedValue(null);
        anthropicProvider.createMessage.mockRejectedValue(new Error('API error'));

        const result = await service.generateHabitSuggestions(userId, workspaceId, projectId);

        expect(result).toEqual([]);
        expect(redisService.incrementWithTTL).not.toHaveBeenCalled();
      });

      it('should re-throw ForbiddenException without catching', async () => {
        subscriptionsService.getOrCreateSubscription.mockResolvedValue({ plan: 'FREE' });
        redisService.get.mockResolvedValue('1');
        redisService.ttl.mockResolvedValue(3600);

        await expect(
          service.generateHabitSuggestions(userId, workspaceId, projectId)
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
