import { opportunities } from '../data/opportunities';
import { careerResources, getCareerResourceTypes } from '../data/careerResources';
import { musicSchools } from '../data/musicSchools';
import { musicPeriods } from '../data/musicPeriods';
import { musicTerms } from '../data/musicTerms';
const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export function searchSiteContent(query: string) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (words.join('').length < 2) return [];
  const matches = (text: string) => words.every(word => normalize(text).includes(word));
  const opportunityRows = [
    ...opportunities.map(entry => ({ title: entry.name, detail: entry.type, text: `${entry.name} ${entry.shortName ?? ''} ${entry.type} ${entry.location} ${entry.summary} ${entry.disciplines.join(' ')}`, href: `/opportunities/${entry.id}` })),
    ...careerResources.map(entry => ({ title: entry.name, detail: getCareerResourceTypes(entry).join(' · '), text: `${entry.name} ${entry.authors ?? ''} ${entry.description} ${getCareerResourceTypes(entry).join(' ')}`, href: `/opportunities?q=${encodeURIComponent(entry.name)}` })),
    ...musicSchools.map(entry => ({ title: entry.name, detail: entry.kind, text: `${entry.name} ${entry.kind} ${entry.city} ${entry.state}`, href: `/opportunities?q=${encodeURIComponent(entry.name)}` })),
  ].filter(entry => matches(entry.text)).slice(0, 8).map(entry => ({ ...entry, result_type: 'resource' as const }));
  const glossaryRows = [
    ...musicPeriods.map(era => ({ title: era.title, detail: era.span, text: `${era.title} ${era.span} ${era.description}`, href: `/glossary/era/${era.id}` })),
    ...musicTerms.map(term => ({ title: term.term, detail: term.category, text: `${term.term} ${(term.aliases ?? []).join(' ')} ${term.definition}`, href: `/glossary/era/${term.historicalPeriodId}#term-${term.id}` })),
  ].filter(entry => matches(entry.text)).slice(0, 8).map(entry => ({ ...entry, result_type: 'glossary' as const }));
  return [...opportunityRows, ...glossaryRows].map(entry => ({ result_type: entry.result_type, id: entry.href, href: entry.href, title: entry.title, composer_name: entry.detail, catalog_number: null, instruments: null, is_materialized: true }));
}
