import { useState } from 'react';
import { ISOMetrics } from '@/types/submission';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ISOSummaryTableProps {
  metrics: ISOMetrics[];
  onISOClick?: (iso: string) => void;
}

type SortField = 'iso' | 'totalSubmissions' | 'avgOfferAmount' | 'offersMade' | 'avgDaysInPipeline' | 'uniqueReps';
type SortDirection = 'asc' | 'desc';

export function ISOSummaryTable({ metrics, onISOClick }: ISOSummaryTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalSubmissions');
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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">ISO Performance Summary</h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('iso')} className="h-8 px-2">
                  ISO Partner
                  <SortIcon field="iso" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalSubmissions')} className="h-8 px-2">
                  Submissions
                  <SortIcon field="totalSubmissions" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('avgOfferAmount')} className="h-8 px-2">
                  Avg Offer
                  <SortIcon field="avgOfferAmount" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Min Offer</TableHead>
              <TableHead className="text-right">Max Offer</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('offersMade')} className="h-8 px-2">
                  Offers Made
                  <SortIcon field="offersMade" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('avgDaysInPipeline')} className="h-8 px-2">
                  Avg Days
                  <SortIcon field="avgDaysInPipeline" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('uniqueReps')} className="h-8 px-2">
                  Reps
                  <SortIcon field="uniqueReps" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.map((metric) => (
              <TableRow 
                key={metric.iso}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onISOClick?.(metric.iso)}
              >
                <TableCell className="font-medium">{metric.iso}</TableCell>
                <TableCell className="text-right">{metric.totalSubmissions}</TableCell>
                <TableCell className="text-right">{formatCurrency(metric.avgOfferAmount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(metric.minOffer)}</TableCell>
                <TableCell className="text-right">{formatCurrency(metric.maxOffer)}</TableCell>
                <TableCell className="text-right">{metric.offersMade}</TableCell>
                <TableCell className="text-right">{Math.round(metric.avgDaysInPipeline)}</TableCell>
                <TableCell className="text-right">{metric.uniqueReps}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
