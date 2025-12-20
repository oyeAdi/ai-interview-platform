'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Organization {
    id: string
    name: string
    slug: string
    domain: string | null
    logo_url: string | null
    subscription_tier: string
    is_active: boolean
    created_at: string
}

export default function AdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newOrg, setNewOrg] = useState({ name: '', slug: '', domain: '' })

    const supabase = createClient()

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/organizations', {
                headers: {
                    'X-User-ID': (await supabase.auth.getUser()).data.user?.id || ''
                }
            })
            const data = await response.json()
            setOrganizations(data.organizations || [])
        } catch (error) {
            console.error('Failed to fetch organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrg = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': (await supabase.auth.getUser()).data.user?.id || ''
                },
                body: JSON.stringify(newOrg)
            })

            if (response.ok) {
                setShowCreateModal(false)
                setNewOrg({ name: '', slug: '', domain: '' })
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to create organization:', error)
        }
    }

    const handleDeleteOrg = async (orgId: string) => {
        if (!confirm('Are you sure you want to delete this organization?')) return

        try {
            const response = await fetch(`http://localhost:8000/api/admin/organizations/${orgId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-ID': (await supabase.auth.getUser()).data.user?.id || ''
                }
            })

            if (response.ok) {
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to delete organization:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Organization Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage B2B organizations and tenant relationships
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        + Create Organization
                    </button>
                </div>

                {/* Organizations Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Slug
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Domain
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Tier
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                        {org.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {org.slug}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {org.domain || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                                            {org.subscription_tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${org.is_active
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                            }`}>
                                            {org.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button
                                            onClick={() => handleDeleteOrg(org.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Create New Organization
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newOrg.name}
                                        onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Microsoft"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={newOrg.slug}
                                        onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase() })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., microsoft"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={newOrg.domain}
                                        onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., microsoft.com"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateOrg}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
