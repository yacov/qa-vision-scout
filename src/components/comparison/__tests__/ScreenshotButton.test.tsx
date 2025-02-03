import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreenshotButton } from '../ScreenshotButton';
import { type Config } from '../types';
import { vi, describe, it, expect } from 'vitest';

describe('ScreenshotButton', () => {
  const mockConfig: Config = {
    id: '1',
    name: 'Test Config',
    device_type: 'desktop',
    os: 'Windows',
    os_version: '10',
    browser: 'Chrome',
    browser_version: '100',
    device: null,
    is_active: true,
    created_at: null,
    user_id: '123',
    is_predefined: false
  };

  const defaultProps = {
    baselineUrl: 'https://example.com',
    newUrl: 'https://example.com/new',
    selectedConfigs: [mockConfig],
    onScreenshotsGenerated: vi.fn(),
    className: '',
    disabled: false
  };

  it('renders with default state', () => {
    render(<ScreenshotButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('Generate Screenshots');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when no configs are selected', () => {
    render(
      <ScreenshotButton
        {...defaultProps}
        selectedConfigs={[]}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows processing state when generating screenshots', async () => {
    const onScreenshotsGenerated = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <ScreenshotButton
        {...defaultProps}
        onScreenshotsGenerated={onScreenshotsGenerated}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('Processing Screenshots');
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Screenshots Ready');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('handles errors gracefully', async () => {
    const onScreenshotsGenerated = vi.fn(() => Promise.reject(new Error('Test error')));
    
    render(
      <ScreenshotButton
        {...defaultProps}
        onScreenshotsGenerated={onScreenshotsGenerated}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Generate Screenshots');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});