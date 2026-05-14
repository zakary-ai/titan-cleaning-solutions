CREATE POLICY "Clients upload message attachments" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cleaning-media'
  AND has_role(auth.uid(), 'client'::app_role)
  AND client_can_see_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
);