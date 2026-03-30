import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import GenerativeAvatar, { getAvatarSvg, avatarDataUrl } from './GenerativeAvatar';

describe('getAvatarSvg', () => {
  test('returns valid SVG string', () => {
    const svg = getAvatarSvg('user-123');
    expect(svg).toStartWith('<svg');
    expect(svg).toEndWith('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('is deterministic — same input gives same output', () => {
    expect(getAvatarSvg('user-abc')).toBe(getAvatarSvg('user-abc'));
  });

  test('different users get different avatars', () => {
    const a = getAvatarSvg('alice');
    const b = getAvatarSvg('bob');
    // Not guaranteed to differ for all inputs, but should for these
    expect(a).not.toBe(b);
  });
});

describe('avatarDataUrl', () => {
  test('returns data URI', () => {
    const url = avatarDataUrl('user-123');
    expect(url).toStartWith('data:image/svg+xml,');
  });

  test('is deterministic', () => {
    expect(avatarDataUrl('test')).toBe(avatarDataUrl('test'));
  });
});

describe('GenerativeAvatar component', () => {
  test('renders an img element', () => {
    const { container } = render(<GenerativeAvatar userId="user-123" />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toStartWith('data:image/svg+xml,');
  });

  test('applies size prop', () => {
    const { container } = render(<GenerativeAvatar userId="user-123" size={40} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('width')).toBe('40');
    expect(img?.getAttribute('height')).toBe('40');
  });

  test('applies className prop', () => {
    const { container } = render(<GenerativeAvatar userId="user-123" className="custom" />);
    const img = container.querySelector('img');
    expect(img?.className).toContain('custom');
    expect(img?.className).toContain('rounded-full');
  });
});
