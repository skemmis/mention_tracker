
DO $$
DECLARE
  mapping RECORD;
  correct_subject_id uuid;
BEGIN
  FOR mapping IN 
    SELECT * FROM (VALUES
      ('Mrbeast', 'MrBeast'),
      ('Snl', 'Saturday Night Live'),
      ('Snf', 'Sunday Night Football'),
      ('Tnf', 'Thursday Night Football'),
      ('Psaki', 'Jen Psaki'),
      ('Wo', 'World Leaders'),
      ('Person', 'Person of the Year'),
      ('Theweeknight', 'The Weeknight'),
      ('Survivor', 'Survivor'),
      ('Politics', 'Political Event'),
      ('Sotu', 'State of the Union'),
      ('Mnf', 'Monday Night Football'),
      ('Talarico', 'James Talarico'),
      ('Nadler', 'Jerry Nadler'),
      ('Nba', 'NBA'),
      ('Oscars', 'Oscars'),
      ('Reidout', 'The ReidOut'),
      ('Sb', 'Super Bowl'),
      ('Rubio', 'Marco Rubio'),
      ('Waller', 'Christopher Waller'),
      ('Jefferson', 'Philip Jefferson'),
      ('Swalwell', 'Eric Swalwell'),
      ('Whitmer', 'Gretchen Whitmer'),
      ('Stefanik', 'Elise Stefanik'),
      ('Tonightshow', 'The Tonight Show'),
      ('View', 'The View'),
      ('Warren', 'Elizabeth Warren'),
      ('Mamdani', 'Mahmoud Mamdani'),
      ('Dillon', 'Luke Dillon')
    ) AS t(old_name, new_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE name = mapping.old_name) THEN CONTINUE; END IF;
    IF mapping.old_name = mapping.new_name THEN CONTINUE; END IF;
    
    SELECT id INTO correct_subject_id FROM subjects WHERE name = mapping.new_name;
    IF correct_subject_id IS NULL THEN
      INSERT INTO subjects (name) VALUES (mapping.new_name) RETURNING id INTO correct_subject_id;
    END IF;
    
    UPDATE mention_events SET subject_id = correct_subject_id WHERE subject_id = (SELECT id FROM subjects WHERE name = mapping.old_name);
    DELETE FROM subjects WHERE name = mapping.old_name AND id NOT IN (SELECT DISTINCT subject_id FROM mention_events);
  END LOOP;
END;
$$;
