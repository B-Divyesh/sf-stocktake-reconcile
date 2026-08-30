import { describe, expect, it } from 'vitest'
import { decimalError, formatQuantity, importInventory, parseCsv, toCsv, variance } from './reconcile'

describe('reconciliation integrity', () => {
  it('keeps quoted CSV fields together', () => expect(parseCsv('sku,name,expected\nA1,"Widget, small",2\n')[1][1]).toBe('Widget, small'))
  it('refuses excess decimal precision rather than rounding', () => expect(decimalError('2.8512', 'weight', 3)).toContain('nothing was rounded'))
  it('rejects fractional counts for integer units', () => expect(decimalError('3.0', 'integer', 0)).toContain('whole numbers'))
  it('rejects negative physical counts', () => expect(decimalError('-1', 'integer', 0)).toContain('non-negative'))
  it('imports UTF-8 BOM CSV files', () => expect(importInventory('\uFEFFsku,name,expected,unit,unit_type,precision\r\nA,Thing,1,each,integer,0\r\n').lines).toHaveLength(1))
  it('@claim:exact-quantities exports decimal variances exactly', () => {
    const line = importInventory('sku,name,expected,unit,unit_type,precision\nA,Flour,0.30,kg,weight,2').lines[0]
    line.counted = '0.20'; line.reason = 'Counted short'
    expect(formatQuantity(variance(line)!, line.precision)).toBe('-0.1')
    expect(toCsv([line])).toContain('"-0.1"')
  })
  it('@claim:exact-quantities retains one-unit differences beyond Number.MAX_SAFE_INTEGER', () => {
    const line = importInventory('sku,name,expected,unit,unit_type,precision\nA,Rare part,9007199254740993,each,integer,0').lines[0]
    line.counted = '9007199254740992'; line.reason = 'Counted short'
    expect(variance(line)).toBe(-1n)
    expect(toCsv([line])).toContain('"-1"')
  })
})
