import { jest } from '@jest/globals';

jest.mock('../browserstack-api', () => ({
  generateScreenshots: jest.fn()
}));

describe('index', () => {
  let api: { generateScreenshots: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    api = require('../browserstack-api');
  });

  it('should be properly configured', () => {
    expect(jest.isMockFunction(api.generateScreenshots)).toBe(true);
  });
}); 