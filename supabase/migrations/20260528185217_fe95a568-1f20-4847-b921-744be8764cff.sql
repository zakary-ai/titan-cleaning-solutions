CREATE OR REPLACE FUNCTION public.prevent_org_name_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.organization_name IS DISTINCT FROM OLD.organization_name
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change organization_name';
  END IF;

  RETURN NEW;
END;
$$;