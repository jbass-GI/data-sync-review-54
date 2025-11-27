import { useState } from 'react';
import { format } from 'date-fns';
import { ConversionMetrics } from '@/types/funding';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface ConversionTableProps {
  metrics: ConversionMetrics[];
  selectedISO: string | null;
  onISOClick?: (iso: string) => void;
}

type SortField = keyof ConversionMetrics;
type SortDirection = 'asc' | 'desc';

export function ConversionTable({ metrics, selectedISO, onISOClick }: ConversionTableProps) {
  const [sortField, setSortField] = useState<SortField>('overallConversionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return ((aVal as number) - (bVal as number)) * multiplier;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getConversionBadge = (rate: number) => {
    if (rate >= 20) return <Badge className="bg-green-600">{rate.toFixed(1)}%</Badge>;
    if (rate >= 12) return <Badge className="bg-amber-600">{rate.toFixed(1)}%</Badge>;
    return <Badge variant="destructive">{rate.toFixed(1)}%</Badge>;
  };

  const exportToCSV = () => {
    const headers = [
      'ISO', 'Submissions', 'Funded', 'Offered', 'Overall Conv %', 
      'Sub→Offer %', 'Offer→Fund %', 'Total Revenue', 'Avg Days to Fund',
      'Avg Offer', 'Avg Funded'
    ];
    const rows = sortedMetrics.map(m => [
      m.iso,
      m.totalSubmissions,
      m.fundedCount,
      m.offeredCount,
      m.overallConversionRate.toFixed(1),
      m.submissionToOfferRate.toFixed(1),
      m.offerToFundedRate.toFixed(1),
      m.totalRevenue,
      Math.round(m.avgDaysToFund),
      m.avgOfferAmount,
      m.avgFundedAmount
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversion-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Conversion metrics exported to CSV",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">ISO Conversion Performance</h3>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('iso')} className="h-8 px-2">
                  ISO
                  <SortIcon field="iso" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalSubmissions')} className="h-8 px-2">
                  Subs
                  <SortIcon field="totalSubmissions" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('fundedCount')} className="h-8 px-2">
                  Funded
                  <SortIcon field="fundedCount" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('overallConversionRate')} className="h-8 px-2">
                  Overall %
                  <SortIcon field="overallConversionRate" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('submissionToOfferRate')} className="h-8 px-2">
                  Sub→Offer %
                  <SortIcon field="submissionToOfferRate" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('offerToFundedRate')} className="h-8 px-2">
                  Offer→Fund %
                  <SortIcon field="offerToFundedRate" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalRevenue')} className="h-8 px-2">
                  Revenue
                  <SortIcon field="totalRevenue" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('avgDaysToFund')} className="h-8 px-2">
                  Days to Fund
                  <SortIcon field="avgDaysToFund" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.map((metric) => (
              <TableRow 
                key={metric.iso}
                className={`cursor-pointer transition-colors ${
                  selectedISO === metric.iso 
                    ? 'bg-primary/10 hover:bg-primary/15' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onISOClick?.(metric.iso)}
              >
                <TableCell className={`font-medium ${
                  selectedISO === metric.iso ? 'text-primary' : ''
                }`}>
                  {metric.iso}
                </TableCell>
                <TableCell className="text-right">{metric.totalSubmissions}</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-green-600">{metric.fundedCount}</span>
                </TableCell>
                <TableCell className="text-right">
                  {getConversionBadge(metric.overallConversionRate)}
                </TableCell>
                <TableCell className="text-right">
                  {metric.submissionToOfferRate.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  <span className={
                    metric.offerToFundedRate >= 30 ? 'text-green-600 font-semibold' :
                    metric.offerToFundedRate >= 20 ? 'text-amber-600' : 'text-red-600'
                  }>
                    {metric.offerToFundedRate.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(metric.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {Math.round(metric.avgDaysToFund)}d
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
