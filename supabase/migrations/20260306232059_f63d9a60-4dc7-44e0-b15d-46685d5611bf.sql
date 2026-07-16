-- Create Kathy Hochul subject
INSERT INTO subjects (name) VALUES ('Kathy Hochul') ON CONFLICT DO NOTHING;

-- Reassign mention_events from 'Unknown' to 'Kathy Hochul' where the title mentions Hochul
UPDATE mention_events 
SET subject_id = (SELECT id FROM subjects WHERE name = 'Kathy Hochul' LIMIT 1)
WHERE subject_id = (SELECT id FROM subjects WHERE name = 'Unknown' LIMIT 1)
  AND (title ILIKE '%hochul%' OR kalshi_event_ticker ILIKE '%HOCHUL%');

-- Clean up: delete 'Unknown' subject if no events reference it anymore
DELETE FROM subjects WHERE name = 'Unknown' AND id NOT IN (SELECT DISTINCT subject_id FROM mention_events);