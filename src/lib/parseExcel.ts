import * as XLSX from 'xlsx';
import { Deal } from '@/types/dashboard';
import { normalizePartner, getChannelTypeFromNormalized } from './partnerNormalization';

export function parseExcelFile(file: File): Promise<Deal[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const deals: Deal[] = [];
        
        // Skip header rows and process data (starting from row with actual deal data)
        for (let i = 8; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          
          // Skip empty rows or rows without deal name
          if (!row[0] || typeof row[0] !== 'string' || !row[0].includes('%')) continue;
          
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
            fundingDate = XLSX.SSF.parse_date_code(row[3]);
          } else {
            continue;
          }
          
          const partner = row[4] || 'Unknown';
          const dealType = row[5] || 'Unknown';
          const notes = row[7] || '';
          
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
        
        resolve(deals);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

// Legacy function - kept for backwards compatibility
// Use getChannelTypeFromNormalized from partnerNormalization.ts instead
export function getChannelType(partner: string): 'Direct' | 'ISO' {
  const normalized = normalizePartner(partner);
  return getChannelTypeFromNormalized(normalized);
}

export function isDealTypeNew(dealType: string): boolean {
  const normalized = dealType.toLowerCase().trim();
  // New deals: starts with "new" (not "renew") or is just "n"
  // Explicitly exclude "renew" since it contains "new" as a substring
  if (normalized.startsWith('renew')) return false;
  return normalized.startsWith('new') || normalized === 'n';
}

export function isDealTypeRenewal(dealType: string): boolean {
  // Everything that's not a new deal is a renewal
  return !isDealTypeNew(dealType);
}

export function getTicketSizeBucket(amount: number): string {
  if (amount < 50000) return '<$50K';
  if (amount < 100000) return '$50K-$100K';
  if (amount < 250000) return '$100K-$250K';
  if (amount < 500000) return '$250K-$500K';
  if (amount < 1000000) return '$500K-$1M';
  return '$1M+';
}
