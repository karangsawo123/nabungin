import {
  Tag,
  Wallet,
  Gift,
  PiggyBank,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Plane,
  Heart,
  Shield,
  Briefcase,
  Utensils,
  Smartphone,
  LucideIcon,
} from 'lucide-react'

export const AVAILABLE_CATEGORY_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'tag', label: 'Umum / Tag', icon: Tag },
  { id: 'wallet', label: 'Dompet / Alokasi', icon: Wallet },
  { id: 'gift', label: 'Bonus / THR', icon: Gift },
  { id: 'piggy-bank', label: 'Celengan / Tabungan', icon: PiggyBank },
  { id: 'shopping-bag', label: 'Belanja', icon: ShoppingBag },
  { id: 'coffee', label: 'Gaya Hidup', icon: Coffee },
  { id: 'utensils', label: 'Makanan', icon: Utensils },
  { id: 'home', label: 'Tempat Tinggal', icon: Home },
  { id: 'car', label: 'Transportasi', icon: Car },
  { id: 'plane', label: 'Liburan', icon: Plane },
  { id: 'heart', label: 'Kesehatan / Keluarga', icon: Heart },
  { id: 'shield', label: 'Proteksi / Darurat', icon: Shield },
  { id: 'briefcase', label: 'Pekerjaan / Bisnis', icon: Briefcase },
  { id: 'smartphone', label: 'Tagihan / Digital', icon: Smartphone },
]

export const AVAILABLE_CATEGORY_COLORS = [
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Cyan', hex: '#06B6D4' },
]

export function getCategoryIcon(iconId?: string | null): LucideIcon {
  const match = AVAILABLE_CATEGORY_ICONS.find((item) => item.id === iconId)
  return match ? match.icon : Tag
}
