module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.test.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/lib/**/*.js",
    "!src/lib/**/*.test.js",
    "!src/lib/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/src/lib/__tests__/setup.js"],
  // Property-based testing configuration
  testTimeout: 30000, // Increase timeout for property tests (100+ iterations)
};
