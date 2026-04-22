-- Rename difficulty enum value 'professional' to 'virtuoso'.
-- 'professional' described job status, not a property of the music.
-- 'virtuoso' is the standard repertoire-grading term for the tier above
-- 'advanced' (Henle, ABRSM, conservatory conventions).
-- The user_level enum keeps 'professional' — that one is correctly a job status.

alter type difficulty rename value 'professional' to 'virtuoso';
