// src/components/dashboard/InventoryTable.tsx
'use client'

import { useInventory } from '@/hooks/useInventory'
import { useCategories } from '@/hooks/useCategories'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { GlowingIcon } from '@/components/ui/GlowingIcon'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Edit2, ChevronDown, Package, Archive, RefreshCw } from 'lucide-react'

type Status = 'all' | 'active' | 'out_of_stock' | 'archived'

export function InventoryTable() {
  const { inventory, isLoading, updateInventory } = useInventory()
  const { data: categories } = useCategories()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<Status>('all')
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'price' | 'stock' } | null>(null)

  const filteredInventory = useMemo(() => {
    if (!inventory) return []

    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [inventory, search, selectedCategory, selectedStatus])

  const handleInlineEdit = (id: string, field: 'price' | 'stock', value: number) => {
    updateInventory({ id, [field]: value })
    setEditingCell(null)
  }

  if (isLoading) {
    return (
      <GlassContainer>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </GlassContainer>
    )
  }

  return (
    <GlassContainer className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Анбор</h2>
          <p className="text-sm text-white/40">Идоракунии маҳсулот ва захира</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
            + Маҳсулоти нав
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Ҷустуҷӯи маҳсулот..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="relative group">
          <button className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Filter size={16} />
            Категория
            <ChevronDown size={14} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 glass rounded-lg p-2 hidden group-hover:block z-10">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                selectedCategory === 'all' ? 'bg-primary text-white' : 'hover:bg-white/5'
              }`}
            >
              Ҳама
            </button>
            {categories?.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedCategory === category ? 'bg-primary text-white' : 'hover:bg-white/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'out_of_stock', 'archived'] as Status[]).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`
                px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all
                ${selectedStatus === status 
                  ? status === 'out_of_stock' 
                    ? 'bg-neon-red/20 text-neon-red border border-neon-red/30' 
                    : status === 'archived'
                    ? 'bg-white/10 text-white/60'
                    : 'bg-primary text-white'
                  : 'glass hover:bg-white/5'
                }
              `}
            >
              {status === 'active' && <Package size={14} />}
              {status === 'archived' && <Archive size={14} />}
              {status === 'all' ? 'Ҳама' : 
               status === 'active' ? 'Фаъол' : 
               status === 'out_of_stock' ? 'Кам' : 'Бойгонӣ'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-sm font-medium text-white/40">Маҳсулот</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-white/40">Категория</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-white/40">Нарх (TJS)</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-white/40">Захира</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-white/40">Статус</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package size={20} className="text-primary" />
                      </div>
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="glass px-2 py-1 rounded-md text-xs">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {editingCell?.id === item.id && editingCell.field === 'price' ? (
                    <input
                      type="number"
                      defaultValue={item.price}
                      onBlur={(e) => handleInlineEdit(item.id, 'price', Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(item.id, 'price', Number((e.target as HTMLInputElement).value))
                        }
                      }}
                      className="w-24 text-right bg-surface border border-primary/30 rounded px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onDoubleClick={() => setEditingCell({ id: item.id, field: 'price' })}
                    >
                      {item.price.toLocaleString()} TJS
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {editingCell?.id === item.id && editingCell.field === 'stock' ? (
                    <input
                      type="number"
                      defaultValue={item.stock}
                      onBlur={(e) => handleInlineEdit(item.id, 'stock', Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(item.id, 'stock', Number((e.target as HTMLInputElement).value))
                        }
                      }}
                      className="w-20 text-right bg-surface border border-primary/30 rounded px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`
                        cursor-pointer hover:text-primary transition-colors
                        ${item.stock < 10 ? 'neon-red' : 'neon-emerald'}
                      `}
                      onDoubleClick={() => setEditingCell({ id: item.id, field: 'stock' })}
                    >
                      {item.stock}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`
                    glass px-2 py-1 rounded-md text-xs
                    ${item.status === 'active' ? 'text-emerald-400' : ''}
                    ${item.status === 'out_of_stock' ? 'text-red-400' : ''}
                    ${item.status === 'archived' ? 'text-white/40' : ''}
                  `}>
                    {item.status === 'active' ? 'Фаъол' : 
                     item.status === 'out_of_stock' ? 'Кам' : 'Бойгонӣ'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GlowingIcon icon={Edit2} size={16} color="#3B82F6" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm text-white/40">
        <span>Ҳамагӣ: {filteredInventory.length} маҳсулот</span>
        <span>
          Арзиши умумӣ: {filteredInventory.reduce((sum, item) => sum + (item.price * item.stock), 0).toLocaleString()} TJS
        </span>
      </div>
    </GlassContainer>
  )
}
