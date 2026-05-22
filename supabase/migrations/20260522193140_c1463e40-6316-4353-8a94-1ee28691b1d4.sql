
-- 1. Consolidate messages SELECT policy to explicitly include admins
DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
CREATE POLICY "Participants view messages"
ON public.messages
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM issues i
    WHERE i.id = messages.issue_id
      AND (
        i.client_user_id = auth.uid()
        OR (has_role(auth.uid(), 'supervisor'::app_role) AND is_assigned_to_property(auth.uid(), i.property_id))
      )
  )
);

-- 2. Storage: enforce ownership on UPDATE/DELETE in cleaning-media bucket
-- Files are uploaded under "{property_id}/..." paths by supervisors assigned
-- to that property, or by admins. Restrict UPDATE/DELETE accordingly.
DROP POLICY IF EXISTS "Admins manage cleaning-media" ON storage.objects;
CREATE POLICY "Admins manage cleaning-media"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'cleaning-media' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'cleaning-media' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Supervisors update own property cleaning-media" ON storage.objects;
CREATE POLICY "Supervisors update own property cleaning-media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cleaning-media'
  AND has_role(auth.uid(), 'supervisor'::app_role)
  AND is_assigned_to_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'cleaning-media'
  AND has_role(auth.uid(), 'supervisor'::app_role)
  AND is_assigned_to_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Supervisors delete own property cleaning-media" ON storage.objects;
CREATE POLICY "Supervisors delete own property cleaning-media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cleaning-media'
  AND has_role(auth.uid(), 'supervisor'::app_role)
  AND is_assigned_to_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 3. Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles.
-- They are still callable from within RLS policies / triggers (which run as
-- the table owner) but can no longer be invoked via PostgREST RPC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_assigned_to_property(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.client_can_see_property(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
