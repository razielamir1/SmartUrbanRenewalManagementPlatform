// Server-only: uses Node.js packages (mammoth, papaparse, pdf-parse)
// Never import this file in Client Components
import { extractPhonePairs, type RawContact } from './parse-phones'

export async function parseContactFile(
  buffer: Buffer,
  mimeType: string
): Promise<RawContact[]> {
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return parseDocx(buffer)
  }

  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return parseCsv(buffer)
  }

  if (mimeType === 'application/pdf') {
    return parsePdf(buffer)
  }

  throw new Error(`סוג קובץ לא נתמך: ${mimeType}`)
}

async function parseDocx(buffer: Buffer): Promise<RawContact[]> {
  const mammoth = await import('mammoth')
  const { value: text } = await mammoth.extractRawText({ buffer })
  return extractPhonePairs(text)
}

function parseCsv(buffer: Buffer): RawContact[] {
  const Papa = require('papaparse') as typeof import('papaparse')
  const text = buffer.toString('utf-8')
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true })
  // Join all cells of each row as a single line for phone extraction
  const allText = (data as string[][]).map(row => row.join(' ')).join('\n')
  return extractPhonePairs(allText)
}

async function parsePdf(buffer: Buffer): Promise<RawContact[]> {
  // pdf-parse is listed in serverExternalPackages so Next.js won't bundle it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (
    dataBuffer: Buffer
  ) => Promise<{ text: string }>
  const { text } = await pdfParse(buffer)
  return extractPhonePairs(text)
}
