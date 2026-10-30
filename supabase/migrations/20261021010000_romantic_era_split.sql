-- Preserve existing early-era submissions and allow the new late-era category.
alter table public.glossary_era_terms drop constraint glossary_era_terms_era_id_check;
alter table public.glossary_era_terms add constraint glossary_era_terms_era_id_check check (era_id in ('antiquity','6th-9th-century','10th-12th-century','13th-century','14th-century','15th-century','16th-century','17th-century','late-baroque','18th-century','19th-century','late-romanticism','20th-century','21st-century'));
