// src/components/dashboard/StatsCards.tsx
'use client'

import { useOrders } from '@/hooks/useOrders'
import { useInventory } from '@/hooks/useInventory'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { GlowingIcon } from '@/components/ui/GlowingIcon'
import { motion } from 'framer-motion'
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react'

export function StatsCards() {
  const { orders } = useOrders()
  const { inventory } = useInventory()

  const stats = {
    totalRevenue: orders?.reduce((sum, order) => sum + order.total_amount, 0) ?? 0,
    totalOrders: orders?.length ?? 0,
    totalProducts: inventory?.length ?? 0,
    lowStock: inventory?.filter(item => item.stock < 10).length ?? 0,
  }

  const cards = [
    {
      title: 'Даромади умумӣ',
      value: `${stats.totalRevenue.toLocaleString()} TJS`,
      icon: DollarSign,
      color: '#3B82F6',
      trend: '+12.5%',
    },
    {
      title: 'Фармоишҳо',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: '#10B981',
      trend: '+8.2%',
    },
    {
      title: 'Маҳсулот',
      value: stats.totalProducts,
      icon: Package,
      color: '#8B5CF6',
      trend: '+3.1%',
    },
    {
      title: 'Захираи кам',
      value: stats.lowStock,
      icon: TrendingUp,
      color: '#F43F5E',
      trend: stats.lowStock > 5 ? '+2' : '-1',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <GlassContainer glow={index === 0}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/40 mb-1">{card.title}</p>
                <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                <p className={`text-xs mt-2 ${
                  card.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {card.trend} аз моҳи гузашта
                </p>
              </div>
              <GlowingIcon icon={card.icon} color={card.color} size={24} />
            </div>
          </GlassContainer>
        </motion.div>
      ))}
    </div>
  )
}
