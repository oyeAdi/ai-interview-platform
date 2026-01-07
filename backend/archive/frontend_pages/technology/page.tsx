'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TechnologyRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/how-it-works')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Redirecting to How It Works...</p>
        </div>
    )
}
