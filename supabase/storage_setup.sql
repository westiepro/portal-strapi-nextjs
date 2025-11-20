-- Storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-images bucket
-- Allow public to view images
CREATE POLICY "Property images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-images');

-- Allow authenticated users (agents/admins) to upload images
CREATE POLICY "Authenticated users can upload property images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'property-images'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Users can update their own property images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'property-images'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Users can delete their own property images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'property-images'
        AND auth.role() = 'authenticated'
    );

