# BrowserStack Screenshots API Tests

This project contains tests for the BrowserStack Screenshots API implementation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.test` file:
```bash
cp .env.example .env.test
```

3. Update `.env.test` with your BrowserStack credentials:
- Get your credentials from https://www.browserstack.com/accounts/settings
- Update `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in `.env.test`

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Test Configuration

The following environment variables can be configured in `.env.test`:

- `BROWSERSTACK_USERNAME`: Your BrowserStack username
- `BROWSERSTACK_ACCESS_KEY`: Your BrowserStack access key
- `TEST_URL`: URL to test screenshot generation (default: https://example.com)
- `TEST_TIMEOUT`: Timeout for long-running tests in milliseconds (default: 120000)

## Test Coverage

The test suite includes:

1. Authentication Tests
   - Successful authentication
   - Failed authentication

2. Browser Configuration Tests
   - Fetching available browsers
   - Validating browser configurations

3. Screenshot Generation Tests
   - Successful screenshot generation
   - Error handling for invalid URLs
   - Error handling for invalid browser configurations
   - Error handling for invalid resolutions

4. Rate Limiting Tests
   - Verifying rate limit enforcement (1600 requests per 5 minutes)
   - Rate limit error handling

5. Job Status Tests
   - Polling for job completion
   - Verifying screenshot URLs
   - Error handling for failed jobs

## Notes

- The tests use Jest and TypeScript
- Rate limiting is implemented to respect BrowserStack's API limits
- Tests include retry logic for transient failures
- Environment variables are loaded from `.env.test`
- Test timeouts are configurable for long-running operations
