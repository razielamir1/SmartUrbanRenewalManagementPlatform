'use client'

import { useSession } from '@/lib/hooks/useSession'
import { useDocumentChecklist } from '@/lib/hooks/useDocumentChecklist'
import { DocumentChecklist } from '@/components/portal/resident/DocumentChecklist'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DocumentType } from '@/lib/supabase/types'
import { useState } from 'react'

const queryClient = new QueryClient()

export default function DocumentsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DocumentsContent />
    </QueryClientProvider>
  )
}

function DocumentsContent() {
  const { user, loading } = useSession()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { query, uploadDocument, uploading } = useDocumentChecklist(user?.id ?? '')

  if (loading || !user) {
    return <div className="py-12 text-center text-muted-foreground">טוען...</div>
  }

  async function handleUpload(type: DocumentType, file: File) {
    setUploadError(null)
    try {
      await uploadDocument(type, file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'שגיאה בהעלאה')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">המסמכים שלי</h1>

      {uploadError && (
        <div role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 text-base">
          {uploadError}
        </div>
      )}

      {query.isLoading && (
        <div className="py-8 text-center text-muted-foreground">טוען מסמכים...</div>
      )}

      {query.isError && (
        <div role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4">
          שגיאה בטעינת המסמכים. נסו לרענן את הדף.
        </div>
      )}

      {query.data && (
        <DocumentChecklist
          items={query.data}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  )
}
