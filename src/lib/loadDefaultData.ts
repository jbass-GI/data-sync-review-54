import * as XLSX from 'xlsx';
import { Deal } from '@/types/dashboard';
import { normalizePartner } from './partnerNormalization';

const DEFAULT_DATA_URL = '/data/Samson_west_Comm_tracker.xlsx';

export async function loadDefaultFundingData(): Promise<Deal[]> {
  const response = await fetch(DEFAULT_DATA_URL);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const deals: Deal[] = [];
  
  // Process all sheets in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Process data rows (skip headers)
  for (let i = 2; i < jsonData.length; i++) {
    const row: any = jsonData[i];
    
    // Skip empty rows or rows without deal name containing %
    if (!row[0] || typeof row[0] !== 'string' || !row[0].includes('%')) continue;
    
    // Skip month header rows like "January 2025"
    if (row[0].match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i)) continue;
    
    // Parse deal name and fee percentage
    const dealNameMatch = row[0].match(/^(.+?)\s*-\s*([\d.]+)%$/);
    if (!dealNameMatch) continue;
    
    const dealName = dealNameMatch[1].trim();
    const feePercent = parseFloat(dealNameMatch[2]);
    
    // Parse funded amount
    const fundedAmount = typeof row[1] === 'number' ? row[1] : 
                        typeof row[1] === 'string' ? parseFloat(row[1].replace(/[^0-9.-]/g, '')) : 0;
    
    // Parse management fee
    const mgmtFeeTotal = typeof row[2] === 'number' ? row[2] :
                        typeof row[2] === 'string' ? parseFloat(row[2].replace(/[^0-9.-]/g, '')) : 0;
    
    // Parse funding date
    let fundingDate: Date;
    if (row[3] instanceof Date) {
      fundingDate = row[3];
    } else if (typeof row[3] === 'string') {
      fundingDate = new Date(row[3]);
    } else if (typeof row[3] === 'number') {
      // Excel date serial number
      const parsed = XLSX.SSF.parse_date_code(row[3]);
      fundingDate = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
      continue;
    }
    
    // Validate date
    if (isNaN(fundingDate.getTime())) continue;
    
    const partner = row[4] || 'Unknown';
    const dealType = row[5] || 'Unknown';
    const notes = row[6] || '';
    
    // Skip invalid entries
    if (fundedAmount <= 0 || isNaN(fundedAmount)) continue;
    
    deals.push({
      dealName,
      feePercent,
      fundingDate,
      fundedAmount,
      mgmtFeeTotal,
      partner,
      partnerNormalized: normalizePartner(partner),
      dealType,
      notes
    });
    }
  }
  
  return deals;
}
