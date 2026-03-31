-- Expand link_type enum with new embeddable/free platforms
ALTER TYPE link_type ADD VALUE IF NOT EXISTS 'spotify';
ALTER TYPE link_type ADD VALUE IF NOT EXISTS 'soundcloud';
ALTER TYPE link_type ADD VALUE IF NOT EXISTS 'bandcamp';
ALTER TYPE link_type ADD VALUE IF NOT EXISTS 'internet_archive';
ALTER TYPE link_type ADD VALUE IF NOT EXISTS 'vimeo';
