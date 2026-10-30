import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { hasSupabase } from '../lib/supabase';
import { curatedResources } from '../lib/upkeepResources';
import UpkeepResources from './UpkeepResources';
const offlineTest = hasSupabase ? test.skip : test;
afterEach(cleanup);
offlineTest('curated references retain voting controls and clearly explain unavailable persistence', () => {
  const view = render(<UpkeepResources category="voice" level="advanced" initial={curatedResources('voice', 'advanced')} intro="Resources" />);
  expect(view.getAllByRole('button', { name: /^Helpful:/ }).length).toBe(2);
  for (const button of view.getAllByRole('button', { name: /helpful:/i })) expect((button as HTMLButtonElement).disabled).toBe(true);
  expect(view.getByText(/unavailable in this preview/)).toBeTruthy();
  expect(view.queryByText(/Submitted by/)).toBeNull();
});
offlineTest('submission form has labeled fields and cancel returns focus to add', () => {
  const view = render(<UpkeepResources category="voice" level="advanced" initial={curatedResources('voice', 'advanced')} intro="Resources" />);
  const add = view.getByRole('button', { name: '+ Add resource' });
  fireEvent.click(add);
  for (const name of ['Topic', 'Resource title', 'Resource URL', 'Publisher or organization', 'Instrument or voice scope', 'Short factual description']) expect(view.getByLabelText(name)).toBeTruthy();
  expect((view.getByRole('button', { name: 'Sign in to submit' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
  expect(view.queryByLabelText('Resource URL')).toBeNull();
  expect(document.activeElement).toBe(add);
});
