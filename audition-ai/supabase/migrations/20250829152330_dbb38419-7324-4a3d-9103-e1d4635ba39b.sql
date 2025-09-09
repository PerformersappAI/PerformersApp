-- Create a SECURITY DEFINER function to soft-delete scripts owned by the current user
CREATE OR REPLACE FUNCTION public.soft_delete_script(p_script_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE public.scripts
  SET deleted_at = now(),
      updated_at = now()
  WHERE id = p_script_id
    AND user_id = auth.uid();

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Restrict execute and grant to authenticated users only
REVOKE ALL ON FUNCTION public.soft_delete_script(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_script(uuid) TO authenticated;