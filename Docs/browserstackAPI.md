# BrowserStack Screenshots API Documentation (2024)

## Overview
The Screenshots API enables automated creation of screenshots for any URL across multiple browsers and operating systems. This API supports cross-browser compatibility testing on desktop browsers and real mobile devices, with specific considerations for AI-based analysis.

## Important Limitations for AI Analysis
Before implementing screenshot analysis with AI, be aware of these limitations:

1. **Content Capture Limitations:**
   - Cannot capture content from iframes from external websites
   - Limited support for shadow-DOM elements
   - Cannot capture canvas elements
   - Cannot capture video sources (e.g., YouTube videos)
   - Limited support for Mapbox and maps

2. **Mobile Screenshot Limitations:**
   - Maximum scroll limit of 10 for full-page screenshots on mobile devices
   - Page height limitations may affect full-page captures

3. **Security Considerations:**
   - Websites with strict Content Security Policy (CSP) may not be captured properly
   - Some dynamic content may not render in screenshots

## Authentication
All API requests require authentication using your BrowserStack username and access key.

```bash
curl -u "username:access_key" https://www.browserstack.com/screenshots
```

**Note:** Unauthorized requests will receive a 401 response.

## API Endpoints

### 1. Get Available Browsers and OS
Lists all available operating systems and browsers for screenshot testing.

**Request:**
- Method: `GET`
- Endpoint: `/screenshots/browsers.json`

**Response Example:**
```json
[
  {
    "os": "Windows",
    "os_version": "10",
    "browser": "chrome",
    "browser_version": "121.0",
    "device": null
  },
  {
    "os": "ios",
    "os_version": "17",
    "browser": "Mobile Safari",
    "browser_version": null,
    "device": "iPhone 15"
  }
]
```

### 2. Generate Screenshots
Creates screenshots for a specified URL across selected browser configurations.

**Request:**
- Method: `POST`
- Endpoint: `/screenshots`
- Content-Type: `application/json`

**Parameters:**

| Parameter | Description | Values/Example |
|-----------|-------------|----------------|
| url | Target webpage URL | www.example.com |
| os | Operating system | Windows, OS X, ios, android |
| os_version | OS version | Example: "10" |
| browser | Browser type | ie, chrome, firefox, safari, opera, Android Browser |
| browser_version | Browser version | Example: "121.0" |
| device | Mobile device name (required for mobile testing) | Example: "iPhone 15" |
| orientation | Screen orientation for mobile devices | portrait, landscape (Default: portrait) |
| mac_res | Screen resolution for OSX | 1024x768, 1280x960, 1280x1024, 1600x1200, 1920x1080 (Default: 1024x768) |
| win_res | Screen resolution for Windows | 1024x768, 1280x1024 (Default: 1024x768) |
| quality | Screenshot quality | Original, Compressed (Default: Compressed) |
| local | Enable local testing connection | true, false (Default: false) |
| wait_time | Wait time before screenshot (seconds) | 2, 5, 10, 15, 20, 60 (Default: 5) |
| callback_url | URL for results notification | Optional |

**Request Example:**
```json
{
  "url": "www.example.com",
  "callback_url": "http://your-callback-url.com",
  "win_res": "1920x1080",
  "quality": "original",
  "wait_time": 10,
  "browsers": [
    {
      "os": "Windows",
      "os_version": "10",
      "browser": "chrome",
      "browser_version": "121.0"
    },
    {
      "os": "ios",
      "os_version": "17",
      "device": "iPhone 15"
    }
  ]
}
```

### 3. Check Screenshot Status
Retrieves the status and details of a screenshot generation job.

**Request:**
- Method: `GET`
- Endpoint: `/screenshots/<JOB-ID>.json`

**Response Example:**
```json
{
  "id": "job_id_here",
  "state": "done",
  "screenshots": [
    {
      "os": "Windows",
      "os_version": "10",
      "browser": "chrome",
      "browser_version": "121.0",
      "id": "screenshot_id_here",
      "state": "done",
      "url": "www.example.com",
      "thumb_url": "https://www.browserstack.com/screenshots/job_id_here/thumb_win10_chrome_121.jpg",
      "image_url": "https://www.browserstack.com/screenshots/job_id_here/win10_chrome_121.png",
      "created_at": "2024-01-30 16:25:45 UTC"
    }
  ]
}
```

## Best Practices for AI Analysis

1. **Image Quality:**
   - Use "Original" quality setting for better AI analysis accuracy
   - Consider higher wait_time (10-15 seconds) for dynamic content to load fully

2. **Resolution Selection:**
   - Use consistent resolutions across tests for comparable results
   - Prefer higher resolutions (e.g., 1920x1080) for desktop screenshots

3. **Error Handling:**
   - Always check the screenshot state before analysis
   - Implement retry logic for failed screenshots
   - Verify image URLs are accessible before processing

4. **Performance Optimization:**
   - Use the callback_url parameter for async processing
   - Batch screenshot requests when possible
   - Cache successful screenshots if reanalysis is needed

## Integration Examples

### Python Example using API Wrapper
```python
from browserstack_screenshots import Screenshots

client = Screenshots('username', 'access_key')

# Generate screenshots
job_id = client.generate_screenshots('http://example.com', {
    'browsers': [
        {'os': 'Windows', 'os_version': '10', 'browser': 'chrome', 'browser_version': '121.0'},
        {'os': 'ios', 'os_version': '17', 'device': 'iPhone 15'}
    ],
    'quality': 'original',
    'wait_time': 10
})

# Get screenshots when complete
screenshots = client.get_screenshots(job_id)
```

### Webhook Handler Example
```python
from flask import Flask, request
import requests

app = Flask(__name__)

@app.route('/browserstack/callback', methods=['POST'])
def handle_screenshots():
    data = request.json
    if data['state'] == 'done':
        for screenshot in data['screenshots']:
            if screenshot['state'] == 'done':
                # Download screenshot for AI analysis
                image_url = screenshot['image_url']
                response = requests.get(image_url)
                # Process image with your AI model
                # analyze_image(response.content)
    return '', 200
```
