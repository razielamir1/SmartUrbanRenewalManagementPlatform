'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Meeting } from '@/lib/supabase/types'

export function useMeetings(projectId: string) {
  return useQuery({
    queryKey: ['meetings', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings?projectId=${projectId}`)
      if (!res.ok) throw new Error('שגיאה בטעינת פגישות')
      const data = await res.json()
      return (data.meetings ?? []) as Meeting[]
    },
    staleTime: 30_000,
  })
}

interface CreateMeetingInput {
  projectId: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
}

export function useCreateMeeting(projectId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingInput) => {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה ביצירת פגישה')
      return data.meeting as Meeting
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings', projectId] })
    },
  })
}
