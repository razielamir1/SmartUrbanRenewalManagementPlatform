'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateMeeting } from '@/lib/hooks/useMeetings'

const schema = z.object({
  title:       z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  date:        z.string().min(1, 'תאריך חובה'),
  start_time:  z.string().min(1, 'שעת התחלה חובה'),
  end_time:    z.string().min(1, 'שעת סיום חובה'),
  location:    z.string().optional(),
}).refine(d => d.end_time > d.start_time, {
  message: 'שעת הסיום חייבת להיות לאחר שעת ההתחלה',
  path: ['end_time'],
})

type FormValues = z.infer<typeof schema>

interface Props {
  projectId: string
  onSuccess?: () => void
}

export function CreateMeetingForm({ projectId, onSuccess }: Props) {
  const createMeeting = useCreateMeeting(projectId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    await createMeeting.mutateAsync({
      projectId,
      title: values.title,
      description: values.description,
      start_time: new Date(`${values.date}T${values.start_time}`).toISOString(),
      end_time:   new Date(`${values.date}T${values.end_time}`).toISOString(),
      location: values.location,
    })
    reset()
    onSuccess?.()
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'
  const labelClass = 'block text-base font-medium mb-1'
  const errorClass = 'text-sm text-destructive mt-1'

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold mb-5">פגישה חדשה</h2>

      {createMeeting.isError && (
        <div role="alert" className="mb-4 rounded-lg px-4 py-3 text-base bg-destructive/10 text-destructive border border-destructive/20">
          {(createMeeting.error as Error)?.message ?? 'שגיאה'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="mtg_title" className={labelClass}>כותרת</label>
          <input id="mtg_title" type="text" className={inputClass} {...register('title')} />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="mtg_date" className={labelClass}>תאריך</label>
          <input id="mtg_date" type="date" className={inputClass} dir="ltr" {...register('date')} />
          {errors.date && <p className={errorClass}>{errors.date.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mtg_start" className={labelClass}>שעת התחלה</label>
            <input id="mtg_start" type="time" className={inputClass} dir="ltr" {...register('start_time')} />
            {errors.start_time && <p className={errorClass}>{errors.start_time.message}</p>}
          </div>
          <div>
            <label htmlFor="mtg_end" className={labelClass}>שעת סיום</label>
            <input id="mtg_end" type="time" className={inputClass} dir="ltr" {...register('end_time')} />
            {errors.end_time && <p className={errorClass}>{errors.end_time.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="mtg_location" className={labelClass}>מיקום</label>
          <input id="mtg_location" type="text" className={inputClass} {...register('location')} />
        </div>

        <div>
          <label htmlFor="mtg_desc" className={labelClass}>תיאור (אופציונלי)</label>
          <textarea
            id="mtg_desc"
            rows={3}
            className={inputClass}
            {...register('description')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || createMeeting.isPending}
          className="w-full rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {(isSubmitting || createMeeting.isPending) ? 'שומר...' : 'צור פגישה'}
        </button>
      </form>
    </div>
  )
}
