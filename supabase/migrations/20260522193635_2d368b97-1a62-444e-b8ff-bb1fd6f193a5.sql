
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_property(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.client_can_see_property(uuid, uuid) TO authenticated, anon;
