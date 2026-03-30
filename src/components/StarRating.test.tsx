import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  test('renders 5 stars', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('span > span');
    expect(stars.length).toBe(5);
  });

  test('filled stars have no opacity class', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('span > span');
    for (let i = 0; i < 3; i++) {
      expect(stars[i].className).not.toContain('opacity-30');
    }
  });

  test('unfilled stars have opacity-30', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('span > span');
    for (let i = 3; i < 5; i++) {
      expect(stars[i].className).toContain('opacity-30');
    }
  });

  test('rating 0 makes all stars dim', () => {
    const { container } = render(<StarRating rating={0} />);
    const stars = container.querySelectorAll('span > span');
    for (const star of stars) {
      expect(star.className).toContain('opacity-30');
    }
  });

  test('rating 5 makes all stars bright', () => {
    const { container } = render(<StarRating rating={5} />);
    const stars = container.querySelectorAll('span > span');
    for (const star of stars) {
      expect(star.className).not.toContain('opacity-30');
    }
  });

  test('sm size uses text-sm class', () => {
    const { container } = render(<StarRating rating={3} size="sm" />);
    expect(container.firstElementChild?.className).toContain('text-sm');
  });

  test('md size uses text-base class', () => {
    const { container } = render(<StarRating rating={3} size="md" />);
    expect(container.firstElementChild?.className).toContain('text-base');
  });
});
