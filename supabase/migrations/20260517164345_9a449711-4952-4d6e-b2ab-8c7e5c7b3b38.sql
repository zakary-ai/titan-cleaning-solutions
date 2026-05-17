ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS instant_client_release boolean NOT NULL DEFAULT false;