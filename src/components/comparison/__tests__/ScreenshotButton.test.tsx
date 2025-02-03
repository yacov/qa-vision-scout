import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotButton } from '../ScreenshotButton';
import { Config } from '../types';
import '@testing-library/jest-dom';

const mockConfigs: Config[] = [
  {
    id: '1',
    name: 'Windows Chrome',
    device_type: 'desktop',
    os: 'Windows',
    os_version: '10',
    browser: 'chrome',
    browser_version: '121.0',
    device: null,
    is_active: true,
    created_at: null,
    user_id: '1',
    is_predefined: true
  }
];

describe('ScreenshotButton', () => {
  it('should show initial state correctly', () => {
    const mockOnScreenshotsGenerated = vi.fn();
    render(
      <ScreenshotButton 
        baselineUrl="https://example.com/baseline"
        newUrl="https://example.com/new"
        selectedConfigs={mockConfigs}
        onScreenshotsGenerated={mockOnScreenshotsGenerated}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Generate Screenshots');
    expect(button).not.toBeDisabled();
  });

  it('should be disabled when no configs are selected', () => {
    const mockOnScreenshotsGenerated = vi.fn();
    render(
      <ScreenshotButton 
        baselineUrl="https://example.com/baseline"
        newUrl="https://example.com/new"
        selectedConfigs={[]}
        onScreenshotsGenerated={mockOnScreenshotsGenerated}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should update state during processing', async () => {
    const mockOnScreenshotsGenerated = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <ScreenshotButton 
        baselineUrl="https://example.com/baseline"
        newUrl="https://example.com/new"
        selectedConfigs={mockConfigs}
        onScreenshotsGenerated={mockOnScreenshotsGenerated}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveTextContent('Processing Screenshots');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(button).toHaveTextContent('Screenshots Ready');
      expect(button).not.toBeDisabled();
    });
  });

  it('should handle errors gracefully', async () => {
    const mockOnScreenshotsGenerated = vi.fn().mockRejectedValue(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ScreenshotButton 
        baselineUrl="https://example.com/baseline"
        newUrl="https://example.com/new"
        selectedConfigs={mockConfigs}
        onScreenshotsGenerated={mockOnScreenshotsGenerated}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Generate Screenshots');
      expect(button).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });
});