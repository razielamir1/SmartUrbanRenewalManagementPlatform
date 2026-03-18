'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface ContactWithBuilding {
  id: string
  project_id: string
  building_id: string | null
  full_name: string
  phone_raw: string
  phone_wa: string
  notes: string | null
  created_at: string
  buildings: { address: string; building_number: string | null } | null
}

export function useContacts(projectId: string) {
  const supabase = getSupabaseBrowserClient()

  return useQuery({
    queryKey: ['contacts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, buildings(address, building_number)')
        .eq('project_id', projectId)
        .order('full_name')

      if (error) throw error
      return (data ?? []) as ContactWithBuilding[]
    },
    staleTime: 30_000,
  })
}

export function useContactsInvalidate() {
  const qc = useQueryClient()
  return (projectId: string) => qc.invalidateQueries({ queryKey: ['contacts', projectId] })
}
