export type UnitType = 'integer' | 'decimal' | 'weight'

export interface CountLine {
  id: string
  sku: string
  name: string
  expected: string
  counted: string
  unit: string
  unitType: UnitType
  precision: number
  reason: string
  note: string
}

export interface ImportResult { lines: CountLine[]; errors: string[] }

const field = (row: Record<string, string>, names: string[]) => {
  for (const name of names) if (row[name] !== undefined) return row[name].trim()
  return ''
}

/** RFC4180-friendly parser; imported text is retained unchanged outside this function. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1 }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field.')
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

export function decimalError(value: string, unitType: UnitType, precision: number): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter the physical count.'
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return 'Use a number, without commas or rounding.'
  if (unitType === 'integer' && trimmed.includes('.')) return 'This unit accepts whole numbers only.'
  const decimals = (trimmed.split('.')[1] || '').length
  if (decimals > precision) return `This unit allows at most ${precision} decimal place${precision === 1 ? '' : 's'}; nothing was rounded.`
  return null
}

export function variance(line: CountLine): number | null {
  if (decimalError(line.counted, line.unitType, line.precision)) return null
  return Number(line.counted) - Number(line.expected)
}

export function formatQuantity(value: number, precision: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: precision, minimumFractionDigits: 0 })
}

export function importInventory(text: string): ImportResult {
  let matrix: string[][]
  try { matrix = parseCsv(text) } catch (error) { return { lines: [], errors: [error instanceof Error ? error.message : 'Could not read CSV.'] } }
  if (matrix.length < 2) return { lines: [], errors: ['Add a header row and at least one inventory line.'] }
  const headers = matrix[0].map(h => h.trim().toLowerCase())
  const hasExpected = headers.some(h => ['expected', 'expected quantity', 'on hand', 'on_hand'].includes(h))
  if (!hasExpected) return { lines: [], errors: ['Missing an expected column. Use: sku, name, expected, unit, unit_type, precision.'] }
  const lines: CountLine[] = [], errors: string[] = []
  matrix.slice(1).forEach((values, index) => {
    const row = Object.fromEntries(headers.map((key, i) => [key, values[i] || '']))
    const expected = field(row, ['expected', 'expected quantity', 'on hand', 'on_hand'])
    const unitType = (field(row, ['unit_type', 'unit type']).toLowerCase() || 'decimal') as UnitType
    const precisionText = field(row, ['precision', 'decimal places'])
    const precision = precisionText === '' ? (unitType === 'integer' ? 0 : unitType === 'weight' ? 3 : 2) : Number(precisionText)
    if (!['integer', 'decimal', 'weight'].includes(unitType)) errors.push(`Row ${index + 2}: unit_type must be integer, decimal, or weight.`)
    if (!Number.isInteger(precision) || precision < 0 || precision > 8) errors.push(`Row ${index + 2}: precision must be a whole number from 0 to 8.`)
    if (!field(row, ['sku', 'item code', 'code'])) errors.push(`Row ${index + 2}: missing sku.`)
    if (decimalError(expected, unitType, precision)) errors.push(`Row ${index + 2}: expected quantity is not valid for its unit/precision.`)
    lines.push({
      id: crypto.randomUUID(), sku: field(row, ['sku', 'item code', 'code']), name: field(row, ['name', 'item', 'product']) || 'Unnamed item',
      expected, counted: '', unit: field(row, ['unit', 'uom']) || 'each', unitType: ['integer', 'decimal', 'weight'].includes(unitType) ? unitType : 'decimal',
      precision: Number.isInteger(precision) ? precision : 2, reason: '', note: ''
    })
  })
  return { lines, errors }
}

export function toCsv(lines: CountLine[]): string {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const header = ['sku', 'name', 'expected', 'counted', 'variance', 'unit', 'unit_type', 'reason', 'note']
  const body = lines.filter(l => variance(l) !== null && variance(l) !== 0).map(line => [line.sku, line.name, line.expected, line.counted, variance(line)!, line.unit, line.unitType, line.reason, line.note].map(quote).join(','))
  return [header.join(','), ...body].join('\r\n')
}

export const exampleCsv = `sku,name,expected,unit,unit_type,precision
BK-001,Brass hinge,48,each,integer,0
COF-250,Roast coffee,2.850,kg,weight,3
CLT-RED,Red canvas,17.50,m,decimal,2`
