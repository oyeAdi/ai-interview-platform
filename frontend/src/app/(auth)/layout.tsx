
import Header from '@/components/Header'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col transition-colors duration-200">
            <Header showVisionSwitcher={false} showQuickStart={false} />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>
            <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600">
                &copy; {new Date().getFullYear()} SwarmHire AI. Secure Multi-Tenant Identity.
            </footer>
        </div>
    )
}
