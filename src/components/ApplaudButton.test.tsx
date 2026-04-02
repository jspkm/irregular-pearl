import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect, afterEach } from 'bun:test';
import { render, cleanup } from '@testing-library/react';
import ApplaudButton from './ApplaudButton';

describe('ApplaudButton', () => {
  afterEach(() => cleanup());

  test('renders Applaud button in default mode', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Applaud');
  });

  test('renders Applaud button in compact mode', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" compact />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Applaud');
  });

  test('shows no count text when count is zero (default state)', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" />);
    // Count should be empty initially (zero applause = hidden)
    const spans = container.querySelectorAll('span');
    const countSpan = Array.from(spans).find(s => s.textContent?.includes('applause'));
    expect(countSpan).toBeFalsy();
  });

  test('button has amber accent styling', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-accent');
    expect(button?.className).toContain('text-accent');
    expect(button?.className).toContain('rounded-full');
  });

  test('compact mode has smaller text size', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" compact />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-xs');
  });

  test('default mode has larger text size', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-[13px]');
  });

  test('renders pill-shaped button', () => {
    const { container } = render(<ApplaudButton artistId="artist-123" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('rounded-full');
  });
});
