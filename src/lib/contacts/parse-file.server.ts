// Server-only: uses Node.js packages (mammoth, papaparse, pdf-parse)
// Never import this file in Client Components
import { extractPhonePairs, type RawContact } from './parse-phones'

/** Extract plain text from an uploaded file buffer */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer })
    return value
  }

  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    const Papa = require('papaparse') as typeof import('papaparse')
    const text = buffer.toString('utf-8')
    const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true })
    return (data as string[][]).map(row => row.join(' ')).join('\n')
  }

  if (mimeType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>
    const { text } = await pdfParse(buffer)
    return text
  }

  // Plain text / TXT
  return buffer.toString('utf-8')
}

/** Legacy regex-based parser (kept for fallback) */
export async function parseContactFile(
  buffer: Buffer,
  mimeType: string
): Promise<RawContact[]> {
  const text = await extractTextFromFile(buffer, mimeType)
  return extractPhonePairs(text)
}
