import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: string): string =>
  format(parseISO(date), "d 'de' MMMM yyyy", { locale: es })

export const formatDateShort = (date: string): string =>
  format(parseISO(date), 'dd/MM/yyyy', { locale: es })

export const formatRelative = (date: string): string =>
  formatDistanceToNow(parseISO(date), { addSuffix: true, locale: es })

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const formatWeight = (kg: number, unit: 'kg' | 'lb'): string => {
  if (unit === 'lb') return `${Math.round(kg * 2.2046 * 4) / 4} lb`
  return `${kg} kg`
}