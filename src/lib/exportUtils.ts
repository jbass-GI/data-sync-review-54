import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Deal } from '@/types/dashboard';
import { PartnerMetrics, DashboardMetrics } from '@/types/dashboard';
import { formatCurrency, formatPercent } from './dashboardMetrics';
import { format } from 'date-fns';

/**
 * Export deals data to Excel
 */
export async function exportDealsToExcel(
  deals: Deal[],
  filename: string = 'glazer-investments-deals.xlsx'
) {
  // Prepare data for export
  const exportData = deals.map(deal => ({
    'Deal Name': deal.dealName,
    'Partner': deal.partner,
    'Partner (Normalized)': deal.partnerNormalized,
    'Funding Date': format(deal.fundingDate, 'MM/dd/yyyy'),
    'Funded Amount': deal.fundedAmount,
    'Fee %': deal.feePercent,
    'Management Fee': deal.mgmtFeeTotal,
    'Deal Type': deal.dealType,
    'Notes': deal.notes || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Deal Name
    { wch: 20 }, // Partner
    { wch: 20 }, // Partner Normalized
    { wch: 12 }, // Funding Date
    { wch: 15 }, // Funded Amount
    { wch: 8 },  // Fee %
    { wch: 15 }, // Management Fee
    { wch: 15 }, // Deal Type
    { wch: 30 }  // Notes
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Deals');

  // Generate and download file
  XLSX.writeFile(wb, filename);
}

/**
 * Export partner metrics to Excel
 */
export async function exportPartnerMetricsToExcel(
  partners: PartnerMetrics[],
  filename: string = 'glazer-investments-partner-metrics.xlsx'
) {
  const exportData = partners.map((partner, index) => ({
    'Rank': index + 1,
    'Partner': partner.partner,
    'Channel Type': partner.channelType,
    'Total Funded': partner.totalFunded,
    'Total Fees': partner.totalFees,
    'Deal Count': partner.dealCount,
    'Avg Ticket Size': partner.avgTicketSize,
    'Avg Fee %': partner.avgFeePercent,
    'New Deals': partner.newDealsCount,
    'Renewals': partner.renewalDealsCount
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 6 },  // Rank
    { wch: 20 }, // Partner
    { wch: 12 }, // Channel Type
    { wch: 15 }, // Total Funded
    { wch: 15 }, // Total Fees
    { wch: 12 }, // Deal Count
    { wch: 15 }, // Avg Ticket Size
    { wch: 10 }, // Avg Fee %
    { wch: 12 }, // New Deals
    { wch: 12 }  // Renewals
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Partner Metrics');
  XLSX.writeFile(wb, filename);
}

/**
 * Export comprehensive dashboard report to Excel
 */
export async function exportDashboardToExcel(
  deals: Deal[],
  partners: PartnerMetrics[],
  metrics: DashboardMetrics | null,
  filterDescription: string = 'All Data'
) {
  const wb = XLSX.utils.book_new();
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');

  // Summary Sheet
  if (metrics) {
    const summaryData = [
      ['Glazer Investments - MCA Production Dashboard'],
      ['Report Generated:', format(new Date(), 'MMMM dd, yyyy HH:mm')],
      ['Filter:', filterDescription],
      [''],
      ['Key Metrics'],
      ['Total Funded (MTD)', formatCurrency(metrics.totalFunded)],
      ['Management Fees', formatCurrency(metrics.totalFees)],
      ['Deal Count', metrics.dealCount],
      ['Average Ticket Size', formatCurrency(metrics.avgTicketSize)],
      ['Average Fee %', formatPercent(metrics.avgFeePercent)],
      ['Monthly Target', formatCurrency(metrics.monthlyTarget)],
      ['Target Progress', formatPercent(metrics.targetProgress)],
      [''],
      ['Deal Mix'],
      ['New Deals Funded', formatCurrency(metrics.newDealsFunded)],
      ['Renewal Deals Funded', formatCurrency(metrics.renewalDealsFunded)]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  // Partner Metrics Sheet
  const partnerData = partners.map((p, i) => ({
    'Rank': i + 1,
    'Partner': p.partner,
    'Channel': p.channelType,
    'Total Funded': p.totalFunded,
    'Fees': p.totalFees,
    'Deals': p.dealCount,
    'Avg Ticket': p.avgTicketSize,
    'Avg Fee %': p.avgFeePercent,
    'New': p.newDealsCount,
    'Renewals': p.renewalDealsCount
  }));

  const wsPartners = XLSX.utils.json_to_sheet(partnerData);
  wsPartners['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPartners, 'Partners');

  // Deals Sheet
  const dealsData = deals.map(deal => ({
    'Deal': deal.dealName,
    'Partner': deal.partnerNormalized,
    'Date': format(deal.fundingDate, 'MM/dd/yyyy'),
    'Amount': deal.fundedAmount,
    'Fee %': deal.feePercent,
    'Mgmt Fee': deal.mgmtFeeTotal,
    'Type': deal.dealType,
    'Notes': deal.notes || ''
  }));

  const wsDeals = XLSX.utils.json_to_sheet(dealsData);
  wsDeals['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
    { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDeals, 'Deals');

  XLSX.writeFile(wb, `glazer-investments-dashboard-${timestamp}.xlsx`);
}

/**
 * Export dashboard to PDF
 */
export async function exportDashboardToPDF(
  metrics: DashboardMetrics | null,
  partners: PartnerMetrics[],
  deals: Deal[],
  filterDescription: string = 'All Data',
  chartElements?: HTMLElement[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const timestamp = format(new Date(), 'MMMM dd, yyyy HH:mm');
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('Glazer Investments', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('MCA Production Dashboard', 15, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Report Generated: ${timestamp}`, 15, yPos);
  doc.text(`Filter: ${filterDescription}`, 15, yPos + 5);

  // Summary Metrics
  if (metrics) {
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Performance Metrics', 15, yPos);

    yPos += 8;
    const summaryData = [
      ['Total Funded (MTD)', formatCurrency(metrics.totalFunded)],
      ['Management Fees', formatCurrency(metrics.totalFees)],
      ['Deal Count', metrics.dealCount.toString()],
      ['Average Ticket Size', formatCurrency(metrics.avgTicketSize)],
      ['Average Fee %', formatPercent(metrics.avgFeePercent)],
      ['Monthly Target', formatCurrency(metrics.monthlyTarget)],
      ['Target Progress', formatPercent(metrics.targetProgress)],
      ['New Deals Funded', formatCurrency(metrics.newDealsFunded)],
      ['Renewal Deals Funded', formatCurrency(metrics.renewalDealsFunded)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Partner Metrics
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Partner Performance', 15, yPos);

  yPos += 8;
  const partnerData = partners.slice(0, 10).map((p, i) => [
    (i + 1).toString(),
    p.partner,
    p.channelType,
    formatCurrency(p.totalFunded),
    p.dealCount.toString(),
    formatCurrency(p.avgTicketSize),
    formatPercent(p.avgFeePercent, 2)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Partner', 'Channel', 'Total Funded', 'Deals', 'Avg Ticket', 'Avg Fee %']],
    body: partnerData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Add charts if provided
  if (chartElements && chartElements.length > 0) {
    for (let i = 0; i < chartElements.length; i++) {
      const element = chartElements[i];
      
      if (yPos > 200 || i > 0) {
        doc.addPage();
        yPos = 20;
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, Math.min(imgHeight, 150));
        yPos += Math.min(imgHeight, 150) + 10;
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }
  }

  // Deals Summary (last page)
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.text('Recent Deals', 15, yPos);

  yPos += 8;
  const recentDeals = deals.slice(0, 20).map(deal => [
    deal.dealName.substring(0, 30),
    deal.partnerNormalized,
    format(deal.fundingDate, 'MM/dd/yyyy'),
    formatCurrency(deal.fundedAmount),
    deal.dealType
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Deal', 'Partner', 'Date', 'Amount', 'Type']],
    body: recentDeals,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8 }
  });

  // Save PDF
  const pdfTimestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  doc.save(`glazer-investments-dashboard-${pdfTimestamp}.pdf`);
}

/**
 * Get filter description for export
 */
export function getFilterDescription(filters: any): string {
  const descriptions: string[] = [];

  if (filters.datePreset && filters.datePreset !== 'all') {
    descriptions.push(`Date: ${filters.datePreset.toUpperCase()}`);
  }

  if (filters.partners?.length > 0) {
    descriptions.push(`Partners: ${filters.partners.join(', ')}`);
  }

  if (filters.channelTypes?.length > 0) {
    descriptions.push(`Channels: ${filters.channelTypes.join(', ')}`);
  }

  if (filters.lifecycleTypes?.length > 0) {
    descriptions.push(`Lifecycle: ${filters.lifecycleTypes.join(', ')}`);
  }

  return descriptions.length > 0 ? descriptions.join(' | ') : 'All Data';
}
