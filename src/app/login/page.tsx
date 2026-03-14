// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { GlowingIcon } from '@/components/ui/GlowingIcon'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (token === process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      localStorage.setItem('admin_token', token)
      router.push('/dashboard')
    } else {
      setError('Токени нодуруст!')
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlassContainer glow>
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-primary/20 mb-4">
              <GlowingIcon icon={Lock} size={32} color="#3B82F6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Бозорча</h1>
            <p className="text-white/40 mt-1">Барои идома, токени дастрасиро ворид кунед</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Токени дастрасӣ"
                className="w-full glass rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            >
              Ворид шудан
            </button>
          </form>
        </GlassContainer>
      </motion.div>
    </div>
  )
}
