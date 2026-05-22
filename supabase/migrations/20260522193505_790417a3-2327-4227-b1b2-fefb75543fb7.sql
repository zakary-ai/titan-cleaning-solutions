
-- Fix 1: Prevent privilege escalation via profiles.organization_name
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND organization_name IS NOT DISTINCT FROM (
    SELECT organization_name FROM public.profiles WHERE id = auth.uid()
  )
);

-- Fix 2: Allow users to delete their own issue_reads records
CREATE POLICY "Users delete own issue reads"
ON public.issue_reads
FOR DELETE
USING (auth.uid() = user_id);
