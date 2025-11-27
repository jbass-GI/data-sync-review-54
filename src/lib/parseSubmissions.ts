import * as XLSX from 'xlsx';
import { Submission, ColumnMapping, DataQualityMetrics } from '@/types/submission';
import { normalizePartner } from './partnerNormalization';
import {
  getPipelineAgeBucket,
  getOfferSizeBucket,
  getStageCategory,
  getSubmissionMonth,
  getSubmissionQuarter,
  getDaysInPipeline
} from './submissionCalculations';

interface ParseResult {
  submissions: Submission[];
  dataQuality: DataQualityMetrics;
  normalizationLog: { original: string; normalized: string }[];
}

/**
 * Auto-detect column names from headers
 */
function autoDetectColumns(headers: string[]): ColumnMapping | null {
  const mapping: Partial<ColumnMapping> = {};
  
  const normalize = (str: string) => str.toLowerCase().trim();
  
  headers.forEach((header) => {
    const h = normalize(header);
    
    if (h.includes('name') && !h.includes('iso') && !h.includes('rep')) {
      mapping.name = header;
    } else if (h === 'iso' || h.includes('partner')) {
      mapping.iso = header;
    } else if (h === 'rep' || h.includes('representative')) {
      mapping.rep = header;
    } else if (h === 'stage' || h.includes('status')) {
      mapping.stage = header;
    } else if (h.includes('offer') && h.includes('amount')) {
      mapping.offerAmount = header;
    } else if (h.includes('lead received')) {
      mapping.leadReceived = header;
    } else if (h.includes('lead submitted') || h.includes('submitted')) {
      mapping.leadSubmitted = header;
    } else if (h.includes('days since')) {
      mapping.daysSinceSub = header;
    }
  });
  
  // Validate required fields
  const required = ['name', 'iso', 'rep', 'stage', 'offerAmount', 'leadSubmitted'];
  const hasAllRequired = required.every(field => mapping[field as keyof ColumnMapping]);
  
  return hasAllRequired ? mapping as ColumnMapping : null;
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
 * Main parsing function for Monday.com submissions
 */
export async function parseSubmissionsFile(
  file: File,
  columnMapping?: ColumnMapping
): Promise<ParseResult> {
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
        
        const submissions: Submission[] = [];
        const normalizationLog: { original: string; normalized: string }[] = [];
        let validISOCount = 0;
        let missingOfferAmount = 0;
        
        jsonData.forEach((row: any) => {
          const rawISO = row[mapping.iso] || '';
          const normalizedISO = normalizePartner(rawISO);
          
          // Track normalizations
          if (rawISO && rawISO.toUpperCase().trim() !== normalizedISO) {
            normalizationLog.push({
              original: rawISO,
              normalized: normalizedISO
            });
          }
          
          if (normalizedISO !== 'UNKNOWN') {
            validISOCount++;
          }
          
          const offerAmount = parseCurrency(row[mapping.offerAmount]);
          if (!offerAmount || offerAmount === 0) {
            missingOfferAmount++;
          }
          
          const leadSubmitted = parseDate(row[mapping.leadSubmitted]) || new Date();
          const daysInPipeline = getDaysInPipeline(leadSubmitted);
          
          const submission: Submission = {
            name: row[mapping.name] || '',
            iso: rawISO,
            isoNormalized: normalizedISO,
            rep: row[mapping.rep] || '',
            stage: row[mapping.stage] || '',
            offerAmount,
            leadReceived: parseDate(row[mapping.leadReceived]),
            leadSubmitted,
            daysSinceSub: mapping.daysSinceSub ? parseInt(row[mapping.daysSinceSub]) || 0 : 0,
            submissionMonth: getSubmissionMonth(leadSubmitted),
            submissionQuarter: getSubmissionQuarter(leadSubmitted),
            daysInPipeline,
            pipelineAgeBucket: getPipelineAgeBucket(daysInPipeline),
            offerSizeBucket: getOfferSizeBucket(offerAmount),
            stageCategory: getStageCategory(row[mapping.stage] || '')
          };
          
          submissions.push(submission);
        });
        
        // Calculate data quality metrics
        const dates = submissions
          .map(s => s.leadSubmitted)
          .filter(d => d)
          .sort((a, b) => a.getTime() - b.getTime());
        
        const uniqueISOs = [...new Set(submissions.map(s => s.isoNormalized))].filter(iso => iso !== 'UNKNOWN');
        
        const dataQuality: DataQualityMetrics = {
          totalRecords: submissions.length,
          validISOCount,
          validISOPercent: (validISOCount / submissions.length) * 100,
          missingOfferAmount,
          earliestDate: dates.length > 0 ? dates[0] : null,
          latestDate: dates.length > 0 ? dates[dates.length - 1] : null,
          uniqueISOs: uniqueISOs.length,
          isoList: uniqueISOs.sort(),
          normalizationsApplied: normalizationLog.length
        };
        
        resolve({
          submissions,
          dataQuality,
          normalizationLog
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}
