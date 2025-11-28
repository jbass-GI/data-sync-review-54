import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';
import { Deal } from '@/types/dashboard';
import { formatCurrency } from '@/lib/dashboardMetrics';
import { format } from 'date-fns';

interface DataViewerProps {
  deals: Deal[];
  isOpen: boolean;
  onClose: () => void;
}

type SortField = 'dealName' | 'fundingDate' | 'fundedAmount' | 'mgmtFeeTotal' | 'feePercent' | 'partner' | 'dealType';
type SortDirection = 'asc' | 'desc';

const ROWS_PER_PAGE = 50;

export function DataViewer({ deals, isOpen, onClose }: DataViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('fundingDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedDeals = useMemo(() => {
    let result = [...deals];

    // Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(deal =>
        deal.dealName.toLowerCase().includes(term) ||
        deal.partner.toLowerCase().includes(term) ||
        deal.dealType.toLowerCase().includes(term) ||
        deal.notes?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'dealName':
          comparison = a.dealName.localeCompare(b.dealName);
          break;
        case 'fundingDate':
          comparison = a.fundingDate.getTime() - b.fundingDate.getTime();
          break;
        case 'fundedAmount':
          comparison = a.fundedAmount - b.fundedAmount;
          break;
        case 'mgmtFeeTotal':
          comparison = a.mgmtFeeTotal - b.mgmtFeeTotal;
          break;
        case 'feePercent':
          comparison = a.feePercent - b.feePercent;
          break;
        case 'partner':
          comparison = a.partner.localeCompare(b.partner);
          break;
        case 'dealType':
          comparison = a.dealType.localeCompare(b.dealType);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [deals, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedDeals.length / ROWS_PER_PAGE);
  const paginatedDeals = filteredAndSortedDeals.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient">Data Viewer</h2>
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedDeals.length.toLocaleString()} of {deals.length.toLocaleString()} deals
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="p-4 border-b border-border bg-card/50 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals, partners, or notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Total Funded: {formatCurrency(filteredAndSortedDeals.reduce((sum, d) => sum + d.fundedAmount, 0))}
            </Badge>
            <Badge variant="secondary">
              Total Fees: {formatCurrency(filteredAndSortedDeals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0))}
            </Badge>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('dealName')}
                >
                  <div className="flex items-center gap-2">
                    Deal Name
                    <SortIcon field="dealName" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('fundingDate')}
                >
                  <div className="flex items-center gap-2">
                    Funding Date
                    <SortIcon field="fundingDate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  onClick={() => handleSort('fundedAmount')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    Funded Amount
                    <SortIcon field="fundedAmount" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  onClick={() => handleSort('mgmtFeeTotal')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    Mgmt Fee
                    <SortIcon field="mgmtFeeTotal" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  onClick={() => handleSort('feePercent')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    Fee %
                    <SortIcon field="feePercent" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('partner')}
                >
                  <div className="flex items-center gap-2">
                    Partner
                    <SortIcon field="partner" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('dealType')}
                >
                  <div className="flex items-center gap-2">
                    Type
                    <SortIcon field="dealType" />
                  </div>
                </TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeals.map((deal, index) => {
                const rowNumber = (currentPage - 1) * ROWS_PER_PAGE + index + 1;
                const isNew = deal.dealType.toLowerCase().includes('new') || deal.dealType.toLowerCase() === 'n';
                
                return (
                  <TableRow key={`${deal.dealName}-${deal.fundingDate.toISOString()}-${index}`} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={deal.dealName}>
                      {deal.dealName}
                    </TableCell>
                    <TableCell>
                      {format(deal.fundingDate, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(deal.fundedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(deal.mgmtFeeTotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {deal.feePercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={deal.partner}>
                      {deal.partner}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isNew ? "default" : "secondary"} className="text-xs">
                        {isNew ? 'New' : 'Renewal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm" title={deal.notes || ''}>
                      {deal.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-card">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} - {Math.min(currentPage * ROWS_PER_PAGE, filteredAndSortedDeals.length)} of {filteredAndSortedDeals.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
