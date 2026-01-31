import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { JournalService } from './journal.service';

describe('JournalService', () => {
  let service: JournalService;

  const mockPrismaService = {
    journalEntry: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const makeDataUrl = (mime: string, bytes: number[]) =>
    `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
  const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xdb];

  const mockEntry = {
    id: 'entry-1',
    userId: 'user-1',
    date: new Date('2024-06-01'),
    mood: null,
    emoji: null,
    prompt: null,
    content: 'Test content',
    wins: null,
    challenges: null,
    gratitude: null,
    photoUrl: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JournalService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<JournalService>(JournalService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create entry with data URL photo', async () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      mockPrismaService.journalEntry.findUnique.mockResolvedValue(null);
      mockPrismaService.journalEntry.create.mockResolvedValue({
        ...mockEntry,
        photoUrl: dataUrl,
      });

      const result = await service.create(
        {
          date: '2024-06-01',
          content: 'Test content',
          photoUrl: dataUrl,
        } as any,
        'user-1'
      );

      expect(mockPrismaService.journalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          photoUrl: dataUrl,
        }),
      });
      expect(result.photoUrl).toBe(dataUrl);
    });

    it('should reject invalid photo URL', async () => {
      await expect(
        service.create(
          {
            date: '2024-06-01',
            content: 'Test content',
            photoUrl: 'http://example.com/photo.jpg',
          } as any,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.journalEntry.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.journalEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should clear photo URL when empty string is provided', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrismaService.journalEntry.update.mockResolvedValue({
        ...mockEntry,
        photoUrl: null,
      });

      await service.update(
        'entry-1',
        {
          photoUrl: '',
        } as any,
        'user-1'
      );

      expect(mockPrismaService.journalEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: expect.objectContaining({
          photoUrl: null,
        }),
      });
    });

    it('should throw NotFoundException when entry does not belong to user', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue({
        ...mockEntry,
        userId: 'other-user',
      });

      await expect(
        service.update('entry-1', { content: 'Updated content' } as any, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsert', () => {
    it('should upsert entry with validated photo URL', async () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      mockPrismaService.journalEntry.upsert.mockResolvedValue({
        ...mockEntry,
        photoUrl: dataUrl,
      });

      await service.upsert(
        {
          date: '2024-06-01',
          content: 'Test content',
          photoUrl: dataUrl,
        } as any,
        'user-1'
      );

      expect(mockPrismaService.journalEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            photoUrl: dataUrl,
          }),
          create: expect.objectContaining({
            photoUrl: dataUrl,
          }),
        })
      );
    });
  });
});
