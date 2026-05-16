ALTER TABLE public.properties
ADD COLUMN daily_report_time time NOT NULL DEFAULT '08:00:00',
ADD COLUMN daily_report_timezone text NOT NULL DEFAULT 'America/New_York';