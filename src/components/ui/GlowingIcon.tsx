// src/components/ui/GlowingIcon.tsx
'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface GlowingIconProps {
  icon: LucideIcon
  color?: string
  size?: number
  className?: string
}

export function GlowingIcon({ icon: Icon, color = '#3b82f6', size = 20, className = '' }: GlowingIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: color, opacity: 0.5 }}
      />
      <Icon size={size} style={{ color }} />
    </motion.div>
  )
}
