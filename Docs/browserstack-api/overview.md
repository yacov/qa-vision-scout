# BrowserStack API Overview

The BrowserStack API provides browser-as-a-service for automated cross-browser testing. It offers a simple service that can be integrated with any browser testing framework.

## Authentication
All methods require authentication using your username and BrowserStack access key within the HTTP request.

Example:
```shell
curl -u "username:access_key" https://api.browserstack.com/5
```

## Schema
All requests are made to `https://api.browserstack.com/VERSION/` and return JSON-formatted data.