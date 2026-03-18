import { AlertTriangle } from 'lucide-react'

interface ActionRequiredCardProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function ActionRequiredCard({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: ActionRequiredCardProps) {
  return (
    <div
      role="alert"
      className={`
        relative rounded-xl border-2 border-red-500 bg-red-50 p-5
        flex gap-4 items-start
        ${className}
      `}
    >
      <AlertTriangle
        className="text-red-600 mt-0.5 shrink-0"
        size={28}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-red-900">{title}</p>
        <p className="mt-1 text-base text-red-800">{description}</p>
        <button
          onClick={onAction}
          className="mt-3 inline-flex items-center rounded-lg bg-red-600 text-white px-4 py-2 text-base font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
