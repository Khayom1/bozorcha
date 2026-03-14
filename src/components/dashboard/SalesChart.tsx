// src/components/dashboard/SalesChart.tsx
'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { useOrders } from '@/hooks/useOrders'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Download } from 'lucide-react'
import { GlowingIcon } from '@/components/ui/GlowingIcon'

type Period = 'day' | 'week' | 'month' | 'year'

export function SalesChart() {
  const { orders } = useOrders()
  const [period, setPeriod] = useState<Period>('week')

  const chartData = useMemo(() => {
    if (!orders) return []

    const now = new Date()
    const data: { name: string; revenue: number; previous: number }[] = []

    // Логикаи гурӯҳбандии фурӯш аз рӯи давра
    if (period === 'day') {
      // Соатҳои рӯз (0-23)
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00'
        const revenue = orders
          .filter(o => {
            const date = new Date(o.created_at)
            return date.getDate() === now.getDate() && date.getHours() === i
          })
          .reduce((sum, o) => sum + o.total_amount, 0)
        
        const previousRevenue = orders
          .filter(o => {
            const date = new Date(o.created_at)
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            return date.getDate() === yesterday.getDate() && date.getHours() === i
          })
          .reduce((sum, o) => sum + o.total_amount, 0)

        data.push({ name: hour, revenue, previous: previousRevenue })
      }
    } else if (period === 'week') {
      // Рӯзҳои ҳафта
      const days = ['Якш', 'Душ', 'Сеш', 'Чор', 'Пан', 'Ҷум', 'Шан']
      for (let i = 0; i < 7; i++) {
        const day = days[i]
        const revenue = orders
          .filter(o => {
            const date = new Date(o.created_at)
            return date.getDay() === i
          })
          .reduce((sum, o) => sum + o.total_amount, 0)
        
        const previousRevenue = orders
          .filter(o => {
            const date = new Date(o.created_at)
            const lastWeek = new Date(now)
            lastWeek.setDate(lastWeek.getDate() - 7)
            return date.getDay() === i && date.getDate() <= lastWeek.getDate()
          })
          .reduce((sum, o) => sum + o.total_amount, 0)

        data.push({ name: day, revenue, previous: previousRevenue })
      }
    }
    // Аналогично барои month ва year

    return data
  }, [orders, period])

  return (
    <GlassContainer className="col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Таҳлили фурӯш</h2>
          <p className="text-sm text-white/40">Муқоиса бо давраи гузашта</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex glass rounded-lg p-1">
            {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`
                  px-3 py-1.5 text-sm rounded-md transition-all
                  ${period === p 
                    ? 'bg-primary text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {p === 'day' ? 'Рӯз' : p === 'week' ? 'Ҳафта' : p === 'month' ? 'Моҳ' : 'Сол'}
              </button>
            ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass p-2 rounded-lg"
          >
            <GlowingIcon icon={Download} size={18} />
          </motion.button>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B7280" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6B7280" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickFormatter={(value) => `${value} TJS`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(16px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              formatter={(value: number) => [`${value.toLocaleString()} TJS`, 'Фурӯш']}
            />
            
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#6B7280"
              strokeWidth={2}
              fill="url(#previousGradient)"
              name="Давраи гузашта"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              filter="url(#glow)"
              name="Фурӯши ҷорӣ"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassContainer>
  )
}
