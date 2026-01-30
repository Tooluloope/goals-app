// Jest setup file for API tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.STRIPE_PRO_PRICE_ID = 'price_pro_test';
process.env.STRIPE_FAMILY_PRICE_ID = 'price_family_test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-123';
process.env.TRIAL_PERIOD_DAYS = '14';

// Set test timeout
jest.setTimeout(30000);
