-- Reassign events from orphan "60min" to "Pete Hegseth"
UPDATE mention_events 
SET subject_id = 'a1503698-d86f-41a2-8610-b50064f12d43' 
WHERE subject_id = 'bfc94b43-c5a4-4440-9e93-093fe239bbfa';

-- Delete the orphan
DELETE FROM subjects WHERE id = 'bfc94b43-c5a4-4440-9e93-093fe239bbfa';