import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PartnerMetrics } from '@/types/dashboard';
import { formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import { ArrowUpDown } from 'lucide-react';

interface PartnerTableProps {
  partners: PartnerMetrics[];
}

type SortField = 'partner' | 'totalFunded' | 'totalFees' | 'dealCount' | 'avgFeePercent';
type SortDirection = 'asc' | 'desc';

export function PartnerTable({ partners }: PartnerTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalFunded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPartners = [...partners].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Direct':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'Platform':
        return 'bg-accent/20 text-accent border-accent/30';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <h2 className="text-xl font-bold mb-4">Partner Performance</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('partner')}
              >
                <div className="flex items-center gap-2">
                  Partner
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Channel</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('totalFunded')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total Funded
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('totalFees')}
              >
                <div className="flex items-center justify-end gap-2">
                  Mgmt Fees
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('dealCount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Deals
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('avgFeePercent')}
              >
                <div className="flex items-center justify-end gap-2">
                  Avg Fee %
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">New/Renewal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPartners.map((partner) => (
              <TableRow key={partner.partner} className="border-border/30">
                <TableCell className="font-medium">{partner.partner}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getChannelColor(partner.channelType)}>
                    {partner.channelType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(partner.totalFunded)}
                </TableCell>
                <TableCell className="text-right text-primary font-semibold">
                  {formatCurrency(partner.totalFees)}
                </TableCell>
                <TableCell className="text-right">{partner.dealCount}</TableCell>
                <TableCell className="text-right">{formatPercent(partner.avgFeePercent)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {partner.newDealsCount}/{partner.renewalDealsCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
