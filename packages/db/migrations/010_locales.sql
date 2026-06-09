-- Per-row locale tagging for pairs.
--
-- Default 'und' (ISO 639-3 BCP-47 "undetermined") so existing rows stay eligible
-- under any primary locale as a low-priority fallback — no data backfill.
--
-- TEXT (not CHAR(N) or enum) is deliberate: adding a third locale later
-- (ja, zh-Hant, …) is a UI <select> option + a fallback_message_<x> row,
-- never a schema migration.

ALTER TABLE pairs ADD COLUMN locale TEXT NOT NULL DEFAULT 'und';

-- Partial index mirrors the existing matcher index pattern. The matcher's
-- per-locale WHERE adds `AND (locale = $1 OR locale = 'und')`, so a small
-- index on `locale` (filtered to live rows) lets the optimizer skip
-- soft-deletes without paying for them in the index size.
CREATE INDEX pairs_locale_idx ON pairs (locale) WHERE deleted_at IS NULL;

-- NOTE (8bu.dev): the original cosimi 010 also seeded per-locale fallback
-- messages into `app_config`. portf has no app_config table (no templates; the
-- no-match fallback is FE i18n chrome), so that INSERT is dropped here. The live
-- Neon `portf` DB already has the original 010 applied under this filename, so
-- its migrate tracking table skips it — only fresh local/test DBs apply this
-- trimmed version.
