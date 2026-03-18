'use client'

import { useState } from 'react'
import type { Building, Document, DocumentType } from '@/lib/supabase/types'

interface ResidentDoc {
  ownerId: string
  ownerName: string | null
  unitNumber: string
  docs: Document[]
}

interface HeatMapProps {
  buildings: Building[]
  residentDocs: ResidentDoc[]
}

const DOC_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'id_card', label: 'תעודת זהות' },
  { type: 'tabu', label: 'טאבו' },
  { type: 'signed_contract', label: 'חוזה חתום' },
]

type CellStatus = 'all_approved' | 'has_pending' | 'has_missing'

function getCellStatus(docs: Document[], type: DocumentType): CellStatus {
  const doc = docs.find(d => d.type === type)
  if (!doc || doc.status === 'missing') return 'has_missing'
  if (doc.status === 'pending_review') return 'has_pending'
  return 'all_approved'
}

const CELL_STYLES: Record<CellStatus, string> = {
  has_missing:  'bg-red-100 text-red-800 border-red-300',
  has_pending:  'bg-amber-100 text-amber-800 border-amber-300',
  all_approved: 'bg-green-100 text-green-800 border-green-300',
}

export function DocumentHeatMap({ buildings, residentDocs }: HeatMapProps) {
  const [selectedCell, setSelectedCell] = useState<{ buildingId: string; type: DocumentType } | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" role="grid" aria-label="מצב מסמכים לפי בניין">
        <thead>
          <tr>
            <th className="text-start p-3 font-semibold bg-muted/50 rounded-tl-lg min-w-[140px]">
              בניין
            </th>
            {DOC_TYPES.map(({ type, label }) => (
              <th key={type} className="text-center p-3 font-semibold bg-muted/50 min-w-[120px]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buildings.map((building) => {
            const buildingResidents = residentDocs.filter(rd =>
              // In real usage this would be joined by building — here simplified
              rd.docs.some(d => d.project_id === building.project_id)
            )

            return (
              <tr key={building.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 font-medium">{building.address}</td>
                {DOC_TYPES.map(({ type }) => {
                  // Aggregate worst status across all residents in this building
                  const allDocs = buildingResidents.flatMap(r => r.docs)
                  const worstStatus = buildingResidents.length === 0
                    ? 'has_missing'
                    : buildingResidents.some(r => getCellStatus(r.docs, type) === 'has_missing')
                      ? 'has_missing'
                      : buildingResidents.some(r => getCellStatus(r.docs, type) === 'has_pending')
                        ? 'has_pending'
                        : 'all_approved'

                  const isSelected = selectedCell?.buildingId === building.id && selectedCell?.type === type

                  return (
                    <td key={type} className="p-2 text-center">
                      <button
                        onClick={() => setSelectedCell(
                          isSelected ? null : { buildingId: building.id, type }
                        )}
                        aria-label={`${building.address} - ${type}: ${worstStatus}`}
                        aria-expanded={isSelected}
                        className={`
                          w-full rounded-lg border p-2 font-semibold transition-all cursor-pointer
                          focus:outline-none focus:ring-2 focus:ring-ring
                          ${CELL_STYLES[worstStatus]}
                          ${isSelected ? 'ring-2 ring-ring' : ''}
                        `}
                      >
                        {worstStatus === 'has_missing' ? '✗ חסר' :
                         worstStatus === 'has_pending' ? '⏳ ממתין' : '✓ הושלם'}
                      </button>
                      {isSelected && (
                        <div className="mt-2 text-start bg-card border rounded-lg p-3 shadow-lg space-y-1 text-sm z-10">
                          {buildingResidents.length === 0 ? (
                            <p className="text-muted-foreground">אין דיירים משויכים</p>
                          ) : buildingResidents.map(r => (
                            <div key={r.ownerId} className="flex justify-between gap-2">
                              <span>{r.ownerName ?? 'לא ידוע'} ({r.unitNumber})</span>
                              <span className={`font-medium ${
                                getCellStatus(r.docs, type) === 'has_missing' ? 'text-red-700' :
                                getCellStatus(r.docs, type) === 'has_pending' ? 'text-amber-700' :
                                'text-green-700'
                              }`}>
                                {getCellStatus(r.docs, type) === 'has_missing' ? 'חסר' :
                                 getCellStatus(r.docs, type) === 'has_pending' ? 'ממתין' : 'מאושר'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
