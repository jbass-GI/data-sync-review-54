import { Submission, DataQualityMetrics } from '@/types/submission';
import { normalizePartner } from './partnerNormalization';
import {
  getPipelineAgeBucket,
  getOfferSizeBucket,
  getStageCategory,
  getSubmissionMonth,
  getSubmissionQuarter,
  getDaysInPipeline
} from './submissionCalculations';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbL9MUjFCYgQuqVShZ_Rol_QgaqMDN8jtZvoMCm3NEbtttx7Pg9kXV4oX49blrxoZcxudqk0wnIHfH/pub?output=csv';

interface ParseResult {
  submissions: Submission[];
  dataQuality: DataQualityMetrics;
  normalizationLog: { original: string; normalized: string }[];
}

/**
 * Parse CSV text into rows
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Auto-detect column names from headers
 */
function autoDetectColumns(headers: string[]): Record<string, string> | null {
  const mapping: Record<string, string> = {};
  
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
  
  return mapping;
}

/**
 * Parse date from various formats
 */
function parseDate(value: string): Date | null {
  if (!value) return null;
  
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse currency value to number
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch and parse data from Google Sheets
 */
export async function fetchGoogleSheetData(customUrl?: string): Promise<ParseResult> {
  const url = customUrl || GOOGLE_SHEET_CSV_URL;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
  }
  
  const csvText = await response.text();
  
  // Check if we got an error page instead of CSV
  if (csvText.includes('<!DOCTYPE') || csvText.includes('<html')) {
    throw new Error('Google Sheet is not published or URL is incorrect. Please publish the sheet via File → Share → Publish to web');
  }
  
  const rows = parseCSV(csvText);
  
  if (rows.length === 0) {
    throw new Error('No data found in Google Sheet');
  }
  
  const headers = Object.keys(rows[0]);
  const mapping = autoDetectColumns(headers);
  
  if (!mapping) {
    throw new Error('Could not auto-detect columns. Expected columns: Name, ISO, Rep, Stage, Offer Amount, Lead Submitted');
  }
  
  const submissions: Submission[] = [];
  const normalizationLog: { original: string; normalized: string }[] = [];
  let validISOCount = 0;
  let missingOfferAmount = 0;
  
  rows.forEach((row) => {
    const rawISO = row[mapping.iso] || '';
    const normalizedISO = normalizePartner(rawISO);
    
    if (rawISO && rawISO.toUpperCase().trim() !== normalizedISO) {
      normalizationLog.push({
        original: rawISO,
        normalized: normalizedISO
      });
    }
    
    if (normalizedISO !== 'UNKNOWN') {
      validISOCount++;
    }
    
    const offerAmount = parseCurrency(row[mapping.offerAmount] || '');
    if (!offerAmount || offerAmount === 0) {
      missingOfferAmount++;
    }
    
    const leadSubmitted = parseDate(row[mapping.leadSubmitted] || '') || new Date();
    const daysInPipeline = getDaysInPipeline(leadSubmitted);
    
    const submission: Submission = {
      name: row[mapping.name] || '',
      iso: rawISO,
      isoNormalized: normalizedISO,
      rep: row[mapping.rep] || '',
      stage: row[mapping.stage] || '',
      offerAmount,
      leadReceived: parseDate(row[mapping.leadReceived] || ''),
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
  
  return {
    submissions,
    dataQuality,
    normalizationLog
  };
}
