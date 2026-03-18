// Israeli mobile number: 05X-XXXXXXX / 05X XXXXXXX / 05XXXXXXXX
const IL_PHONE_RE = /0[5-9]\d[-\s]?\d{3}[-\s]?\d{4}/g

export interface RawContact {
  full_name: string
  phone_raw: string
  phone_wa: string  // 972XXXXXXXXX — wa.me format
}

export function extractPhonePairs(text: string): RawContact[] {
  const lines = text.split(/\r?\n/)
  const results: RawContact[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const phones = trimmed.match(IL_PHONE_RE)
    if (!phones) continue

    const firstPhoneIndex = trimmed.search(IL_PHONE_RE)
    // Name = everything before the first phone, stripped of leading digits/punctuation
    const namePart = trimmed
      .slice(0, firstPhoneIndex)
      .replace(/^[\d\s.,;:\-–—|/\\()[\]{}]+/, '')
      .trim()

    for (const phone of phones) {
      results.push({
        full_name: namePart || 'לא ידוע',
        phone_raw: phone,
        phone_wa: normalizeToWA(phone),
      })
    }
  }

  return results
}

export function normalizeToWA(phone: string): string {
  // Remove all spaces and dashes, strip leading 0, prepend 972
  const digits = phone.replace(/[-\s]/g, '')
  return '972' + digits.slice(1)
}
