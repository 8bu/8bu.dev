-- ════════════════════════════════════════════════════════════════════════
-- documents.topic — artifact deep-link discriminator (8bu.dev only)
-- ════════════════════════════════════════════════════════════════════════
-- The portfolio web app deep-links artifact cards by a topic slug
-- ("portfolio/artifact/<slug>"). @cosimi generates pairs without topics, so
-- the slug lives on the source DOCUMENT (stamped at ingest from md frontmatter)
-- and the /chat handler derives metadata.topic from a hit's source document.
-- Additive + idempotent. Also drops the now-vestigial pairs_topic_idx: generated
-- pairs leave pairs.topic NULL (topic moved to documents).
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE documents ADD COLUMN IF NOT EXISTS topic text;
CREATE INDEX IF NOT EXISTS documents_topic_idx ON documents (topic) WHERE topic IS NOT NULL;

DROP INDEX IF EXISTS pairs_topic_idx;
