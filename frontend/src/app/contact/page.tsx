'use client'

import Header from '@/components/Header'
import { Mail, Phone, MapPin, Send, MessageSquare, Twitter, Linkedin, Github } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSubmitting(false)
        setSubmitted(true)
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50 pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold mb-6 text-gray-900">
                            Get in <span className="text-brand-primary">Touch</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Have questions about the swarm? Need help scaling your hiring? We're here to help you match demand with supply.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <ContactInfoCard
                                icon={<Mail className="w-6 h-6 text-brand-primary" />}
                                title="Email Us"
                                description="Our team is here to help."
                                detail="hello@swarmhire.ai"
                            />
                            <ContactInfoCard
                                icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
                                title="Live Chat"
                                description="Mon-Fri from 9am to 6pm."
                                detail="Start a conversation"
                            />
                            <ContactInfoCard
                                icon={<MapPin className="w-6 h-6 text-blue-600" />}
                                title="Office"
                                description="Come say hello at our HQ."
                                detail="123 AI Boulevard, Silicon Valley, CA"
                            />

                            {/* Social Links */}
                            <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
                                <h3 className="text-lg font-bold mb-4 text-gray-900">Follow Us</h3>
                                <div className="flex gap-4">
                                    <SocialIcon icon={<Twitter className="w-5 h-5" />} href="#" />
                                    <SocialIcon icon={<Linkedin className="w-5 h-5" />} href="#" />
                                    <SocialIcon icon={<Github className="w-5 h-5" />} href="#" />
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="p-8 md:p-10 bg-white rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden">
                                {submitted ? (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                            ✅
                                        </div>
                                        <h2 className="text-3xl font-bold mb-2 text-gray-900">Message Sent!</h2>
                                        <p className="text-gray-600 mb-8">We'll get back to you within 24 hours.</p>
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="text-brand-primary font-bold hover:underline"
                                        >
                                            Send another message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formState.name}
                                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formState.email}
                                                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.subject}
                                                onChange={e => setFormState({ ...formState, subject: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                                placeholder="How can we help?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={formState.message}
                                                onChange={e => setFormState({ ...formState, message: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none resize-none"
                                                placeholder="Tell us more about your needs..."
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                            ) : (
                                                <>
                                                    <span>Send Message</span>
                                                    <Send className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Simple Footer */}
            <footer className="bg-gray-100 border-t border-gray-200 py-12 px-4">
                <div className="max-w-6xl mx-auto text-center text-gray-600">
                    <p>© 2024 SwarmHire. All rights reserved.</p>
                </div>
            </footer>
        </>
    )
}

function ContactInfoCard({ icon, title, description, detail }: any) {
    return (
        <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all group">
            <div className="mb-4 p-3 bg-white rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
            <p className="text-brand-primary font-semibold">{detail}</p>
        </div>
    )
}

function SocialIcon({ icon, href }: any) {
    return (
        <a
            href={href}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 text-gray-600 hover:text-brand-primary hover:border-brand-primary hover:shadow-lg transition-all"
        >
            {icon}
        </a>
    )
}
