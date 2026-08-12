import { describe, it, expect } from 'vitest';
import { processRow, type RawRow } from './dataWorker';

describe('processRow return detection and netQty calculations', () => {
  const baseRow: RawRow = {
    Date: '2026-08-12',
    CustomerName: 'Almarai',
    Segment: 'B2B',
    ItemName: 'Guar Gum',
    Quantity: 100,
    BillType: 'Invoice',
    Revenue: 5000,
  };

  it('identifies a normal sale row correctly', () => {
    const result = processRow(baseRow);
    expect(result).not.toBeNull();
    expect(result!.IsReturn).toBe(false);
    expect(result!.Volume).toBe(100);
    expect(result!.NetQuantity).toBe(100);
  });

  it('identifies a row where BillType is Return as a return', () => {
    const row = { ...baseRow, BillType: 'Return' };
    const result = processRow(row);
    expect(result).not.toBeNull();
    expect(result!.IsReturn).toBe(true);
    expect(result!.NetQuantity).toBe(-100);
  });

  it('identifies a row where BillType contains credit case-insensitively as a return', () => {
    const row1 = { ...baseRow, BillType: 'Credit Memo' };
    const row2 = { ...baseRow, BillType: 'credit note' };
    
    const res1 = processRow(row1);
    const res2 = processRow(row2);
    
    expect(res1!.IsReturn).toBe(true);
    expect(res2!.IsReturn).toBe(true);
    expect(res1!.NetQuantity).toBe(-100);
    expect(res2!.NetQuantity).toBe(-100);
  });

  it('identifies a row where BillType starts with RE or CM as a return', () => {
    const rowRE = { ...baseRow, BillType: 'RE Return Order' };
    const rowCM = { ...baseRow, BillType: 'CM Invoice' };
    
    const resRE = processRow(rowRE);
    const resCM = processRow(rowCM);
    
    expect(resRE!.IsReturn).toBe(true);
    expect(resCM!.IsReturn).toBe(true);
  });

  it('identifies a row with negative Quantity as a return', () => {
    const row = { ...baseRow, Quantity: -50 };
    const result = processRow(row);
    expect(result!.IsReturn).toBe(true);
    expect(result!.Volume).toBe(50);
    expect(result!.NetQuantity).toBe(-50);
  });

  it('identifies a row with negative Revenue as a return', () => {
    const row = { ...baseRow, Revenue: -100 };
    const result = processRow(row);
    expect(result!.IsReturn).toBe(true);
    expect(result!.NetQuantity).toBe(-100);
  });

  it('flips netQty sign correctly when NetQuantity is present in raw row', () => {
    const normalRow = { ...baseRow, NetQuantity: 80 };
    const returnRow = { ...baseRow, BillType: 'Return', NetQuantity: 80 };
    const returnNegativeRow = { ...baseRow, BillType: 'Return', NetQuantity: -80 };

    const resNormal = processRow(normalRow);
    const resReturn = processRow(returnRow);
    const resReturnNeg = processRow(returnNegativeRow);

    expect(resNormal!.NetQuantity).toBe(80);
    expect(resReturn!.NetQuantity).toBe(-80);
    expect(resReturnNeg!.NetQuantity).toBe(-80);
  });

  it('returns null for invalid dates', () => {
    const row = { ...baseRow, Date: 'invalid-date-string' };
    const result = processRow(row);
    expect(result).toBeNull();
  });
});
