
-- Create a storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_logos', 'Organization Logos', true);

-- Set up security policies for the bucket
CREATE POLICY "Organization owners and admins can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organization_logos' AND
    (
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE organization_id = SPLIT_PART(name, '_', 2)::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Anyone can view organization logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'organization_logos');
