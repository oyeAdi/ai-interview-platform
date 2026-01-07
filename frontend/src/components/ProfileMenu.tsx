'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import EditProfileModal from './EditProfileModal'

interface ProfileMenuProps {
    user: any
    userProfile: any

}

export default function ProfileMenu({ user, userProfile }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentProfile, setCurrentProfile] = useState(userProfile)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setCurrentProfile(userProfile)
    }, [userProfile])

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const refreshProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (data) {
            setCurrentProfile(data)
        }
    }

    // Fallback initials
    const initials = currentProfile?.full_name
        ? currentProfile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.[0].toUpperCase() || '?'

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group outline-none"
            >
                <div className="w-9 h-9 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                    {currentProfile?.avatar_url ? (
                        <img
                            src={currentProfile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-bold text-brand-primary">
                            {initials}
                        </span>
                    )}
                </div>

                {/* Mobile: Hidden, Desktop: Show name */}
                <div className="hidden lg:flex flex-col items-start">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {currentProfile?.full_name || 'User'}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {currentProfile?.is_super_admin ? 'Super Admin' : 'User'}
                    </span>
                </div>

                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1A1A1A] bg-gray-50 dark:bg-[#111111]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {currentProfile?.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                        </p>

                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                setIsEditModalOpen(true)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Edit Profile
                        </button>
                        {currentProfile?.is_super_admin && (
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push('/super-admin')
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg transition-colors"
                            >
                                <Shield className="w-4 h-4" />
                                Super Admin
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                userProfile={currentProfile}
                onProfileUpdate={refreshProfile}
            />
        </div>
    )
}
