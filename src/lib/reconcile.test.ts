import { describe, expect, it } from 'vitest'
import { decimalError, importInventory, parseCsv, variance } from './reconcile'

describe('reconciliation integrity', () => {
  it('keeps quoted CSV fields together', () => expect(parseCsv('sku,name,expected\nA1,"Widget, small",2\n')[1][1]).toBe('Widget, small'))
  it('refuses excess decimal precision rather than rounding', () => expect(decimalError('2.8512', 'weight', 3)).toContain('nothing was rounded'))
  it('rejects fractional counts for integer units', () => expect(decimalError('3.0', 'integer', 0)).toContain('whole numbers'))
  it('calculates a unit-safe variance only after validation', () => {
    const line = importInventory('sku,name,expected,unit,unit_type,precision\nA,Thing,2.850,kg,weight,3').lines[0]
    line.counted = '2.800'
    expect(variance(line)).toBeCloseTo(-0.05)
  })
})
