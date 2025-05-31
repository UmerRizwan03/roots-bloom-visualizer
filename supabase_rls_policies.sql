-- SQL for Supabase RLS Policies

-- Important Notes for the User Applying These Policies:
-- *   Replace 'YOUR_ADMIN_EMAIL_HERE' with the actual email address stored in your VITE_ADMIN_EMAIL environment variable.
--     This email must exactly match what Supabase sees as the authenticated user's email.
-- *   These policies assume you have tables named `family_members` and `magazines`.
-- *   Enable RLS on these tables in your Supabase dashboard first before applying policies.
-- *   For storage, policies are typically set through the Supabase dashboard UI for the specific bucket.
--     The SQL below for storage.objects is more advanced and provides granular control if needed.

-- -----------------------------------------------------------------------------
-- Table: family_members
-- -----------------------------------------------------------------------------

-- Reminder: Enable RLS for the table in Supabase Dashboard first.
-- Example: ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all family members
DROP POLICY IF EXISTS "Allow public read access" ON public.family_members;
CREATE POLICY "Allow public read access"
ON public.family_members
FOR SELECT
USING (true);

-- Policy: Allow admin users to insert new family members
DROP POLICY IF EXISTS "Allow admin insert" ON public.family_members;
CREATE POLICY "Allow admin insert"
ON public.family_members
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');

-- Policy: Allow admin users to update existing family members
DROP POLICY IF EXISTS "Allow admin update" ON public.family_members;
CREATE POLICY "Allow admin update"
ON public.family_members
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE')
WITH CHECK (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');

-- Policy: Allow admin users to delete family members
DROP POLICY IF EXISTS "Allow admin delete" ON public.family_members;
CREATE POLICY "Allow admin delete"
ON public.family_members
FOR DELETE
USING (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');


-- -----------------------------------------------------------------------------
-- Table: magazines
-- -----------------------------------------------------------------------------

-- Reminder: Enable RLS for the table in Supabase Dashboard first.
-- Example: ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all magazines
DROP POLICY IF EXISTS "Allow public read access" ON public.magazines;
CREATE POLICY "Allow public read access"
ON public.magazines
FOR SELECT
USING (true);

-- Policy: Allow admin users to insert new magazines
DROP POLICY IF EXISTS "Allow admin insert" ON public.magazines;
CREATE POLICY "Allow admin insert"
ON public.magazines
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');

-- Policy: Allow admin users to update existing magazines (assuming future functionality)
DROP POLICY IF EXISTS "Allow admin update" ON public.magazines;
CREATE POLICY "Allow admin update"
ON public.magazines
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE')
WITH CHECK (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');

-- Policy: Allow admin users to delete magazines (assuming future functionality)
DROP POLICY IF EXISTS "Allow admin delete" ON public.magazines;
CREATE POLICY "Allow admin delete"
ON public.magazines
FOR DELETE
USING (auth.role() = 'authenticated' AND auth.email() = 'YOUR_ADMIN_EMAIL_HERE');

-- -----------------------------------------------------------------------------
-- Storage Bucket: emagazines (e.g., for PDF files)
-- RLS for storage.objects table
-- -----------------------------------------------------------------------------

-- Reminder: For Supabase Storage, many policies (like public read) are managed via the UI.
-- The policies below for `storage.objects` grant fine-grained programmatic control.
-- Ensure the bucket 'emagazines' exists.

-- Policy: Allow public read access to files in 'emagazines' bucket
-- This is often handled by setting the bucket to 'Public' in the UI.
-- If more specific SQL control is needed for SELECT on objects:
DROP POLICY IF EXISTS "Allow public read access for emagazines bucket" ON storage.objects;
CREATE POLICY "Allow public read access for emagazines bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'emagazines');


-- Policy: Allow admin users to upload to 'emagazines' bucket
DROP POLICY IF EXISTS "Allow admin storage insert for emagazines" ON storage.objects;
CREATE POLICY "Allow admin storage insert for emagazines"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'emagazines' AND
  auth.role() = 'authenticated' AND
  auth.email() = 'YOUR_ADMIN_EMAIL_HERE'
);

-- Policy: Allow admin users to update files in 'emagazines' bucket
DROP POLICY IF EXISTS "Allow admin storage update for emagazines" ON storage.objects;
CREATE POLICY "Allow admin storage update for emagazines"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'emagazines' AND
  auth.role() = 'authenticated' AND
  auth.email() = 'YOUR_ADMIN_EMAIL_HERE'
)
WITH CHECK ( -- Redundant for USING only, but good practice if conditions differ
  bucket_id = 'emagazines' AND
  auth.role() = 'authenticated' AND
  auth.email() = 'YOUR_ADMIN_EMAIL_HERE'
);


-- Policy: Allow admin users to delete files from 'emagazines' bucket
DROP POLICY IF EXISTS "Allow admin storage delete for emagazines" ON storage.objects;
CREATE POLICY "Allow admin storage delete for emagazines"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'emagazines' AND
  auth.role() = 'authenticated' AND
  auth.email() = 'YOUR_ADMIN_EMAIL_HERE'
);

-- Note: The default Supabase setup for storage buckets often includes policies
-- that allow authenticated users to manage their own files (based on auth.uid() = owner).
-- The policies above are specific to making the 'emagazines' bucket manageable by a designated admin email
-- and publicly readable. Ensure these don't conflict with broader default policies if those are still desired
-- for other buckets or use cases. Review existing policies on storage.objects.
