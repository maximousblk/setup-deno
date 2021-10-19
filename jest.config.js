// disable debug logging while testing
const processStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (str, encoding, cb) => {
  if (!str.match(/^::debug::/)) {
    return processStdoutWrite(str, encoding, cb);
  }
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
};
