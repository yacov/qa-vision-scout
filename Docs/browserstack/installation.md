# BrowserStack Installation

## Installation via npm

```bash
npm install browserstack
```

## Basic Usage

```javascript
const BrowserStack = require("browserstack");
const browserStackCredentials = {
  username: "foo",
  password: "p455w0rd!!1"
};

// REST API
const client = BrowserStack.createClient(browserStackCredentials);

client.getBrowsers(function(error, browsers) {
  console.log("The following browsers are available for testing");
  console.log(browsers);
});
```