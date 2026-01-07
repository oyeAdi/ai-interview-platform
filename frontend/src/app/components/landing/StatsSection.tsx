'use client'

import { useEffect, useState } from 'react'

interface Stat {
    value: string
    label: string
    icon: string
}

const stats: Stat[] = [
    { value: '10K+', label: 'Interviews Conducted', icon: '📊' },
    { value: '500+', label: 'Active Users', icon: '👥' },
    { value: '50+', label: 'Companies', icon: '🏢' },
    { value: '95%', label: 'Success Rate', icon: '✨' },
]

export default function StatsSection() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 }
        )

        const element = document.getElementById('stats-section')
        if (element) {
            observer.observe(element)
        }

        return () => {
            if (element) {
                observer.unobserve(element)
            }
        }
    }, [])

    return (
        <section id="stats-section" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:scale-105 ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                transitionDuration: '500ms',
                            }}
                        >
                            <div className="text-4xl mb-3">{stat.icon}</div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

