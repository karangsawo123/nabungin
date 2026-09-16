'use client'

import * as React from 'react'
import { Edit3, AlertCircle, Check } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
  getCategoryIcon,
} from '@/components/categories/category-icons'
import { updateCategoryAction } from '@/actions/categories'
import type { Category } from '@/types/database'

export interface EditCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  category: Category
  onSuccess?: (category: Category) => void
}

export function EditCategoryDialog({
  isOpen,
  onClose,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const [prevCategory, setPrevCategory] = React.useState(category)
  const [name, setName] = React.useState(category.name)
  const [selectedIcon, setSelectedIcon] = React.useState(category.icon || 'tag')
  const [selectedColor, setSelectedColor] = React.useState(category.color || '#3B82F6')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  if (prevCategory.id !== category.id || prevCategory.name !== category.name) {
    setPrevCategory(category)
    setName(category.name)
    setSelectedIcon(category.icon || 'tag')
    setSelectedColor(category.color || '#3B82F6')
    setErrorMsg(null)
  }

  const handleClose = () => {
    if (isLoading) return
    setErrorMsg(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setErrorMsg('Nama kategori pos tabungan wajib diisi.')
      return
    }

    setIsLoading(true)

    try {
      const result = await updateCategoryAction({
        categoryId: category.id,
        workspaceId: category.group_id,
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      })

      if (!result.success) {
        setErrorMsg(result.error)
        setIsLoading(false)
        return
      }

      onSuccess?.(result.category)
      handleClose()
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat memperbarui kategori.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Edit3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Edit Kategori Pos
            </span>
          </div>
          <DialogTitle>Ubah Kategori Pos Tabungan</DialogTitle>
          <DialogDescription>
            Perbarui nama pos alokasi, ikon visual, atau warna penanda.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Input Nama Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-category-name" requiredIndicator>
              Nama Kategori Pos
            </Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Pilih Ikon Visual */}
          <div className="space-y-1.5">
            <Label>Ikon Kategori</Label>
            <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 bg-[#090D16] border border-[#1C2538] rounded-xl">
              {AVAILABLE_CATEGORY_ICONS.map((item) => {
                const IconComponent = item.icon
                const isSelected = selectedIcon === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => setSelectedIcon(item.id)}
                    className={`flex h-10 w-full items-center justify-center rounded-lg transition-colors focus:outline-none ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50'
                        : 'text-slate-400 hover:bg-[#161C2C] hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pilih Warna Semantik */}
          <div className="space-y-1.5">
            <Label>Warna Aksen</Label>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_CATEGORY_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex
                return (
                  <button
                    key={col.hex}
                    type="button"
                    title={col.name}
                    onClick={() => setSelectedColor(col.hex)}
                    className="h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Live Preview Pill */}
          <div className="pt-2 border-t border-[#1C2538] flex items-center gap-2.5 text-xs text-slate-400">
            <span>Pratinjau Kategori:</span>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold"
              style={{
                borderColor: `${selectedColor}40`,
                backgroundColor: `${selectedColor}15`,
                color: selectedColor,
              }}
            >
              {React.createElement(getCategoryIcon(selectedIcon), {
                className: 'h-3.5 w-3.5',
              })}
              <span>{name.trim() || 'Nama Kategori'}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!name.trim()}
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
