'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ResultsHistory from '@/components/ResultsHistory'

export default function AdminResultsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-200">
            <Header showBackToDashboard={true} />

            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-black dark:text-white leading-tight">
                        Feedback
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Review past interviews, generate AI feedback, and manage approvals.
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg p-6 min-h-[600px]">
                    <ResultsHistory />
                </div>
            </main>

            <Footer />
        </div>
    )
}
