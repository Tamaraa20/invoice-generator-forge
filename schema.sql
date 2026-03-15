-- Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    invoice_number TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    issue_date DATE,
    due_date DATE,
    company_name TEXT,
    company_email TEXT,
    company_phone TEXT,
    company_address TEXT,
    client_name TEXT,
    client_company TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    subtotal NUMERIC(10, 2),
    tax_rate NUMERIC(5, 2),
    tax_amount NUMERIC(10, 2),
    discount_rate NUMERIC(5, 2),
    discount_amount NUMERIC(10, 2),
    total NUMERIC(10, 2),
    notes TEXT,
    terms TEXT,
    logo_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT,
    quantity NUMERIC(10, 2),
    price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Invoices
CREATE POLICY "Users can insert their own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Invoice Items
CREATE POLICY "Users can insert items for their own invoices" ON public.invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE id = invoice_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view items for their own invoices" ON public.invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE id = invoice_id AND user_id = auth.uid()
        )
    );

-- Storage Buckets Configuration
-- NOTE: If you get errors running these, you can create the buckets 'logos' and 'invoices' manually in the Supabase Dashboard.

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public logos are viewable by everyone" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own invoices storage" ON storage.objects
    FOR ALL USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
