import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import UsernameEditor from './UsernameEditor';

describe('UsernameEditor', () => {
  test('shows "Claim your URL" button when no username', () => {
    const { getByText } = render(
      <UsernameEditor userId="test-id" currentUsername={null} onUsernameChange={() => {}} />
    );
    expect(getByText('Claim your URL')).toBeTruthy();
  });

  test('shows current username with Change link when username exists', () => {
    const { getByText } = render(
      <UsernameEditor userId="test-id" currentUsername="cellist-anna" onUsernameChange={() => {}} />
    );
    expect(getByText(/cellist-anna/)).toBeTruthy();
    expect(getByText('Change username')).toBeTruthy();
  });

  test('shows input field after clicking Claim', () => {
    const { getByText, getByPlaceholderText } = render(
      <UsernameEditor userId="test-id" currentUsername={null} onUsernameChange={() => {}} />
    );
    fireEvent.click(getByText('Claim your URL'));
    expect(getByPlaceholderText('your-username')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  test('shows pre-filled input after clicking Change username', () => {
    const { getByText, getByDisplayValue } = render(
      <UsernameEditor userId="test-id" currentUsername="cellist-anna" onUsernameChange={() => {}} />
    );
    fireEvent.click(getByText('Change username'));
    expect(getByDisplayValue('cellist-anna')).toBeTruthy();
  });

  test('shows View link to public profile', () => {
    const { getByText } = render(
      <UsernameEditor userId="test-id" currentUsername="cellist-anna" onUsernameChange={() => {}} />
    );
    const viewLink = getByText('View');
    expect(viewLink).toBeTruthy();
    expect(viewLink.getAttribute('href')).toBe('/@cellist-anna');
  });
});
