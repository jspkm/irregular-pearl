import { expect, test } from 'bun:test';
import { searchSiteContent } from './siteSearch';
test('finds resources and schools with filtered catalog destinations', () => {
  expect(searchSiteContent('IMSLP').some(row => row.href.startsWith('/opportunities?q=') && row.title.includes('IMSLP'))).toBe(true);
  expect(searchSiteContent('Juilliard').some(row => row.href.startsWith('/opportunities?q='))).toBe(true);
});
test('finds programs, glossary terms, and eras with existing routes', () => {
  expect(searchSiteContent('Yellow Barn').some(row => row.href.startsWith('/opportunities/'))).toBe(true);
  expect(searchSiteContent('rubato').some(row => row.result_type === 'glossary' && row.href.includes('#term-'))).toBe(true);
  expect(searchSiteContent('Ars Nova').some(row => row.href === '/glossary/era/14th-century')).toBe(true);
  expect(searchSiteContent(' ')).toEqual([]);
  expect(searchSiteContent('nonexistentzzz')).toEqual([]);
});
