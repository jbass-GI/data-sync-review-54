import { useState, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  X,
  GripVertical,
  Columns
} from 'lucide-react';
import { Deal } from '@/types/dashboard';
import { formatCurrency } from '@/lib/dashboardMetrics';
import { isDealTypeNew } from '@/lib/parseExcel';
import { format } from 'date-fns';
import { DashboardFilters } from '@/lib/filterUtils';
import { FilterBar } from './FilterBar';

interface DataViewerProps {
  deals: Deal[];
  allDeals: Deal[];
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  availablePartners: string[];
  availableMonths: string[];
  availableQuarters: string[];
  hasMTDData: boolean;
}

type SortField = 'dealName' | 'fundingDate' | 'fundedAmount' | 'mgmtFeeTotal' | 'feePercent' | 'partner' | 'dealType';
type SortDirection = 'asc' | 'desc';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200, 500];

type ColumnId = 'dealName' | 'fundingDate' | 'fundedAmount' | 'mgmtFeeTotal' | 'feePercent' | 'partner' | 'dealType' | 'notes';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  sortable: boolean;
  align: 'left' | 'right';
  sortField?: SortField;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'dealName', label: 'Deal Name', sortable: true, align: 'left', sortField: 'dealName' },
  { id: 'fundingDate', label: 'Funding Date', sortable: true, align: 'left', sortField: 'fundingDate' },
  { id: 'fundedAmount', label: 'Funded Amount', sortable: true, align: 'right', sortField: 'fundedAmount' },
  { id: 'mgmtFeeTotal', label: 'Mgmt Fee', sortable: true, align: 'right', sortField: 'mgmtFeeTotal' },
  { id: 'feePercent', label: 'Fee %', sortable: true, align: 'right', sortField: 'feePercent' },
  { id: 'partner', label: 'Partner', sortable: true, align: 'left', sortField: 'partner' },
  { id: 'dealType', label: 'Type', sortable: true, align: 'left', sortField: 'dealType' },
  { id: 'notes', label: 'Notes', sortable: false, align: 'left' },
];

export function DataViewer({ 
  deals, 
  allDeals,
  isOpen, 
  onClose,
  filters,
  onFiltersChange,
  availablePartners,
  availableMonths,
  availableQuarters,
  hasMTDData
}: DataViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('fundingDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<ColumnId | null>(null);

  // Calculate metrics from filtered deals (based on dashboard filters)
  const filteredMetrics = useMemo(() => {
    const totalFunded = deals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const totalFees = deals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0);
    const newDeals = deals.filter(d => isDealTypeNew(d.dealType));
    const renewalDeals = deals.filter(d => !isDealTypeNew(d.dealType));
    
    return {
      totalDeals: deals.length,
      totalFunded,
      totalFees,
      avgTicketSize: deals.length > 0 ? totalFunded / deals.length : 0,
      avgFeePercent: totalFunded > 0 ? (totalFees / totalFunded) * 100 : 0,
      newDealsCount: newDeals.length,
      renewalDealsCount: renewalDeals.length,
      newDealsFunded: newDeals.reduce((sum, d) => sum + d.fundedAmount, 0),
      renewalDealsFunded: renewalDeals.reduce((sum, d) => sum + d.fundedAmount, 0),
    };
  }, [deals]);

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

  const totalPages = Math.ceil(filteredAndSortedDeals.length / rowsPerPage);
  const paginatedDeals = filteredAndSortedDeals.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
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

  const handleDragStart = (columnId: ColumnId) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;
    
    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(c => c.id === draggedColumn);
    const targetIndex = newColumns.findIndex(c => c.id === targetColumnId);
    
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);
    setColumns(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const renderCellContent = (deal: Deal, columnId: ColumnId, isNew: boolean) => {
    switch (columnId) {
      case 'dealName':
        return <span className="font-medium max-w-[200px] truncate block" title={deal.dealName}>{deal.dealName}</span>;
      case 'fundingDate':
        return format(deal.fundingDate, 'MMM d, yyyy');
      case 'fundedAmount':
        return <span className="font-mono">{formatCurrency(deal.fundedAmount)}</span>;
      case 'mgmtFeeTotal':
        return <span className="font-mono">{formatCurrency(deal.mgmtFeeTotal)}</span>;
      case 'feePercent':
        return <span className="font-mono">{deal.feePercent.toFixed(2)}%</span>;
      case 'partner':
        return <span className="max-w-[150px] truncate block" title={deal.partner}>{deal.partner}</span>;
      case 'dealType':
        return (
          <Badge variant={isNew ? "default" : "secondary"} className="text-xs">
            {isNew ? 'New' : 'Renewal'}
          </Badge>
        );
      case 'notes':
        return <span className="max-w-[150px] truncate block text-muted-foreground text-sm" title={deal.notes || ''}>{deal.notes || '-'}</span>;
      default:
        return null;
    }
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

        {/* Dashboard Filters */}
        <div className="border-b border-border">
          <FilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            availablePartners={availablePartners}
            availableMonths={availableMonths}
            availableQuarters={availableQuarters}
            deals={allDeals}
            hasMTDData={hasMTDData}
          />
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
          <Button
            variant={isReorderMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className="gap-2"
          >
            <Columns className="h-4 w-4" />
            {isReorderMode ? 'Done Reordering' : 'Reorder Columns'}
          </Button>
          
          {/* Filtered Data Metrics */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-xs font-medium text-muted-foreground">Summary:</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-foreground">{filteredMetrics.totalDeals.toLocaleString()}</span>
              <span className="text-muted-foreground">deals</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-foreground">{formatCurrency(filteredMetrics.totalFunded)}</span>
              <span className="text-muted-foreground">funded</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-foreground">{formatCurrency(filteredMetrics.totalFees)}</span>
              <span className="text-muted-foreground">fees</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-primary">{filteredMetrics.newDealsCount.toLocaleString()}</span>
              <span className="text-muted-foreground">new</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono font-semibold text-secondary-foreground">{filteredMetrics.renewalDealsCount.toLocaleString()}</span>
              <span className="text-muted-foreground">renewal</span>
            </div>
          </div>
          
          <div className="flex-1" />
          
          {/* Filtered Stats */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Filtered: {formatCurrency(filteredAndSortedDeals.reduce((sum, d) => sum + d.fundedAmount, 0))}
            </Badge>
            <Badge variant="secondary">
              Fees: {formatCurrency(filteredAndSortedDeals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0))}
            </Badge>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={`
                      ${column.sortable && !isReorderMode ? 'cursor-pointer hover:bg-muted/50' : ''} 
                      ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                      ${draggedColumn === column.id ? 'opacity-50 bg-primary/10' : ''}
                      transition-colors
                    `}
                    draggable={isReorderMode}
                    onDragStart={() => isReorderMode && handleDragStart(column.id)}
                    onDragOver={(e) => isReorderMode && handleDragOver(e, column.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isReorderMode && column.sortable && column.sortField && handleSort(column.sortField)}
                  >
                    <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : ''}`}>
                      {isReorderMode && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                      {column.label}
                      {column.sortable && column.sortField && !isReorderMode && <SortIcon field={column.sortField} />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeals.map((deal, index) => {
                const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                const isNew = isDealTypeNew(deal.dealType);
                
                return (
                  <TableRow key={`${deal.dealName}-${deal.fundingDate.toISOString()}-${index}`} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {rowNumber}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.id} 
                        className={column.align === 'right' ? 'text-right' : ''}
                      >
                        {renderCellContent(deal, column.id, isNew)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredAndSortedDeals.length)} of {filteredAndSortedDeals.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROWS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
