import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import EraTerms from './EraTerms';
import { hasSupabase } from '../lib/supabase';
// These interaction tests exercise the disconnected preview; no external database requests.
const offlineTest = hasSupabase ? test.skip : test;
afterEach(cleanup);
const terms = [{ id: 'plainchant', term: 'Plainchant', definition: 'Unaccompanied sacred monophony.' }];
offlineTest('definitions open without navigating and dismiss with Escape', () => {
  const view = render(<EraTerms eraId="6th-9th-century" terms={terms} />);
  const trigger = view.getByRole('button', { name: 'Plainchant' });
  expect(view.queryByRole('tooltip')).toBeNull();
  fireEvent.mouseEnter(trigger.parentElement!);
  expect(view.getByRole('tooltip').textContent).toContain(terms[0].definition);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(view.queryByRole('tooltip')).toBeNull();
  fireEvent.focus(trigger);
  expect(view.getByRole('tooltip')).toBeTruthy();
  fireEvent.blur(trigger);
  fireEvent.click(trigger);
  expect(view.getByRole('tooltip')).toBeTruthy();
  fireEvent.pointerDown(document.body);
  expect(view.queryByRole('tooltip')).toBeNull();
});
offlineTest('add form has labeled fields and honestly disables unavailable saving', () => {
  const view = render(<EraTerms eraId="6th-9th-century" terms={terms} />);
  fireEvent.click(view.getByRole('button', { name: '+ Add term' }));
  expect(view.getByLabelText('Term')).toBeTruthy();
  expect(view.getByLabelText('Definition')).toBeTruthy();
  expect((view.getByRole('button', { name: 'Sign in to add term' }) as HTMLButtonElement).disabled).toBe(!hasSupabase);
  fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
  expect(view.queryByLabelText('Term')).toBeNull();
});
