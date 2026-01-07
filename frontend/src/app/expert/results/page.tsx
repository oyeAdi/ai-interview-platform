'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ResultsHistory from '@/components/ResultsHistory'

export default function ExpertResultsPage() {  // Changed from AdminResultsPage to ExpertResultsPage
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50 flex flex-col">
            <Header showBackToDashboard={true} />

            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Interview <span className="text-brand-primary">Intelligence</span>
                    </h1>
                    <p className="text-gray-500 mt-4 font-medium">
                        Review past interviews, generate AI feedback, and manage approvals.
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm min-h-[600px]">
                    <ResultsHistory />
                </div>
            </main>

            <Footer />
        </div>
    )
}
