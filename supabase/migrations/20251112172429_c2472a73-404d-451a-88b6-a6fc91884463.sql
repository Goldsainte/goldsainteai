-- Add CASCADE delete for journal article blocks
-- Drop existing foreign key constraint
ALTER TABLE journal_article_blocks
DROP CONSTRAINT IF EXISTS journal_article_blocks_article_id_fkey;

-- Re-add foreign key with ON DELETE CASCADE
ALTER TABLE journal_article_blocks
ADD CONSTRAINT journal_article_blocks_article_id_fkey
FOREIGN KEY (article_id)
REFERENCES journal_articles(id)
ON DELETE CASCADE;