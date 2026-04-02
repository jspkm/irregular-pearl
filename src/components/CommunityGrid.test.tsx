import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect, afterEach } from 'bun:test';
import { render, fireEvent, cleanup } from '@testing-library/react';
import CommunityGrid from './CommunityGrid';

const mockArtists = [
  { id: 'a1', display_name: 'Yuja Kim', instrument: 'Piano', level: 'professional', avatar_url: null, vanity_slug: 'yuja', created_at: new Date().toISOString() },
  { id: 'a2', display_name: 'Daniel Lee', instrument: 'Cello', level: 'student', avatar_url: null, vanity_slug: 'daniel', created_at: new Date().toISOString() },
  { id: 'a3', display_name: 'Sofia Martinez', instrument: 'Violin', level: 'teacher', avatar_url: null, vanity_slug: 'sofia', created_at: new Date().toISOString() },
];

const mockApplause = { a1: 47, a2: 1 };
const mockActivity = {
  a1: { piece_title: 'Rachmaninoff Piano Concerto No. 3', activity: 'practicing', created_at: new Date().toISOString() },
  a2: { piece_title: 'Dvorak Cello Concerto', activity: 'working_on', created_at: new Date().toISOString() },
  a3: { piece_title: 'Sibelius Violin Concerto', activity: 'sight_read', created_at: new Date().toISOString() },
};

const defaultProps = {
  artists: mockArtists,
  applauseCounts: mockApplause,
  recentActivity: mockActivity,
  recentlyActive: ['a1', 'a2', 'a3'],
  allInstruments: ['Piano', 'Cello', 'Violin'],
  newMembers: [mockArtists[2]],
};

describe('CommunityGrid', () => {
  afterEach(() => cleanup());

  test('renders filter tabs including All', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const tabs = container.querySelectorAll('button');
    const tabTexts = Array.from(tabs).map(t => t.textContent);
    expect(tabTexts).toContain('All');
    expect(tabTexts).toContain('Piano');
    expect(tabTexts).toContain('Cello');
    expect(tabTexts).toContain('Violin');
  });

  test('renders Recently Active section with count', () => {
    const { getByText } = render(<CommunityGrid {...defaultProps} />);
    expect(getByText('Recently Active')).toBeTruthy();
    expect(getByText('3 musicians')).toBeTruthy();
  });

  test('renders all artist cards when All filter is active', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const names = container.querySelectorAll("[class*='Instrument_Serif']");
    const nameTexts = Array.from(names).map(n => n.textContent);
    expect(nameTexts).toContain('Yuja Kim');
    expect(nameTexts).toContain('Daniel Lee');
    expect(nameTexts).toContain('Sofia Martinez');
  });

  test('filters by instrument when tab is clicked', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const tabs = container.querySelectorAll('button');
    const pianoTab = Array.from(tabs).find(t => t.textContent === 'Piano');
    expect(pianoTab).toBeTruthy();
    fireEvent.click(pianoTab!);

    const cardNames = container.querySelectorAll("[class*='Instrument_Serif']");
    const nameTexts = Array.from(cardNames).map(n => n.textContent);
    expect(nameTexts).toContain('Yuja Kim');
    expect(nameTexts).not.toContain('Daniel Lee');
  });

  test('updates musician count after filtering', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const tabs = container.querySelectorAll('button');
    const pianoTab = Array.from(tabs).find(t => t.textContent === 'Piano');
    fireEvent.click(pianoTab!);
    expect(container.textContent).toContain('1 musician');
  });

  test('shows working on snippet in artist cards', () => {
    const { getByText } = render(<CommunityGrid {...defaultProps} />);
    expect(getByText('Rachmaninoff Piano Concerto No. 3')).toBeTruthy();
  });

  test('renders New Members section', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    expect(container.textContent).toContain('New Members');
    const chips = container.querySelectorAll('a[href="/@sofia"]');
    expect(chips.length).toBeGreaterThan(0);
  });

  test('does not render New Members when empty', () => {
    const { container } = render(<CommunityGrid {...defaultProps} newMembers={[]} />);
    expect(container.textContent).not.toContain('New Members');
  });

  test('shows empty state when no artists match filter', () => {
    const { container } = render(
      <CommunityGrid {...defaultProps} allInstruments={['Piano', 'Cello', 'Violin', 'Flute']} />
    );
    const tabs = container.querySelectorAll('button');
    const fluteTab = Array.from(tabs).find(t => t.textContent === 'Flute');
    fireEvent.click(fluteTab!);
    expect(container.textContent).toContain('No recently active musicians');
  });

  test('active filter tab has accent styling', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const tabs = container.querySelectorAll('button');
    const allTab = Array.from(tabs).find(t => t.textContent === 'All')!;
    expect(allTab.className).toContain('bg-accent');

    const celloTab = Array.from(tabs).find(t => t.textContent === 'Cello')!;
    fireEvent.click(celloTab);
    expect(celloTab.className).toContain('bg-accent');
    expect(allTab.className).not.toContain('bg-accent');
  });

  test('artist card links to vanity slug profile', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    const links = container.querySelectorAll('a[href="/@yuja"]');
    expect(links.length).toBeGreaterThan(0);
  });

  test('each artist card has an Applaud button', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    // Each card has an ApplaudButton which renders a button
    const applaudButtons = Array.from(container.querySelectorAll('button'))
      .filter(b => b.textContent === 'Applaud');
    expect(applaudButtons.length).toBe(3);
  });

  test('level badges render correctly', () => {
    const { container } = render(<CommunityGrid {...defaultProps} />);
    expect(container.textContent).toContain('professional');
    expect(container.textContent).toContain('student');
    expect(container.textContent).toContain('teacher');
  });
});
