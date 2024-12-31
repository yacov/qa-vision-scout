# Testing Framework Documentation

## Overview

This document outlines the testing framework and best practices for the TestHub project. It covers unit testing, integration testing, and API testing approaches, with a focus on BrowserStack API integration testing.

## Testing Stack

- **Test Runner**: Vitest
- **Coverage Tool**: @vitest/coverage-v8
- **Mocking Library**: Vitest's built-in mocking capabilities
- **Environment**: Node.js with native fetch API
- **Additional Tools**: TypeScript for type safety

## Directory Structure

```
/supabase/functions/browserstack-screenshots/
├── __tests__/
│   ├── test-utils.ts          # Shared test utilities and mocks
│   ├── index.test.ts          # Main function tests
│   ├── browserstack-api.test.ts    # API unit tests
│   └── browserstack-api.integration.test.ts  # API integration tests
├── vitest.config.ts           # Test configuration
└── vitest.setup.ts           # Test setup and global mocks
```

## Test Utilities

### Mock Implementation (`test-utils.ts`)

```typescript
// Example of centralized mock utilities
export const mockFetch = {
  fn: vi.fn(defaultMockFetch),
  mockReset() {
    this.fn.mockReset();
    this.fn.mockImplementation(defaultMockFetch);
  },
  mockResolvedValueOnce(value: Response) {
    return this.fn.mockResolvedValueOnce(value);
  }
};

export function createMockResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Testing Patterns

### API Integration Tests

1. **Request Mocking**
```typescript
// Example of mocking API requests
it('should generate screenshots successfully', async () => {
  const browsersMock = {
    browsers: [{
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '117.0',
      device: null
    }]
  };

  mockFetch.fn.mockImplementation(async () => 
    createMockResponse(200, browsersMock)
  );

  const result = await generateScreenshots(validInput, credentials);
  expect(result.job_id).toBeTruthy();
});
```

2. **Error Handling**
```typescript
it('should handle rate limiting', async () => {
  mockFetch.fn.mockImplementation(async () => 
    createMockResponse(429, { message: 'Rate limit exceeded' })
  );

  await expect(
    generateScreenshots(validInput, credentials)
  ).rejects.toThrow('Rate limit exceeded');
});
```

## Best Practices

### 1. Mock Implementation
- Use centralized mock utilities
- Maintain type safety in mocks
- Avoid global mock assignments
- Use native implementations when available

### 2. Test Structure
- Group related tests together
- Use descriptive test names
- Include both success and error cases
- Test edge cases and rate limiting

### 3. Async Testing
- Properly handle async/await
- Set appropriate timeout values
- Ensure efficient mock responses
- Avoid unnecessary Promise chaining

### 4. Type Safety
- Ensure compatibility between mocks and actual implementations
- Use TypeScript for better type checking
- Maintain proper type definitions for all test utilities

## Configuration

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    testTimeout: 60000,
    hookTimeout: 60000
  }
});
```

### Test Setup
```typescript
// vitest.setup.ts
import { mockFetch } from './__tests__/test-utils.js';

// Set up global fetch mock
global.fetch = mockFetch.fn;

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = mockFetch.fn;
});
```

## Common Issues and Solutions

1. **Type Mismatches**
   - Problem: Incompatibility between mock and actual implementations
   - Solution: Use native fetch types and proper type definitions

2. **Test Timeouts**
   - Problem: Long-running tests causing timeouts
   - Solution: Configure appropriate timeout values and optimize mock responses

3. **Mock Reset Issues**
   - Problem: State bleeding between tests
   - Solution: Properly reset mocks in beforeEach hooks

## Coverage Requirements

- Minimum coverage: 80%
- Critical paths: 100%
- Integration tests: Key API endpoints must be covered
- Error scenarios: All error handling must be tested

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Contributing

When adding new tests:
1. Follow the established patterns
2. Maintain proper type safety
3. Add appropriate documentation
4. Ensure all tests are properly isolated
5. Include both success and error cases 