import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import DigitalJournalBook from './DigitalJournalBook';
afterEach(cleanup);
test('empty journal has turnable blank spreads and can turn back', async () => {
 const view = render(<DigitalJournalBook entries={[]} onRemove={() => {}} />);
 const next = view.getByRole('button',{name:'Next page →'}) as HTMLButtonElement;
 const previous = view.getByRole('button',{name:'← Previous page'}) as HTMLButtonElement;
 expect(next.disabled).toBe(false);
 expect(previous.disabled).toBe(true);
 fireEvent.click(next);
 await waitFor(() => expect(view.getByText('Pages 3–4 of 8')).toBeTruthy());
 expect(previous.disabled).toBe(false);
 fireEvent.click(previous);
 await waitFor(() => expect(view.getByText('Pages 1–2 of 8')).toBeTruthy());
});
test('one-entry journal retains blank pages after its entry', () => {
 const view = render(<DigitalJournalBook entries={[{id:1,title:'After the concert',text:'A thought.',date:''}]} onRemove={() => {}} />);
 expect(view.getByText('After the concert')).toBeTruthy();
 expect((view.getByRole('button',{name:'Next page →'}) as HTMLButtonElement).disabled).toBe(false);
});
