import { ConfigService } from '@nestjs/config';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { RedisService } from './redis.service';

// Mock ioredis
const mockPipeline = {
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockRedisClient = {
  on: jest.fn(),
  quit: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
  pipeline: jest.fn(() => mockPipeline),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Simulate connection event
    mockRedisClient.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'connect') {
        // Call the connect callback to simulate successful connection
        setTimeout(() => callback(), 0);
      }
      return mockRedisClient;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Manually set isConnected to true for tests (simulating successful connection)
    (service as any).isConnected = true;
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('isAvailable', () => {
    it('should return true when connected', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when not connected', () => {
      (service as any).isConnected = false;
      expect(service.isAvailable()).toBe(false);
    });

    it('should return false when client is null', () => {
      (service as any).client = null;
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');

      const result = await service.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null when Redis is not available', async () => {
      (service as any).isConnected = false;

      const result = await service.get('test-key');

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('test-key', 'test-value');

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
      expect(result).toBe(true);
    });

    it('should set value with TTL', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.set('test-key', 'test-value', 3600);

      expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 3600, 'test-value');
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      (service as any).isConnected = false;

      const result = await service.set('test-key', 'test-value');

      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Connection error'));

      const result = await service.set('test-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('incrementWithTTL', () => {
    it('should increment counter and set TTL', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ]);

      const result = await service.incrementWithTTL('counter-key', 86400);

      expect(mockRedisClient.pipeline).toHaveBeenCalled();
      expect(mockPipeline.incr).toHaveBeenCalledWith('counter-key');
      expect(mockPipeline.expire).toHaveBeenCalledWith('counter-key', 86400);
      expect(result).toBe(1);
    });

    it('should return incremented value', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 5],
        [null, 1],
      ]);

      const result = await service.incrementWithTTL('counter-key', 86400);

      expect(result).toBe(5);
    });

    it('should return null when Redis is not available', async () => {
      (service as any).isConnected = false;

      const result = await service.incrementWithTTL('counter-key', 86400);

      expect(mockRedisClient.pipeline).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockPipeline.exec.mockRejectedValue(new Error('Pipeline error'));

      const result = await service.incrementWithTTL('counter-key', 86400);

      expect(result).toBeNull();
    });
  });

  describe('ttl', () => {
    it('should return TTL for key', async () => {
      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await service.ttl('test-key');

      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test-key');
      expect(result).toBe(3600);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedisClient.ttl.mockResolvedValue(-2);

      const result = await service.ttl('nonexistent-key');

      expect(result).toBe(-2);
    });

    it('should return null when Redis is not available', async () => {
      (service as any).isConnected = false;

      const result = await service.ttl('test-key');

      expect(mockRedisClient.ttl).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.ttl.mockRejectedValue(new Error('Connection error'));

      const result = await service.ttl('test-key');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      (service as any).isConnected = false;

      const result = await service.del('test-key');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Connection error'));

      const result = await service.del('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getJson', () => {
    it('should return parsed JSON object', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.getJson<typeof testData>('json-key');

      expect(result).toEqual(testData);
    });

    it('should return parsed JSON array', async () => {
      const testData = [{ id: 1 }, { id: 2 }];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.getJson<typeof testData>('json-key');

      expect(result).toEqual(testData);
    });

    it('should return null for invalid JSON', async () => {
      mockRedisClient.get.mockResolvedValue('not valid json');

      const result = await service.getJson('json-key');

      expect(result).toBeNull();
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getJson('nonexistent-key');

      expect(result).toBeNull();
    });
  });

  describe('setJson', () => {
    it('should set JSON value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const testData = { name: 'test', value: 123 };

      const result = await service.setJson('json-key', testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith('json-key', JSON.stringify(testData));
      expect(result).toBe(true);
    });

    it('should set JSON value with TTL', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');
      const testData = { name: 'test', value: 123 };

      const result = await service.setJson('json-key', testData, 3600);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'json-key',
        3600,
        JSON.stringify(testData)
      );
      expect(result).toBe(true);
    });

    it('should handle array values', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const testData = [{ id: 1 }, { id: 2 }];

      const result = await service.setJson('json-key', testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith('json-key', JSON.stringify(testData));
      expect(result).toBe(true);
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis client on destroy', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});

describe('RedisService without Redis URL', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should not be available when REDIS_URL is not configured', () => {
    expect(service.isAvailable()).toBe(false);
  });

  it('should return null for all operations', async () => {
    expect(await service.get('key')).toBeNull();
    expect(await service.set('key', 'value')).toBe(false);
    expect(await service.incrementWithTTL('key', 100)).toBeNull();
    expect(await service.ttl('key')).toBeNull();
    expect(await service.del('key')).toBe(false);
    expect(await service.getJson('key')).toBeNull();
    expect(await service.setJson('key', {})).toBe(false);
  });
});
