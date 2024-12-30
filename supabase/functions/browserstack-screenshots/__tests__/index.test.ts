import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handler } from '../index';

describe('BrowserStack Screenshots Endpoint', () => {
  let mockRequest: Request;
  const mockAuthHeader = 'Basic dGVzdDp0ZXN0';

  beforeEach(() => {
    // Reset mock request
    mockRequest = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      }
    });
  });

  it('should validate required parameters', async () => {
    // Test missing url
    const requestNoUrl = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selected_configs: [{
          device_type: 'desktop',
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest'
        }]
      })
    });

    const responseNoUrl = await handler(requestNoUrl);
    expect(responseNoUrl.status).toBe(400);
    const errorNoUrl = await responseNoUrl.json();
    expect(errorNoUrl.error).toBe('Missing required parameter: url');

    // Test missing selected_configs
    const requestNoConfigs = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com'
      })
    });

    const responseNoConfigs = await handler(requestNoConfigs);
    expect(responseNoConfigs.status).toBe(400);
    const errorNoConfigs = await responseNoConfigs.json();
    expect(errorNoConfigs.error).toBe('Missing required parameter: selected_configs');

    // Test empty selected_configs array
    const requestEmptyConfigs = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: []
      })
    });

    const responseEmptyConfigs = await handler(requestEmptyConfigs);
    expect(responseEmptyConfigs.status).toBe(400);
    const errorEmptyConfigs = await responseEmptyConfigs.json();
    expect(errorEmptyConfigs.error).toBe('Invalid parameter: selected_configs must be a non-empty array of browser configurations');
  });

  it('should validate browser configuration parameters', async () => {
    // Test missing device_type
    const requestNoDeviceType = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest'
        }]
      })
    });

    const responseNoDeviceType = await handler(requestNoDeviceType);
    expect(responseNoDeviceType.status).toBe(400);
    const errorNoDeviceType = await responseNoDeviceType.json();
    expect(errorNoDeviceType.error).toBe('Invalid browser configuration: missing required fields (os, os_version, device_type)');

    // Test missing browser for desktop configuration
    const requestNoBrowser = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          device_type: 'desktop',
          os: 'Windows',
          os_version: '11'
        }]
      })
    });

    const responseNoBrowser = await handler(requestNoBrowser);
    expect(responseNoBrowser.status).toBe(400);
    const errorNoBrowser = await responseNoBrowser.json();
    expect(errorNoBrowser.error).toBe('Browser name is required for desktop configurations');

    // Test missing device for mobile configuration
    const requestNoDevice = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          device_type: 'mobile',
          os: 'ios',
          os_version: '16'
        }]
      })
    });

    const responseNoDevice = await handler(requestNoDevice);
    expect(responseNoDevice.status).toBe(400);
    const errorNoDevice = await responseNoDevice.json();
    expect(errorNoDevice.error).toBe('Device name is required for mobile configurations');

    // Test invalid device type
    const requestInvalidDeviceType = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          device_type: 'invalid',
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest'
        }]
      })
    });

    const responseInvalidDeviceType = await handler(requestInvalidDeviceType);
    expect(responseInvalidDeviceType.status).toBe(400);
    const errorInvalidDeviceType = await responseInvalidDeviceType.json();
    expect(errorInvalidDeviceType.error).toBe('Invalid device_type: must be either "desktop" or "mobile"');

    // Test invalid iOS device
    const requestInvalidIOSDevice = new Request('http://localhost:8000/browserstack-screenshots', {
      method: 'POST',
      headers: {
        'Authorization': mockAuthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          device_type: 'mobile',
          os: 'ios',
          os_version: '16',
          device: 'InvalidPhone'
        }]
      })
    });

    const responseInvalidIOSDevice = await handler(requestInvalidIOSDevice);
    expect(responseInvalidIOSDevice.status).toBe(400);
    const errorInvalidIOSDevice = await responseInvalidIOSDevice.json();
    expect(errorInvalidIOSDevice.error).toBe('Invalid iOS device: InvalidPhone. Valid devices are: iPhone 15, iPhone 14, iPhone 13, iPhone 12, iPhone 11, iPhone X');
  });
}); 