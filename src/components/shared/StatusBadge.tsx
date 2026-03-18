import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { DocStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: DocStatus
  size?: 'sm' | 'md' | 'lg'
}

const CONFIG: Record<DocStatus, {
  label: string
  labelEn: string
  className: string
  Icon: typeof CheckCircle
}> = {
  missing: {
    label: 'חסר',
    labelEn: 'Missing',
    className: 'bg-red-100 text-red-800 border-red-200',
    Icon: XCircle,
  },
  pending_review: {
    label: 'ממתין לאישור',
    labelEn: 'Pending Review',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  approved: {
    label: 'מאושר',
    labelEn: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-200',
    Icon: CheckCircle,
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-2 gap-2',
}

const ICON_SIZES = { sm: 12, md: 14, lg: 18 }

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, className, Icon } = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${className} ${SIZE_CLASSES[size]}`}
      aria-label={label}
    >
      <Icon size={ICON_SIZES[size]} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
