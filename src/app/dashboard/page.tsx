// src/app/dashboard/page.tsx
'use client'

import { StatsCards } from '@/components/dashboard/StatsCards'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Санҷиши токен дар headers
    const token = localStorage.getItem('admin_token')
    if (!token || token !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      router.push('/login')
    } else {
      setIsAuthorized(true)
    }
  }, [router])

  if (!isAuthorized) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Бозорча
            </h1>
            <p className="text-white/40 mt-1">Панели идоракунӣ</p>
          </div>
          
          <div className
