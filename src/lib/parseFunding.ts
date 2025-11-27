import * as XLSX from 'xlsx';
import { FundingRecord, FundingColumnMapping } from '@/types/funding';
import { normalizePartner } from './partnerNormalization';

/**
 * Auto-detect column names from headers
 */
function autoDetectColumns(headers: string[]): FundingColumnMapping | null {
  const mapping: Partial<FundingColumnMapping> = {};
  
  const normalize = (str: string) => str.toLowerCase().trim();
  
  headers.forEach((header) => {
    const h = normalize(header);
    
    if (h.includes('deal') && h.includes('name') || h.includes('business') && h.includes('name')) {
      mapping.dealName = header;
    } else if (h.includes('funding') && h.includes('date') || h.includes('funded') && h.includes('date')) {
      mapping.fundingDate = header;
    } else if (h.includes('funded') && h.includes('amount') || h.includes('funding') && h.includes('amount')) {
      mapping.fundedAmount = header;
    } else if (h.includes('management') && h.includes('fee') || h.includes('mgmt') && h.includes('fee')) {
      mapping.managementFee = header;
    } else if (h.includes('partner') || h === 'iso') {
      mapping.partner = header;
    } else if (h.includes('deal') && h.includes('type') || h.includes('new') || h.includes('renewal')) {
      mapping.dealType = header;
    }
  });
  
  // Validate required fields
  const required = ['dealName', 'fundingDate', 'fundedAmount', 'managementFee', 'partner'];
  const hasAllRequired = required.every(field => mapping[field as keyof FundingColumnMapping]);
  
  return hasAllRequired ? mapping as FundingColumnMapping : null;
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  
  // Excel date number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  
  // String date
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Already a date
  if (value instanceof Date) {
    return value;
  }
  
  return null;
}

/**
 * Parse currency value to number
 */
function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Parse funding ledger file
 */
export async function parseFundingFile(
  file: File,
  columnMapping?: FundingColumnMapping
): Promise<FundingRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
        
        if (jsonData.length === 0) {
          reject(new Error('No data found in file'));
          return;
        }
        
        // Auto-detect columns if not provided
        const headers = Object.keys(jsonData[0] as object);
        const mapping = columnMapping || autoDetectColumns(headers);
        
        if (!mapping) {
          reject(new Error('Could not auto-detect columns. Please provide manual mapping.'));
          return;
        }
        
        const fundingRecords: FundingRecord[] = [];
        
        jsonData.forEach((row: any, index: number) => {
          const fundingDate = parseDate(row[mapping.fundingDate]);
          
          if (!fundingDate) {
            console.warn(`Row ${index + 1}: Invalid funding date, skipping`);
            return;
          }
          
          const rawPartner = row[mapping.partner] || '';
          const dealName = row[mapping.dealName] || '';
          
          if (!dealName.trim()) {
            console.warn(`Row ${index + 1}: Empty deal name, skipping`);
            return;
          }
          
          const record: FundingRecord = {
            dealName: dealName.trim(),
            fundingDate,
            fundedAmount: parseCurrency(row[mapping.fundedAmount]),
            managementFee: parseCurrency(row[mapping.managementFee]),
            partner: rawPartner,
            partnerNormalized: normalizePartner(rawPartner),
            dealType: mapping.dealType ? row[mapping.dealType] : undefined
          };
          
          fundingRecords.push(record);
        });
        
        resolve(fundingRecords);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}
