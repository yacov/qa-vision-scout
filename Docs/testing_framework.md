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
  }
};

export function createMockResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createValidScreenshotRequest() {
  return {
    url: 'https://example.com',
    browsers: [{
      os: 'ios',
      os_version: '17',
      device: 'iPhone 15'
    }],
    quality: 'compressed',
    wait_time: 5,
    orientation: 'portrait',
    mac_res: '1024x768',
    win_res: '1024x768'
  };
}
```

## Testing Patterns

### API Integration Tests

1. **Request Mocking with Dynamic Responses**
```typescript
// Example of mocking API requests with dynamic responses
mockFetch.fn.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
  if (url.toString().includes('browsers.json')) {
    return createMockResponse(200, browsersMock);
  }
  const body = init?.body ? JSON.parse(init.body.toString()) : {};
  
  return createMockResponse(200, {
    id: 'test-job-id',
    state: 'done',
    quality: body.quality || 'compressed',
    orientation: body.orientation || 'portrait',
    // ... other response fields
  });
});
```

2. **Polling Tests**
```typescript
it('should poll for completion', async () => {
  mockFetch.fn.mockImplementation(/* ... */);
  const resultPromise = generateScreenshots(validInput);
  
  // Fast-forward time to simulate polling
  for (let i = 0; i < 12; i++) {
    await vi.advanceTimersByTimeAsync(10000);
  }
  
  const result = await resultPromise;
  expect(result.state).toBe('done');
});
```

3. **Error Handling**
```typescript
it('should handle rate limiting', async () => {
  mockFetch.fn.mockImplementation(async () => 
    createMockResponse(429, { message: 'Rate limit exceeded' })
  );

  await expect(generateScreenshots(validInput))
    .rejects.toThrow('Rate limit exceeded');
});
```

## Best Practices

### 1. Mock Implementation
- Use centralized mock utilities
- Implement dynamic response handling based on request parameters
- Maintain type safety in mocks
- Reset mocks before each test
- Use native fetch implementation

### 2. Test Structure
- Group related tests together
- Use descriptive test names
- Test both success and error cases
- Include validation tests for all parameters
- Test edge cases and timeouts

### 3. Async Testing
- Use `vi.useFakeTimers()` for time-dependent tests
- Properly advance timers for polling tests
- Set appropriate timeout values
- Handle Promise rejections properly

### 4. Validation Testing
- Test all input validation scenarios
- Validate configuration parameters
- Test boundary conditions
- Include error message validation

## Common Scenarios

### 1. Testing Polling Behavior
```typescript
// Setup mock with multiple responses
let callCount = 0;
mockFetch.fn.mockImplementation(async () => {
  callCount++;
  if (callCount === 1) return initialResponse;
  if (callCount === 2) return processingResponse;
  return completionResponse;
});

// Advance time appropriately
await vi.advanceTimersByTimeAsync(10000);
```

### 2. Testing Configuration Validation
```typescript
// Test invalid configurations
await expect(generateScreenshots({
  ...validInput,
  quality: 'invalid'
})).rejects.toThrow('Invalid quality setting');

// Test required fields
await expect(generateScreenshots({
  ...validInput,
  browsers: [{ os: '' }]
})).rejects.toThrow('OS is a required field');
```

### 3. Testing Response Parameters
```typescript
// Verify response matches request parameters
const result = await generateScreenshots({
  ...validInput,
  quality: 'original',
  orientation: 'landscape'
});

expect(result.quality).toBe('original');
expect(result.orientation).toBe('landscape');
```

## Debugging Tips

1. **Mock Response Issues**
   - Verify mock implementation handles all request parameters
   - Check JSON parsing of request body
   - Ensure mock returns correct response structure

2. **Polling Test Issues**
   - Verify timer advancement matches polling interval
   - Check call count expectations
   - Handle Promise rejections properly

3. **Validation Test Issues**
   - Ensure error messages match expectations
   - Verify all validation scenarios are covered
   - Test boundary conditions

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
1. Follow established patterns for mock implementations
2. Include both success and error cases
3. Test all configuration parameters
4. Validate response structures
5. Handle async operations properly
6. Document complex test scenarios 