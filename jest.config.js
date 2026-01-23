/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/apps/api/jest.config.js',
    '<rootDir>/apps/web/jest.config.js',
    '<rootDir>/packages/shared/jest.config.js',
    // '<rootDir>/packages/email-templates/jest.config.cjs', // Temporarily disabled - needs ESM/React config fixes
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 50,
      lines: 70,
      statements: 70,
    },
  },
};
