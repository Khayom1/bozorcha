// src/components/ui/GlassContainer.tsx
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassContainerProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function GlassContainer({ children, className = '', glow = false }: GlassContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        glass-card p-6
        ${glow ? 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
