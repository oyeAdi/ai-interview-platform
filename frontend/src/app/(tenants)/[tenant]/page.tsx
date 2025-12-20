'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TenantLandingPage() {
    const params = useParams()
    const tenant = params.tenant as string

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border-4 border-dashed border-indigo-500">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-6">
                <h1 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 capitalize">
                    Welcome to {tenant}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    Powered by SwarmHire Multi-Tenant Engine
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href={`/dashboard`}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Go to {tenant} Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                        Global Home
                    </Link>
                </div>
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-400 italic">
                        Note: This is an internal tenant route: /(tenants)/{tenant}
                    </p>
                </div>
            </div>
        </div>
    )
}
