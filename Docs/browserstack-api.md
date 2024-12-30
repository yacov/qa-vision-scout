# BrowserStack API Documentation

## Overview
This document provides essential information for working with the BrowserStack Screenshots API in the TestHub application.

## Authentication
BrowserStack requires Basic Auth authentication using your account credentials:
- Username: Your BrowserStack username
- Access Key: Your BrowserStack access key

## Screenshot Generation
The Screenshots API allows you to generate screenshots of web pages across different browsers and devices.

### Request Format
```json
{
  "url": "https://example.com",
  "browsers": [
    {
      "os": "Windows",
      "os_version": "11",
      "browser": "chrome",
      "browser_version": "latest"
    }
  ],
  "win_res": "1024x768",
  "quality": "compressed",
  "wait_time": 5
}
```

### Response Format
```json
{
  "job_id": "your_job_id",
  "screenshots": [
    {
      "id": "screenshot_id",
      "state": "done",
      "url": "screenshot_url"
    }
  ]
}
```

## Browser Configuration
When specifying browser configurations:
- For desktop browsers: Include `os`, `os_version`, `browser`, and `browser_version`
- For mobile devices: Include `os`, `os_version`, and `device`
- Use `"latest"` for `browser_version` to get the most recent version

## Error Handling
Common error scenarios:
- Invalid browser/device configuration
- Authentication failures
- Rate limiting
- Network timeouts

For detailed API documentation, visit [BrowserStack Screenshots API](https://www.browserstack.com/screenshots/api).