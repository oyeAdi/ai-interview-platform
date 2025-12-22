-- Migration: Admin Access Requests
-- Description: Create a table to store requests from users to become super admins.

CREATE TABLE IF NOT EXISTS public.admin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit a request" 
ON public.admin_access_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only super admins can view requests" 
ON public.admin_access_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Only super admins can update requests" 
ON public.admin_access_requests FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- Audit Log Integration (Optional but good for tracking approvals)
-- We can add a trigger later if needed.
