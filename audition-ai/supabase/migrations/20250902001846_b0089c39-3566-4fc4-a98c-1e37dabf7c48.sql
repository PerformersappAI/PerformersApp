-- Clear existing coaches and add Rick and Sasha
DELETE FROM coaches;

-- Insert Rick as the first coach
INSERT INTO coaches (name, slug, bio, highlights, email, photo_url, active) 
VALUES (
  'Rick',
  'rick',
  'Professional voice coach and studio expert with years of experience helping actors develop their vocal skills and studio presence.',
  ARRAY['Voice Over Coaching', 'Studio Recording', 'Performance Direction'],
  'rick@myauditionai.com',
  '/coaches/rick.png',
  true
);

-- Insert Sasha Knopf as the second coach  
INSERT INTO coaches (name, slug, bio, highlights, email, photo_url, active)
VALUES (
  'Sasha Knopf',
  'sasha-knopf', 
  'Through KNOPFoto, Knopf offers both headshot photography and acting coaching. She works with actors at all levels to help them find their voice, sharpen their craft, and secure roles. Her experience as an actor allows her to guide others who are in front of the camera, chasing their dreams. Knopf''s diverse background informs her coaching style: She is a graduate of NYU''s Tisch School of the Arts and the Circle in the Square conservatory program. She has worked alongside renowned actors like Danny DeVito, Christian Slater, and Gwyneth Paltrow. She won multiple "Best Actress" awards for her performance in the indie comedy Expiration Date. Knopf was a member of the stand-up troupe The Convicts of Comedy, which sharpened her timing and improvisational skills. For over a decade, she has managed her photography and coaching business, KNOPFoto.',
  ARRAY['Acting Coaching', 'Headshot Photography', 'NYU Tisch Graduate', 'Award-Winning Actress', 'Stand-up Comedy'],
  'sasha@knopfoto.com',
  '/coaches/sasha-knopf.png',
  true
);