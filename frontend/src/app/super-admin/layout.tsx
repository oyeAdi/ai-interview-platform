import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify super admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_super_admin) {
        // Not a super admin - access denied
        redirect('/candidate/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505]">
            {children}
        </div>
    )
}
