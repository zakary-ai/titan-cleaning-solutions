
CREATE TABLE public.special_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  supervisor_id uuid,
  caption text NOT NULL,
  file_url text NOT NULL,
  file_type upload_file_type NOT NULL,
  project_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX special_projects_property_date_idx
  ON public.special_projects (property_id, project_date DESC);

ALTER TABLE public.special_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage special projects"
  ON public.special_projects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors insert special projects"
  ON public.special_projects FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_assigned_to_property(auth.uid(), property_id)
    AND supervisor_id = auth.uid()
  );

CREATE POLICY "Supervisors view assigned special projects"
  ON public.special_projects FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_assigned_to_property(auth.uid(), property_id)
  );

CREATE POLICY "Supervisors delete own special projects"
  ON public.special_projects FOR DELETE
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND supervisor_id = auth.uid()
  );

CREATE POLICY "Clients view their special projects"
  ON public.special_projects FOR SELECT
  USING (
    has_role(auth.uid(), 'client'::app_role)
    AND client_can_see_property(auth.uid(), property_id)
  );

ALTER TABLE public.issues
  ADD COLUMN special_project_id uuid REFERENCES public.special_projects(id) ON DELETE CASCADE;
