-- Reuse signed section contributions and existing rating/ownership policies.
alter table public.section_comments
  drop constraint section_comments_subject_type_check;
alter table public.section_comments
  add constraint section_comments_subject_type_check check (subject_type in (
    'glossary_era_summary', 'glossary_era_characteristics',
    'glossary_term_definition', 'composer_summary'
  ));
