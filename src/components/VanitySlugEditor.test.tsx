import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import VanitySlugEditor from './VanitySlugEditor';

describe('VanitySlugEditor', () => {
  test('shows "Claim your URL" button when no slug', () => {
    const { getByText } = render(
      <VanitySlugEditor userId="test-id" currentSlug={null} onSlugChange={() => {}} />
    );
    expect(getByText('Claim your URL')).toBeTruthy();
  });

  test('shows current slug with Change link when slug exists', () => {
    const { getByText } = render(
      <VanitySlugEditor userId="test-id" currentSlug="cellist-anna" onSlugChange={() => {}} />
    );
    expect(getByText(/cellist-anna/)).toBeTruthy();
    expect(getByText('Change')).toBeTruthy();
  });

  test('shows input field after clicking Claim', () => {
    const { getByText, getByPlaceholderText } = render(
      <VanitySlugEditor userId="test-id" currentSlug={null} onSlugChange={() => {}} />
    );
    fireEvent.click(getByText('Claim your URL'));
    expect(getByPlaceholderText('your-username')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  test('shows pre-filled input after clicking Change', () => {
    const { getByText, getByDisplayValue } = render(
      <VanitySlugEditor userId="test-id" currentSlug="cellist-anna" onSlugChange={() => {}} />
    );
    fireEvent.click(getByText('Change'));
    expect(getByDisplayValue('cellist-anna')).toBeTruthy();
  });
});
