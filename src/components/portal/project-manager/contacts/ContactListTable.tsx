'use client'

import { useRef } from 'react'
import { MessageCircle, Users, UserPlus } from 'lucide-react'
import { useContacts, type ContactWithBuilding } from '@/lib/hooks/useContacts'

interface Building {
  id: string
  address: string
  building_number: string | null
  building_whatsapp_link?: string | null
}

interface Props {
  projectId: string
  projectName: string
  buildings: Building[]
}

function buildInviteUrl(phone_wa: string, projectName: string): string {
  const text = encodeURIComponent(
    `שלום!\nאתם מוזמנים להצטרף לפורטל הפרויקט "${projectName}".\n` +
    `לכניסה: https://smart-urban-renewal.vercel.app/login\n` +
    `פרטי הגישה ישלחו בנפרד.`
  )
  return `https://wa.me/${phone_wa}?text=${text}`
}

export function ContactListTable({ projectId, projectName, buildings }: Props) {
  const { data: contacts, isLoading, error } = useContacts(projectId)
  const dialogRefs = useRef<Record<string, HTMLDialogElement | null>>({})

  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center animate-pulse">טוען אנשי קשר...</p>
  }

  if (error) {
    return <p className="text-destructive py-8 text-center">שגיאה בטעינת אנשי קשר</p>
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-lg">אין אנשי קשר עדיין.</p>
        <p className="text-sm mt-1">עברו לטאב &ldquo;ייבוא אנשי קשר&rdquo; להוספת אנשי קשר.</p>
      </div>
    )
  }

  // Group contacts by building_id
  const noBuilding = contacts.filter(c => !c.building_id)
  const byBuilding = buildings.map(b => ({
    building: b,
    contacts: contacts.filter(c => c.building_id === b.id),
  })).filter(g => g.contacts.length > 0)

  function renderSection(
    label: string,
    groupContacts: ContactWithBuilding[],
    buildingWaLink?: string | null
  ) {
    if (groupContacts.length === 0) return null

    const dialogId = label

    return (
      <div key={label} className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-muted/30 border-b border-border">
          <span className="font-semibold text-base">{label}</span>
          <div className="flex gap-2 flex-wrap">
            {buildingWaLink && (
              <a
                href={buildingWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 text-sm font-medium hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle size={14} />
                הצטרף לקבוצה
              </a>
            )}
            <button
              onClick={() => dialogRefs.current[dialogId]?.showModal()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <UserPlus size={14} />
              הזמן את כולם ({groupContacts.length})
            </button>
          </div>
        </div>

        {/* Contacts table */}
        <div className="overflow-x-auto">
        <table className="w-full text-base min-w-[400px]">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-start p-3 font-semibold text-sm">שם</th>
              <th className="text-start p-3 font-semibold text-sm">טלפון</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {groupContacts.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                <td className="p-3 font-medium">{c.full_name}</td>
                <td className="p-3 text-muted-foreground font-mono text-sm" dir="ltr">{c.phone_raw}</td>
                <td className="p-3 text-end">
                  <a
                    href={buildInviteUrl(c.phone_wa, projectName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 text-sm font-medium hover:bg-green-500/20 transition-colors"
                  >
                    <MessageCircle size={14} />
                    שלח הזמנה
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* "Invite all" dialog */}
        <dialog
          ref={el => { dialogRefs.current[dialogId] = el }}
          className="rounded-2xl border border-border bg-card p-6 shadow-xl w-full max-w-md backdrop:bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) (e.currentTarget as HTMLDialogElement).close() }}
        >
          <h3 className="text-lg font-bold mb-1">הזמנת כל אנשי הקשר</h3>
          <p className="text-sm text-muted-foreground mb-4">{label} — לחצו על כל שם לשלוח הזמנה</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {groupContacts.map(c => (
              <a
                key={c.id}
                href={buildInviteUrl(c.phone_wa, projectName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium">{c.full_name}</span>
                <span className="text-sm text-muted-foreground" dir="ltr">{c.phone_raw}</span>
              </a>
            ))}
          </div>
          <button
            onClick={() => dialogRefs.current[dialogId]?.close()}
            className="mt-4 w-full rounded-xl border border-border px-4 py-2 text-base hover:bg-muted/40 transition-colors"
          >
            סגור
          </button>
        </dialog>
      </div>
    )
  }

  const buildingMap = Object.fromEntries(buildings.map(b => [b.id, b]))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{contacts.length} אנשי קשר סה&ldquo;כ</p>

      {byBuilding.map(({ building, contacts: gc }) =>
        renderSection(
          `${building.address}${building.building_number ? ` (${building.building_number})` : ''}`,
          gc,
          building.building_whatsapp_link
        )
      )}

      {noBuilding.length > 0 && renderSection('ללא שיוך לבניין', noBuilding, null)}
    </div>
  )
}
