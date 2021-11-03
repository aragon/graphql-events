module.exports = {
  notifyMode: "success-change",
  collectCoverage: true,
  coverageDirectory: "./coverage/",
  coverageThreshold: {
    global: {
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  notify: true,
  clearMocks: true,
  testMatch: ["/**/**.test.ts"],
  transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  bail: true,
  coveragePathIgnorePatterns: ["node_modules", "dist"],
  timers: "legacy"
};
