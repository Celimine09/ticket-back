module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverage: true,
    coverageReporters: ['text', 'lcov'],
    coverageDirectory: 'coverage',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testTimeout: 10000
  };