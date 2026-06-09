-- Per-pair media for chat responses. Both nullable, no CHECK (mirrors the
-- audit_status='seed' precedent). Forward-only, additive — no backfill.
-- image_slug → /media/img/<slug>.webp (content image)
-- mood       → /media/gif/<mood>/* pool (reaction GIF)
ALTER TABLE pairs ADD COLUMN IF NOT EXISTS image_slug TEXT;
ALTER TABLE pairs ADD COLUMN IF NOT EXISTS mood       TEXT;
