-- Reassign events from orphan "Trump" to "Donald Trump"
UPDATE mention_events 
SET subject_id = '0abf5d2c-c42b-4119-b2dd-574a30f20db0' 
WHERE subject_id = 'fa3f824f-3828-4cd5-b525-a0397d3a2773';

-- Delete the orphan
DELETE FROM subjects WHERE id = 'fa3f824f-3828-4cd5-b525-a0397d3a2773';