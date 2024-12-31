const { config } = require('dotenv');
const path = require('path');

// Load test environment variables
config({
  path: path.resolve(__dirname, './supabase/functions/browserstack-screenshots/.env.test')
});

// Increase timeout for all tests
jest.setTimeout(parseInt(process.env.TEST_TIMEOUT || '45000', 10)); 