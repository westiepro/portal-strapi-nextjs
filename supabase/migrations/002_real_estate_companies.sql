-- Real Estate Companies table
CREATE TABLE IF NOT EXISTS public.real_estate_companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    contact_person_name TEXT NOT NULL,
    phone_number TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to user profile if created
    properties_count INTEGER DEFAULT 0, -- Denormalized count for quick display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_real_estate_companies_email ON public.real_estate_companies(email);
CREATE INDEX IF NOT EXISTS idx_real_estate_companies_company_name ON public.real_estate_companies(company_name);

-- RLS Policies (if needed)
ALTER TABLE public.real_estate_companies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all companies
CREATE POLICY "Admins can read all real estate companies"
    ON public.real_estate_companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to insert companies
CREATE POLICY "Admins can insert real estate companies"
    ON public.real_estate_companies
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to update companies
CREATE POLICY "Admins can update real estate companies"
    ON public.real_estate_companies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to delete companies
CREATE POLICY "Admins can delete real estate companies"
    ON public.real_estate_companies
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE TRIGGER update_real_estate_companies_updated_at
    BEFORE UPDATE ON public.real_estate_companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

