import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { tenant: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify membership using the new RBAC system
    const { data: membership } = await supabase
        .from('user_tenant_roles')
        .select(`
            role,
            organizations!inner (
                slug
            )
        `)
        .eq('user_id', user.id)
        .eq('organizations.slug', params.tenant)
        .single()

    // If not a member, check if they are a super admin
    if (!membership) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_super_admin) {
            // Not a member and not a super admin - access denied
            redirect('/candidate/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505]">
            {/* You could add a tenant-specific sidebar or header here */}
            <main>{children}</main>
        </div>
    )
}
