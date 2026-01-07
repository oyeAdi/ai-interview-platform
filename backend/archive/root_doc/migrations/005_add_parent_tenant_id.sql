-- Migration: Add Hierarchical Multi-Tenancy Support
-- This allows tenants to have parent-child relationships (e.g., EPAM has Uber as a client)

-- Add parent_tenant_id column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Create index for performance on parent lookups
CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id ON tenants(parent_tenant_id);

-- Add comment for documentation
COMMENT ON COLUMN tenants.parent_tenant_id IS 'References the parent tenant. NULL for top-level organizations (EPAM, Google). Set for client accounts.';
