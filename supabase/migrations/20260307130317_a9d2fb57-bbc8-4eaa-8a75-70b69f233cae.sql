-- Reassign the orphan "Trump" event to "Donald Trump"
UPDATE mention_events 
SET subject_id = '0abf5d2c-c42b-4119-b2dd-574a30f20db0' 
WHERE subject_id = 'fbfbaae9-13ec-451d-be1f-c971accf4344';

-- Delete the orphan "Trump" subject
DELETE FROM subjects WHERE id = 'fbfbaae9-13ec-451d-be1f-c971accf4344';