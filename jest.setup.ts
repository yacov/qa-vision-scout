const { config } = require('dotenv');

// Load environment variables from .env.test
config({ path: '.env.test' });

// Set default environment variables for testing if not provided
process.env.BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME || 'test_user';
process.env.BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY || 'test_key';
process.env.TEST_URL = process.env.TEST_URL || 'https://example.com';
process.env.TEST_TIMEOUT = process.env.TEST_TIMEOUT || '120000'; 