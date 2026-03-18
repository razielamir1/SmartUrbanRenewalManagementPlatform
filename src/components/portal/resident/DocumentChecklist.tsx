'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionRequiredCard } from '@/components/shared/ActionRequiredCard'
import type { Document, DocumentType } from '@/lib/supabase/types'

interface ChecklistItem {
  type: DocumentType
  label: string
  description: string
  doc: Document | null
}

interface DocumentChecklistProps {
  items: ChecklistItem[]
  onUpload: (type: DocumentType, file: File) => Promise<void>
  uploading: DocumentType | null
}

export function DocumentChecklist({ items, onUpload, uploading }: DocumentChecklistProps) {
  const missingItems = items.filter(item => !item.doc || item.doc.status === 'missing')

  return (
    <div className="space-y-6">
      {/* Action Required section */}
      {missingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-800">נדרשת פעולה מצדכם</h3>
          {missingItems.map(item => (
            <UploadCard
              key={item.type}
              item={item}
              onUpload={onUpload}
              uploading={uploading}
            />
          ))}
        </div>
      )}

      {/* All docs status */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">סטטוס מסמכים</h3>
        {items.map(item => (
          <div
            key={item.type}
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card"
          >
            <div>
              <p className="text-base font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={item.doc?.status ?? 'missing'} size="md" />
              {(!item.doc || item.doc.status === 'missing') && (
                <UploadButton type={item.type} onUpload={onUpload} uploading={uploading} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadCard({ item, onUpload, uploading }: {
  item: ChecklistItem
  onUpload: (type: DocumentType, file: File) => Promise<void>
  uploading: DocumentType | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <ActionRequiredCard
        title={`העלו ${item.label}`}
        description={item.description}
        actionLabel={uploading === item.type ? 'מעלה...' : 'העלאת מסמך'}
        onAction={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        aria-label={`העלאת ${item.label}`}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await onUpload(item.type, file)
          e.target.value = ''
        }}
      />
    </>
  )
}

function UploadButton({ type, onUpload, uploading }: {
  type: DocumentType
  onUpload: (type: DocumentType, file: File) => Promise<void>
  uploading: DocumentType | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploading = uploading === type

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="העלאת מסמך"
        className="inline-flex items-center gap-2 rounded-lg border border-primary text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-60"
      >
        <Upload size={14} aria-hidden="true" />
        {isUploading ? 'מעלה...' : 'העלאה'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await onUpload(type, file)
          e.target.value = ''
        }}
      />
    </>
  )
}
