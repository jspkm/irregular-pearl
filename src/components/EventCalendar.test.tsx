import { describe, test, expect } from 'bun:test';
import { renderToString } from 'react-dom/server';
import EventCalendar from './EventCalendar';

describe('EventCalendar', () => {
  test('renders toggle button by default (not expanded)', () => {
    const html = renderToString(<EventCalendar mode="upcoming" city="" eventType="" />);
    expect(html).toContain('Show calendar view');
  });

  test('accepts mode prop', () => {
    const html = renderToString(<EventCalendar mode="archive" city="" eventType="" />);
    expect(html).toContain('Show calendar view');
  });

  test('accepts city and eventType props', () => {
    const html = renderToString(<EventCalendar mode="upcoming" city="Boston" eventType="recital" />);
    expect(html).toBeTruthy();
  });
});
