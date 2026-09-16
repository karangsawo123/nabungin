'use client'

import * as React from 'react'
import { Tags, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { CategoryCard } from '@/components/categories/category-card'
import { CreateCategoryDialog } from '@/components/categories/create-category-dialog'
import { EditCategoryDialog } from '@/components/categories/edit-category-dialog'
import { useWorkspace } from '@/components/groups/workspace-context'
import { getCategoriesByWorkspace } from '@/actions/categories'
import type { Category } from '@/types/database'

export interface CategoryListProps {
  initialCategories?: Category[]
  initialWorkspaceId?: string
}

export function CategoryList({
  initialCategories = [],
  initialWorkspaceId,
}: CategoryListProps) {
  const { activeGroupId, activeGroup, isOwner } = useWorkspace()

  const [prevWorkspaceId, setPrevWorkspaceId] = React.useState(activeGroupId)
  const [categories, setCategories] = React.useState<Category[]>(() => {
    return initialWorkspaceId === activeGroupId ? initialCategories : []
  })
  const [isLoading, setIsLoading] = React.useState(
    !initialWorkspaceId || initialWorkspaceId !== activeGroupId
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  // React state adjustment saat activeGroupId berubah
  if (prevWorkspaceId !== activeGroupId) {
    setPrevWorkspaceId(activeGroupId)
    if (activeGroupId === initialWorkspaceId) {
      setCategories(initialCategories)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setCategories([])
    }
    setError(null)
  }

  React.useEffect(() => {
    let isCancelled = false
    if (!activeGroupId) return

    if (activeGroupId === initialWorkspaceId && initialCategories.length > 0 && refreshTrigger === 0) {
      return
    }

    getCategoriesByWorkspace(activeGroupId)
      .then((data) => {
        if (!isCancelled) {
          setCategories(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Gagal memuat kategori pos tabungan. Silakan coba lagi.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeGroupId, initialWorkspaceId, initialCategories.length, refreshTrigger])

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat])
  }

  const handleCategoryUpdated = (updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Pos Alokasi
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">
              {categories.length} Kategori Terdaftar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Kategori Pos {activeGroup?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kategori ini digunakan untuk mengelompokkan setiap transaksi setoran dan penarikan.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Tambah Kategori Pos</span>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Gagal Memuat Kategori"
          message={error}
          onRetry={() => setRefreshTrigger((c) => c + 1)}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4 flex items-center gap-3"
            >
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && categories.length === 0 && (
        <EmptyState
          icon={Tags}
          title="Belum Ada Kategori Pos"
          description={`Ruang tabungan "${activeGroup?.name || 'ini'}" belum memiliki kategori pos transaksi. Tambahkan kategori untuk memudahkan pelacakan.`}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[44px]"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Tambah Kategori Pertama
            </Button>
          }
        />
      )}

      {/* Categories Grid */}
      {!isLoading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isOwner={isOwner}
              onEdit={(c) => setEditingCategory(c)}
            />
          ))}
        </div>
      )}

      {/* Dialog Buat Kategori */}
      <CreateCategoryDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCategoryCreated}
      />

      {/* Dialog Edit Kategori */}
      {editingCategory && (
        <EditCategoryDialog
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          onSuccess={handleCategoryUpdated}
        />
      )}
    </div>
  )
}
