interface CircularProgressProps {
  value: number          // 0–100
  size?: number          // SVG width/height in px (default 80)
  strokeWidth?: number   // (default 8)
  label?: string
  colorClass?: string    // Tailwind stroke class e.g. "stroke-primary"
  showValue?: boolean
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  label,
  colorClass = 'stroke-primary',
  showValue = true,
}: CircularProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference
  const center = size / 2

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${clampedValue}%`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${colorClass}`}
        />
      </svg>
      {showValue && (
        <span className="text-xl font-bold tabular-nums" aria-hidden="true">
          {clampedValue}%
        </span>
      )}
      {label && (
        <span className="text-sm text-muted-foreground text-center max-w-[100px]">
          {label}
        </span>
      )}
    </div>
  )
}
