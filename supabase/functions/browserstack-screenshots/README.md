# BrowserStack Screenshots API Integration

This module provides integration with BrowserStack's Screenshot API for automated visual testing.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your BrowserStack credentials:
```env
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
```

## Testing

### Unit Tests
Run unit tests (no credentials required):
```bash
npm test
```

### Integration Tests
To run integration tests, you need valid BrowserStack credentials in your `.env` file:
```bash
npm test
```

Integration tests will be skipped if credentials are not provided.

## API Usage

### Get Available Browsers
```typescript
import { getAvailableBrowsers } from './browserstack-api';

const browsers = await getAvailableBrowsers(
  {
    username: 'your_username',
    password: 'your_access_key'
  },
  'request-id'
);
```

### Generate Screenshots
```typescript
import { generateScreenshots } from './browserstack-api';

const screenshots = await generateScreenshots(
  'https://example.com',
  [
    {
      os: 'Windows',
      os_version: '11',
      browser: 'chrome',
      browser_version: 'latest'
    }
  ],
  {
    username: 'your_username',
    password: 'your_access_key'
  },
  {
    quality: 'compressed',
    waitTime: 5,
    orientation: 'portrait'
  },
  'request-id'
);
```

## Error Handling

All errors are wrapped in `BrowserstackError` with the following properties:
- `message`: Error description
- `statusCode`: HTTP status code (if applicable)
- `requestId`: Request identifier for tracking
- `context`: Additional error context

## Rate Limiting

The API includes built-in rate limiting:
- 5 requests per second by default
- Configurable via environment variables:
  - `RATE_LIMIT_REQUESTS`
  - `RATE_LIMIT_INTERVAL` 