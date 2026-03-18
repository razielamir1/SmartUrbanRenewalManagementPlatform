import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('type') as string | null
  const source = (formData.get('source') as string) || 'resident'
  const projectId = formData.get('projectId') as string | null

  if (!file || !docType) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'הקובץ גדול מדי. הגודל המקסימלי הוא 10MB' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'סוג קובץ לא נתמך. ניתן להעלות PDF, JPG, PNG בלבד' }, { status: 400 })
  }

  // Upload to storage: {uid}/{source}/{type}-{timestamp}.ext
  const ext = file.name.split('.').pop() ?? 'pdf'
  const storagePath = `${user.id}/${source}/${docType}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Generate a signed URL (1-hour expiry)
  const { data: signedUrlData } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600)

  // Upsert document row
  const { error: dbError } = await supabase
    .from('documents')
    .upsert(
      {
        owner_id: source === 'resident' ? user.id : null,
        project_id: projectId ?? null,
        type: docType as never,
        source: source as never,
        storage_path: storagePath,
        url: signedUrlData?.signedUrl ?? null,
        status: 'pending_review',
      },
      { onConflict: 'owner_id,type' }
    )

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, storagePath })
}
