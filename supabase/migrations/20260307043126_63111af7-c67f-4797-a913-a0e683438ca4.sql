
DO $$
DECLARE
  mapping RECORD;
  correct_subject_id uuid;
BEGIN
  -- Define all remaining mappings as (old_name, new_name) pairs
  FOR mapping IN 
    SELECT * FROM (VALUES
      ('60min', '60 Minutes'),
      ('Acooper', 'Anderson Cooper'),
      ('Althoff', 'Judson Althoff'),
      ('Altman', 'Sam Altman'),
      ('Amodei', 'Dario Amodei'),
      ('Apple', 'Apple'),
      ('Award', 'Awards Show'),
      ('Bannon', 'Steve Bannon'),
      ('Barkley', 'Charles Barkley'),
      ('Barr', 'Bill Barr'),
      ('Benioff', 'Marc Benioff'),
      ('Bessentmtp', 'Scott Bessent'),
      ('Bilateral', 'Bilateral Meeting'),
      ('Bush', 'George W. Bush'),
      ('Candeb', 'Canadian Debate'),
      ('Carlson', 'Tucker Carlson'),
      ('Cena', 'John Cena'),
      ('Cfb', 'College Football'),
      ('Cma', 'CMA Awards'),
      ('Colbert', 'Stephen Colbert'),
      ('Congress', 'Congress'),
      ('Costa', 'António Costa'),
      ('Crockett', 'Jasmine Crockett'),
      ('Culture', 'Culture'),
      ('Cuomo', 'Chris Cuomo'),
      ('Dillon', 'Dillon'),
      ('Djtjustice', 'Trump Justice'),
      ('Djtnato', 'Trump NATO'),
      ('Dogshow', 'Dog Show'),
      ('Dwts', 'Dancing with the Stars'),
      ('Ecb', 'ECB'),
      ('Fedgov', 'Fed Governor'),
      ('Fink', 'Larry Fink'),
      ('Foxnews', 'Fox News'),
      ('Franklin', 'James Franklin'),
      ('Frey', 'Jacob Frey'),
      ('Ftn', 'Face the Nation'),
      ('Gameday', 'GameDay'),
      ('Glaser', 'Nikki Glaser'),
      ('Governor', 'Governor'),
      ('Griffin', 'Ken Griffin'),
      ('Hart', 'Kevin Hart'),
      ('Hegseth', 'Pete Hegseth'),
      ('Homan', 'Tom Homan'),
      ('Infantino', 'Gianni Infantino'),
      ('Johnson', 'Mike Johnson'),
      ('Jpow', 'Jerome Powell'),
      ('Kamala', 'Kamala Harris'),
      ('Kardashian', 'Kim Kardashian'),
      ('Kimmel', 'Jimmy Kimmel'),
      ('King', 'King Charles III'),
      ('Kirk', 'Charlie Kirk'),
      ('Lammy', 'David Lammy'),
      ('Lastword', 'The Last Word'),
      ('Latenight', 'Late Night'),
      ('Leavittsmf', 'Karoline Leavitt'),
      ('Lebron', 'LeBron James'),
      ('Lutnickftn', 'Howard Lutnick'),
      ('Maddow', 'Rachel Maddow'),
      ('Maher', 'Bill Maher'),
      ('Mamdani', 'Mamdani'),
      ('Melania', 'Melania Trump'),
      ('Minaj', 'Nicki Minaj'),
      ('Miran', 'Stephen Miran'),
      ('Karp', 'Alex Karp'),
      ('Reeves', 'Keanu Reeves'),
      ('Lopez', 'Jennifer Lopez'),
      ('Wales', 'Jimmy Wales'),
      ('Green', 'Josh Green'),
      ('Schumer', 'Chuck Schumer'),
      ('Bell', 'Kristen Bell')
    ) AS t(old_name, new_name)
  LOOP
    -- Check if old subject exists
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE name = mapping.old_name) THEN
      CONTINUE;
    END IF;
    
    -- Get or create correct subject
    SELECT id INTO correct_subject_id FROM subjects WHERE name = mapping.new_name;
    IF correct_subject_id IS NULL AND mapping.old_name != mapping.new_name THEN
      INSERT INTO subjects (name) VALUES (mapping.new_name) RETURNING id INTO correct_subject_id;
    ELSIF mapping.old_name = mapping.new_name THEN
      CONTINUE;
    END IF;
    
    -- Reassign events
    UPDATE mention_events SET subject_id = correct_subject_id WHERE subject_id = (SELECT id FROM subjects WHERE name = mapping.old_name);
    
    -- Delete old subject if no events remain
    DELETE FROM subjects WHERE name = mapping.old_name AND id NOT IN (SELECT DISTINCT subject_id FROM mention_events);
  END LOOP;
  
  -- Merge duplicates: merge "Jpow" Powell events into existing Jerome Powell
  -- Merge "Kamala" into "Kamala Harris"
  -- Merge "Leavittsmf" and "Lutnickftn" into their proper subjects
  -- These are handled by the loop above
  
  -- Final cleanup: remove orphaned subjects
  DELETE FROM subjects WHERE id NOT IN (SELECT DISTINCT subject_id FROM mention_events);
END;
$$;
