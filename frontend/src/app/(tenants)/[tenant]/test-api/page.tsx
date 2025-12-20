'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiUrl, getHeaders, getTenantSlug } from '@/config/api'

export default function TestApiPage() {
    const params = useParams()
    const tenant = params.tenant as string
    const detectedSlug = getTenantSlug()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [headersUsed, setHeadersUsed] = useState<any>(null)

    const testFetch = async () => {
        setLoading(true)
        setError(null)
        const headers = getHeaders()
        setHeadersUsed(headers)

        try {
            const response = await fetch(apiUrl('api/accounts'), {
                headers: headers
            })
            const result = await response.json()
            setData(result)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">Tenant API Test</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-100 rounded">
                    <p className="font-semibold">URL Param Tenant:</p>
                    <code className="text-blue-600">{tenant}</code>
                </div>
                <div className="p-4 bg-gray-100 rounded">
                    <p className="font-semibold">Detected Slug (from hostname):</p>
                    <code className="text-green-600">{detectedSlug || 'null'}</code>
                </div>
            </div>

            <div className="p-4 border rounded space-y-4">
                <button
                    onClick={testFetch}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-indigo-300"
                >
                    {loading ? 'Testing...' : 'Test API Call (fetch accounts)'}
                </button>

                {headersUsed && (
                    <div className="mt-4">
                        <p className="font-semibold">Headers Sent:</p>
                        <pre className="p-2 bg-gray-900 text-green-400 rounded text-xs overflow-auto">
                            {JSON.stringify(headersUsed, null, 2)}
                        </pre>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}

                {data && (
                    <div className="mt-4">
                        <p className="font-semibold">API Response Status:</p>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Success</span>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-40 overflow-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div className="text-sm text-gray-500">
                <p>To test this locally:</p>
                <ul className="list-disc ml-5">
                    <li>Visit <code className="bg-gray-100 px-1">http://epam.lvh.me:3000/test-api</code></li>
                    <li>Verify "Detected Slug" says <code className="bg-gray-100 px-1">epam</code></li>
                    <li>Verify Headers contains <code className="bg-gray-100 px-1">X-Tenant-Slug: epam</code></li>
                </ul>
            </div>
        </div>
    )
}
