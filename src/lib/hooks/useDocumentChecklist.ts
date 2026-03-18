'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Document, DocumentType } from '@/lib/supabase/types'

export const REQUIRED_DOC_TYPES: DocumentType[] = ['id_card', 'tabu', 'signed_contract']

export const DOC_LABELS: Record<DocumentType, { label: string; description: string }> = {
  id_card: {
    label: 'תעודת זהות',
    description: 'תעודת הזהות של בעל הדירה (שני הצדדים)',
  },
  tabu: {
    label: 'נסח טאבו',
    description: 'נסח רישום מקרקעין עדכני (לא יותר מ-3 חודשים)',
  },
  signed_contract: {
    label: 'חוזה חתום',
    description: 'חוזה פינוי-בינוי חתום עם היזם',
  },
  permit: { label: 'היתר', description: 'היתר בנייה' },
  municipal_approval: { label: 'אישור עירייה', description: 'אישור עירייה' },
  construction_plan: { label: 'תוכנית בנייה', description: 'תוכנית בנייה' },
  other: { label: 'אחר', description: 'מסמך אחר' },
}

export interface ChecklistItem {
  type: DocumentType
  label: string
  description: string
  doc: Document | null
}

export function useDocumentChecklist(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState<DocumentType | null>(null)

  const query = useQuery({
    queryKey: ['documents', userId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', userId)
        .eq('source', 'resident')
      if (error) throw error

      return REQUIRED_DOC_TYPES.map(type => ({
        type,
        label: DOC_LABELS[type].label,
        description: DOC_LABELS[type].description,
        doc: data?.find(d => d.type === type) ?? null,
      }))
    },
    staleTime: 30_000,
  })

  async function uploadDocument(type: DocumentType, file: File) {
    setUploading(type)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('source', 'resident')

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'שגיאה בהעלאה')
      }

      await qc.invalidateQueries({ queryKey: ['documents', userId] })
    } finally {
      setUploading(null)
    }
  }

  return { query, uploadDocument, uploading }
}
