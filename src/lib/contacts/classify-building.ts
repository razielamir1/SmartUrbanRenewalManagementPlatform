interface BuildingInfo {
  id: string
  address: string
  building_number: string | null
}

/**
 * Tries to classify a contact line into a building by matching address tokens.
 * Returns a building id if ≥2 address tokens (length>2) appear in the text,
 * or if the building_number appears. Returns null if no match.
 */
export function classifyBuilding(
  contactText: string,
  buildings: BuildingInfo[]
): string | null {
  const normalized = contactText.toLowerCase()

  for (const b of buildings) {
    // Match by building number first (quick check)
    if (b.building_number && normalized.includes(b.building_number.toLowerCase())) {
      return b.id
    }

    // Match by address tokens (at least 2 meaningful tokens must match)
    const tokens = b.address.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    const matchedCount = tokens.filter(t => normalized.includes(t)).length
    if (matchedCount >= 2) return b.id
  }

  return null
}
