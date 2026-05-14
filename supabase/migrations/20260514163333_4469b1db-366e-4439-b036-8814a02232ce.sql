
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'client');
CREATE TYPE public.upload_status AS ENUM ('uploaded', 'missing', 'reviewed');
CREATE TYPE public.upload_file_type AS ENUM ('image', 'video');
CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  organization_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table — security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  client_organization TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property areas
CREATE TABLE public.property_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  required_upload BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property assignments (supervisors and clients to properties)
CREATE TABLE public.property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_on_property public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id, role_on_property)
);

-- Cleaning uploads
CREATE TABLE public.cleaning_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.property_areas(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  file_url TEXT,
  file_type public.upload_file_type,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.upload_status NOT NULL DEFAULT 'uploaded'
);
CREATE INDEX idx_uploads_property_date ON public.cleaning_uploads(property_id, service_date DESC);
CREATE INDEX idx_uploads_area_date ON public.cleaning_uploads(area_id, service_date DESC);

-- Issues
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.property_areas(id) ON DELETE SET NULL,
  upload_id UUID REFERENCES public.cleaning_uploads(id) ON DELETE SET NULL,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  initial_comment TEXT,
  status public.issue_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_issues_property ON public.issues(property_id, created_at DESC);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_issue ON public.messages(issue_id, created_at);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_property(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_assignments
    WHERE user_id = _user_id AND property_id = _property_id
  )
$$;

CREATE OR REPLACE FUNCTION public.client_can_see_property(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_assignments pa
    WHERE pa.property_id = _property_id AND pa.user_id = _user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.profiles pr ON pr.id = _user_id
    WHERE p.id = _property_id
      AND p.client_organization IS NOT NULL
      AND pr.organization_name IS NOT NULL
      AND p.client_organization = pr.organization_name
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'organization_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RLS POLICIES ==========

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- properties
CREATE POLICY "Admins manage properties" ON public.properties
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors view assigned properties" ON public.properties
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), id)
  );
CREATE POLICY "Clients view their properties" ON public.properties
  FOR SELECT USING (
    public.has_role(auth.uid(), 'client')
    AND public.client_can_see_property(auth.uid(), id)
  );

-- property_areas
CREATE POLICY "Admins manage areas" ON public.property_areas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors view assigned areas" ON public.property_areas
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), property_id)
  );
CREATE POLICY "Clients view their areas" ON public.property_areas
  FOR SELECT USING (
    public.has_role(auth.uid(), 'client')
    AND public.client_can_see_property(auth.uid(), property_id)
  );

-- property_assignments
CREATE POLICY "Admins manage assignments" ON public.property_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own assignments" ON public.property_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- cleaning_uploads
CREATE POLICY "Admins manage uploads" ON public.cleaning_uploads
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors view assigned uploads" ON public.cleaning_uploads
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), property_id)
  );
CREATE POLICY "Supervisors insert uploads" ON public.cleaning_uploads
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), property_id)
    AND supervisor_id = auth.uid()
  );
CREATE POLICY "Supervisors update own uploads" ON public.cleaning_uploads
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'supervisor')
    AND supervisor_id = auth.uid()
  );
CREATE POLICY "Clients view their uploads" ON public.cleaning_uploads
  FOR SELECT USING (
    public.has_role(auth.uid(), 'client')
    AND public.client_can_see_property(auth.uid(), property_id)
  );

-- issues
CREATE POLICY "Admins manage issues" ON public.issues
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors view assigned issues" ON public.issues
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), property_id)
  );
CREATE POLICY "Supervisors update assigned issues" ON public.issues
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), property_id)
  );
CREATE POLICY "Clients view their issues" ON public.issues
  FOR SELECT USING (
    public.has_role(auth.uid(), 'client')
    AND public.client_can_see_property(auth.uid(), property_id)
  );
CREATE POLICY "Clients create issues" ON public.issues
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'client')
    AND client_user_id = auth.uid()
    AND public.client_can_see_property(auth.uid(), property_id)
  );

-- messages
CREATE POLICY "Admins manage messages" ON public.messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (
        i.client_user_id = auth.uid()
        OR (public.has_role(auth.uid(), 'supervisor') AND public.is_assigned_to_property(auth.uid(), i.property_id))
      )
    )
  );
CREATE POLICY "Participants insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (
        i.client_user_id = auth.uid()
        OR (public.has_role(auth.uid(), 'supervisor') AND public.is_assigned_to_property(auth.uid(), i.property_id))
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cleaning-media',
  'cleaning-media',
  false,
  524288000, -- 500MB
  ARRAY['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm']
);

-- Storage policies — paths use {property_id}/{...}
CREATE POLICY "Admins all access cleaning-media" ON storage.objects
  FOR ALL USING (bucket_id = 'cleaning-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'cleaning-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors upload to assigned properties" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cleaning-media'
    AND public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Supervisors read assigned cleaning-media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cleaning-media'
    AND public.has_role(auth.uid(), 'supervisor')
    AND public.is_assigned_to_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Clients read their cleaning-media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cleaning-media'
    AND public.has_role(auth.uid(), 'client')
    AND public.client_can_see_property(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
