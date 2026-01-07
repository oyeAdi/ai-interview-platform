'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'

interface Organization {
    id: string
    name: string
    slug: string
}

interface Membership {
    role: string
    organizations: Organization | Organization[]
}

export default function SelectOrgPage() {
    const [memberships, setMemberships] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchMemberships() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    role,
                    organizations (
                        id,
                        name,
                        slug
                    )
                `)
                .eq('user_id', user.id)

            if (error) {
                console.error('Error fetching memberships:', error)
            } else if (data && data.length === 1) {
                // Auto-redirect if single org
                const org = Array.isArray(data[0].organizations)
                    ? data[0].organizations[0]
                    : data[0].organizations
                router.push(`/${org.slug}/dashboard`)
            } else {
                setMemberships(data || [])
            }
            setLoading(false)
        }

        fetchMemberships()
    }, [supabase, router])

    const handleSelect = (slug: string) => {
        router.push(`/${slug}/dashboard`)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Select Organization</h1>
                    <p className="text-gray-500 dark:text-gray-400">Choose an organization to continue</p>
                </div>

                <div className="space-y-3">
                    {memberships.map((membership, index) => {
                        const org = Array.isArray(membership.organizations)
                            ? membership.organizations[0]
                            : membership.organizations

                        if (!org) return null

                        return (
                            <button
                                key={org.id}
                                onClick={() => handleSelect(org.slug)}
                                className="w-full group p-4 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl flex items-center justify-between hover:border-brand-primary dark:hover:border-brand-primary hover:shadow-md transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                                        <Building2 className="w-6 h-6 text-brand-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{org.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{membership.role}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        )
                    })}
                </div>

                <div className="text-center pt-4">
                    <button
                        onClick={() => router.push('/candidate/dashboard')}
                        className="text-sm text-gray-500 hover:text-brand-primary hover:underline transition-all"
                    >
                        Enter as Individual/Candidate instead
                    </button>
                </div>
            </div>
        </div>
    )
}
