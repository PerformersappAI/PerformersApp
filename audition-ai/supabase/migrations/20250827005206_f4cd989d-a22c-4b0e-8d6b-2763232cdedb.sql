
-- Point Rick's photo to the uploaded image in the project
update public.coaches
set photo_url = '/lovable-uploads/f90f44c2-4f9c-49fc-bb4d-d70cd8faa203.png',
    updated_at = now()
where slug = 'rick-zieff';
