import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  link: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function WhatsAppButton({
  link,
  label = 'הצטרפו לקבוצת הווצאפ',
  size = 'md',
}: WhatsAppButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-2.5',
  }
  const iconSize = { sm: 16, md: 20, lg: 24 }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`
        inline-flex items-center rounded-xl font-semibold
        bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2
        ${sizeClasses[size]}
      `}
    >
      <MessageCircle size={iconSize[size]} aria-hidden="true" />
      <span>{label}</span>
    </a>
  )
}
