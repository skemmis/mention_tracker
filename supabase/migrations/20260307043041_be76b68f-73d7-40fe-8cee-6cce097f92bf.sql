
-- Fix subject assignments based on series_ticker
-- First, create a temp function to get the correct subject name from ticker
CREATE OR REPLACE FUNCTION pg_temp.ticker_to_name(ticker text) RETURNS text AS $$
DECLARE
  key text;
  name_map jsonb := '{
    "TRUMP": "Donald Trump",
    "BIDEN": "Joe Biden",
    "HOCHUL": "Kathy Hochul",
    "JENSEN": "Jensen Huang",
    "SECPRESS": "White House Press Secretary",
    "MABORO": "Marco Rubio",
    "PELOSI": "Nancy Pelosi",
    "DESANTIS": "Ron DeSantis",
    "NEWSOM": "Gavin Newsom",
    "HARRISP": "Kamala Harris",
    "ZELENS": "Volodymyr Zelenskyy",
    "ELON": "Elon Musk",
    "STARMER": "Keir Starmer",
    "PROBST": "Jeff Probst",
    "ROG": "Joe Rogan",
    "KLOBUCHAR": "Amy Klobuchar",
    "SCHIFF": "Adam Schiff",
    "HUBERMAN": "Andrew Huberman",
    "ZUCK": "Mark Zuckerberg",
    "VANCE": "JD Vance",
    "WALZ": "Tim Walz",
    "AOC": "Alexandria Ocasio-Cortez",
    "CRUZ": "Ted Cruz",
    "GAETZ": "Matt Gaetz",
    "HALEY": "Nikki Haley",
    "SCOTT": "Tim Scott",
    "VIVEK": "Vivek Ramaswamy",
    "SHAPIRO": "Ben Shapiro",
    "ROGAN": "Joe Rogan",
    "BERNIE": "Bernie Sanders",
    "RASKIN": "Jamie Raskin",
    "LEAVITT": "Karoline Leavitt",
    "WHITMER": "Gretchen Whitmer",
    "COMER": "James Comer",
    "BETO": "Beto O''Rourke",
    "POWELL": "Jerome Powell",
    "DIMON": "Jamie Dimon",
    "ZAKARIA": "Fareed Zakaria",
    "COOPER": "Anderson Cooper",
    "BONGINO": "Dan Bongino",
    "LUTNICK": "Howard Lutnick",
    "CONAN": "Conan O''Brien",
    "LAGARDE": "Christine Lagarde",
    "ACKMAN": "Bill Ackman",
    "ARMSTRONG": "Brian Armstrong",
    "JAKEPAUL": "Jake Paul"
  }'::jsonb;
BEGIN
  -- Extract key between KX and MENTION
  key := upper(substring(ticker from 'KX(.+?)MENTION'));
  IF key IS NULL THEN RETURN NULL; END IF;
  IF name_map ? key THEN RETURN name_map->>key; END IF;
  -- Fallback: title-case the key
  RETURN initcap(lower(key));
END;
$$ LANGUAGE plpgsql;

-- For each series_ticker, ensure the correct subject exists and reassign events
DO $$
DECLARE
  rec RECORD;
  correct_name text;
  correct_subject_id uuid;
BEGIN
  FOR rec IN 
    SELECT DISTINCT series_ticker FROM mention_events WHERE series_ticker IS NOT NULL
  LOOP
    correct_name := pg_temp.ticker_to_name(rec.series_ticker);
    IF correct_name IS NULL THEN CONTINUE; END IF;
    
    -- Get or create the correct subject
    SELECT id INTO correct_subject_id FROM subjects WHERE name = correct_name;
    IF correct_subject_id IS NULL THEN
      INSERT INTO subjects (name) VALUES (correct_name) RETURNING id INTO correct_subject_id;
    END IF;
    
    -- Reassign all events with this series_ticker
    UPDATE mention_events SET subject_id = correct_subject_id WHERE series_ticker = rec.series_ticker;
  END LOOP;
  
  -- Clean up orphaned subjects (no events pointing to them)
  DELETE FROM subjects WHERE id NOT IN (SELECT DISTINCT subject_id FROM mention_events);
END;
$$;
