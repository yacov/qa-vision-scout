# Backend Structure Documentation

## Overview

The backend of TestHub is built on Supabase, utilizing Edge Functions for serverless compute and PostgreSQL for data storage. This document outlines the structure, patterns, and best practices for the backend implementation.

## Directory Structure

```
/supabase/
├── functions/
│   ├── browserstack-screenshots/
│   │   ├── __tests__/
│   │   │   ├── test-utils.ts
│   │   │   ├── index.test.ts
│   │   │   ├── browserstack-api.test.ts
│   │   │   └── browserstack-api.integration.test.ts
│   │   ├── types.ts
│   │   ├── browserstack-api.ts
│   │   ├── index.ts
│   │   ├── vitest.config.ts
│   │   └── vitest.setup.ts
│   └── other-functions/
├── migrations/
└── seed/
```

## Edge Functions

### BrowserStack Screenshots Function

The BrowserStack screenshots function handles the generation and comparison of website screenshots across different browsers and devices.

#### Key Components:

1. **API Integration (`browserstack-api.ts`)**
   - Handles communication with BrowserStack API
   - Implements request validation and error handling
   - Uses native fetch API for HTTP requests

2. **Type Definitions (`types.ts`)**
   - Defines TypeScript interfaces for requests/responses
   - Includes validation constants and utilities
   - Ensures type safety across the application

3. **Main Handler (`index.ts`)**
   - Processes incoming requests
   - Coordinates with BrowserStack API
   - Returns standardized responses

### Testing Structure

#### 1. Unit Tests
```typescript
// browserstack-api.test.ts
describe('BrowserStack API', () => {
  it('should validate input correctly', () => {
    // Test input validation
  });

  it('should handle API responses', async () => {
    // Test response handling
  });
});
```

#### 2. Integration Tests
```typescript
// browserstack-api.integration.test.ts
describe('BrowserStack API Integration', () => {
  it('should generate screenshots', async () => {
    // Test end-to-end screenshot generation
  });

  it('should handle rate limiting', async () => {
    // Test API rate limiting scenarios
  });
});
```

#### 3. Test Utilities
```typescript
// test-utils.ts
export const mockFetch = {
  fn: vi.fn(defaultMockFetch),
  mockReset() {
    this.fn.mockReset();
    this.fn.mockImplementation(defaultMockFetch);
  }
};
```

## Database Schema

### Tables

1. **screenshots**
   ```sql
   CREATE TABLE screenshots (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     job_id TEXT NOT NULL,
     url TEXT NOT NULL,
     status TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **comparison_results**
   ```sql
   CREATE TABLE comparison_results (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     baseline_id UUID REFERENCES screenshots(id),
     comparison_id UUID REFERENCES screenshots(id),
     difference_score FLOAT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

## API Endpoints

### Screenshot Generation
- **POST** `/browserstack-screenshots`
  ```typescript
  interface Request {
    url: string;
    resolution: ResolutionType;
    browsers: Browser[];
    wait_time?: number;
    quality?: 'compressed' | 'original';
  }
  ```

### Screenshot Comparison
- **POST** `/compare-screenshots`
  ```typescript
  interface Request {
    baselineId: string;
    comparisonId: string;
  }
  ```

## Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId: string;
    context?: Record<string, unknown>;
  };
}
```

### Error Types
1. **ValidationError**: Input validation failures
2. **APIError**: External API communication issues
3. **RateLimitError**: Rate limiting violations
4. **DatabaseError**: Database operation failures

## Testing Best Practices

### 1. Mock Management
- Use centralized mock utilities
- Reset mocks before each test
- Maintain type safety in mocks
- Use native implementations when available

### 2. Test Organization
- Group related tests together
- Use descriptive test names
- Test both success and error paths
- Include rate limiting scenarios

### 3. Integration Testing
- Test complete API flows
- Verify error handling
- Check response formats
- Validate edge cases

### 4. Performance Testing
- Monitor response times
- Test under load
- Verify resource cleanup
- Check memory usage

## Deployment

### Environment Variables
```bash
BROWSERSTACK_USERNAME=xxx
BROWSERSTACK_ACCESS_KEY=xxx
DATABASE_URL=xxx
```

### Deployment Process
1. Run tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Build: `npm run build`
4. Deploy: `supabase functions deploy`

## Monitoring

### Metrics to Track
- API response times
- Error rates
- Screenshot generation success rate
- Database query performance

### Logging
- Request/response details
- Error contexts
- Performance metrics
- Rate limiting events

## Security

### API Security
- Authentication required
- Rate limiting enforced
- Input validation
- Secure credential storage

### Data Security
- Encrypted storage
- Access control
- Audit logging
- Regular backups
