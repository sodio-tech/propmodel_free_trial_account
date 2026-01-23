export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testPathIgnorePatterns: ["/node_modules/"],
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  setupFilesAfterEnv: ['./jest.teardown.js'],
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000,
  forceExit: true
};