import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComparisonButton } from '../components/ComparisonButton';

describe('ComparisonButton', () => {
  it('should show initial state correctly', () => {
    render(<ComparisonButton 
      baselineUrl="https://example.com/baseline"
      newVersionUrl="https://example.com/new"
      selectedConfigs={[{
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: 'latest'
      }]}
    />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600'); // Initial blue color
    expect(button).toHaveTextContent('Start Comparison');
  });

  it('should update state during processing', async () => {
    const mockGenerateScreenshots = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      state: 'processing',
      screenshots: []
    });

    render(<ComparisonButton 
      baselineUrl="https://example.com/baseline"
      newVersionUrl="https://example.com/new"
      selectedConfigs={[{
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: 'latest'
      }]}
      onScreenshotsGenerated={mockGenerateScreenshots}
    />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveClass('bg-yellow-500'); // Yellow during processing
    expect(button).toHaveTextContent('Processing screenshots');
  });

  it('should update state when screenshots are ready', async () => {
    const mockScreenshots = {
      baseline: {
        id: 'baseline-id',
        image_url: 'https://example.com/baseline.png'
      },
      newVersion: {
        id: 'new-id',
        image_url: 'https://example.com/new.png'
      }
    };

    const mockGenerateScreenshots = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      state: 'done',
      screenshots: [mockScreenshots.baseline, mockScreenshots.newVersion]
    });

    render(<ComparisonButton 
      baselineUrl="https://example.com/baseline"
      newVersionUrl="https://example.com/new"
      selectedConfigs={[{
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: 'latest'
      }]}
      onScreenshotsGenerated={mockGenerateScreenshots}
    />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for state update
    await screen.findByText('Screenshots are ready');
    expect(button).toHaveClass('bg-green-500'); // Green when done
  });

  it('should display screenshots side by side when ready', async () => {
    const mockScreenshots = {
      baseline: {
        id: 'baseline-id',
        image_url: 'https://example.com/baseline.png'
      },
      newVersion: {
        id: 'new-id',
        image_url: 'https://example.com/new.png'
      }
    };

    const mockGenerateScreenshots = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      state: 'done',
      screenshots: [mockScreenshots.baseline, mockScreenshots.newVersion]
    });

    render(<ComparisonButton 
      baselineUrl="https://example.com/baseline"
      newVersionUrl="https://example.com/new"
      selectedConfigs={[{
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: 'latest'
      }]}
      onScreenshotsGenerated={mockGenerateScreenshots}
    />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for screenshots to be displayed
    const baselineImg = await screen.findByAltText('Baseline screenshot');
    const newVersionImg = await screen.findByAltText('New version screenshot');

    expect(baselineImg).toBeVisible();
    expect(newVersionImg).toBeVisible();
    expect(baselineImg).toHaveAttribute('src', mockScreenshots.baseline.image_url);
    expect(newVersionImg).toHaveAttribute('src', mockScreenshots.newVersion.image_url);
  });
}); 