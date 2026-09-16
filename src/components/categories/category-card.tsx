'use client'

import * as React from 'react'
import { Edit3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getCategoryIcon } from '@/components/categories/category-icons'
import type { Category } from '@/types/database'

export interface CategoryCardProps {
  category: Category
  isOwner?: boolean
  onEdit?: (category: Category) => void
}

export function CategoryCard({
  category,
  isOwner = false,
  onEdit,
}: CategoryCardProps) {
  const color = category.color || '#3B82F6'

  return (
    <Card className="transition-all duration-200 hover:border-[#2A3650] hover:bg-[#121828]">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform hover:scale-105"
            style={{
              borderColor: `${color}35`,
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {React.createElement(getCategoryIcon(category.icon), {
              className: 'h-5 w-5',
            })}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {category.name}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pos Alokasi Transaksi
            </p>
          </div>
        </div>

        {isOwner && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(category)}
            title="Ubah Kategori"
            className="rounded-lg p-2 text-slate-400 hover:bg-[#161C2C] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shrink-0 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  )
}
