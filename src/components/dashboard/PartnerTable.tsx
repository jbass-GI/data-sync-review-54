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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PartnerMetrics } from '@/types/dashboard';
import { formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import { ArrowUpDown, Merge, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PartnerTableProps {
  partners: PartnerMetrics[];
  partnerMerges: Map<string, string[]>;
  onPartnerMergesChange: (merges: Map<string, string[]>) => void;
}

type SortField = 'partner' | 'totalFunded' | 'totalFees' | 'dealCount' | 'avgFeePercent';
type SortDirection = 'asc' | 'desc';

export function PartnerTable({ partners, partnerMerges, onPartnerMergesChange }: PartnerTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalFunded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set());
  const [mergedName, setMergedName] = useState('');
  const { toast } = useToast();

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

  const handleTogglePartnerSelection = (partner: string) => {
    const newSelection = new Set(selectedPartners);
    if (newSelection.has(partner)) {
      newSelection.delete(partner);
    } else {
      newSelection.add(partner);
    }
    setSelectedPartners(newSelection);
  };

  const handleMergePartners = () => {
    if (selectedPartners.size < 2) {
      toast({
        title: "Select partners to merge",
        description: "Please select at least 2 partners to merge",
        variant: "destructive"
      });
      return;
    }

    if (!mergedName.trim()) {
      toast({
        title: "Enter merged name",
        description: "Please enter a name for the merged partner",
        variant: "destructive"
      });
      return;
    }

    const newMerges = new Map(partnerMerges);
    newMerges.set(mergedName.trim(), Array.from(selectedPartners));
    onPartnerMergesChange(newMerges);
    
    setMergeMode(false);
    setSelectedPartners(new Set());
    setMergedName('');
    
    toast({
      title: "Partners merged",
      description: `${selectedPartners.size} partners merged as "${mergedName.trim()}"`,
    });
  };

  const handleUnmerge = (mergedName: string) => {
    const newMerges = new Map(partnerMerges);
    newMerges.delete(mergedName);
    onPartnerMergesChange(newMerges);
    
    toast({
      title: "Partners unmerged",
      description: `"${mergedName}" has been split back into separate partners`,
    });
  };

  const handleCancelMerge = () => {
    setMergeMode(false);
    setSelectedPartners(new Set());
    setMergedName('');
  };

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

  const isMergedPartner = (partner: string) => {
    return partnerMerges.has(partner);
  };

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Partner Performance</h2>
        <div className="flex items-center gap-2">
          {partnerMerges.size > 0 && !mergeMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPartnerMergesChange(new Map());
                toast({
                  title: "All merges cleared",
                  description: "Partners have been unmerged",
                });
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear All Merges ({partnerMerges.size})
            </Button>
          )}
          {!mergeMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMergeMode(true)}
            >
              <Merge className="w-4 h-4 mr-1" />
              Merge Partners
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Merged partner name..."
                value={mergedName}
                onChange={(e) => setMergedName(e.target.value)}
                className="w-48"
              />
              <Button
                size="sm"
                onClick={handleMergePartners}
                disabled={selectedPartners.size < 2}
              >
                Merge ({selectedPartners.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelMerge}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              {mergeMode && (
                <TableHead className="w-12">
                  <div className="flex items-center justify-center">
                    Select
                  </div>
                </TableHead>
              )}
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
                {mergeMode && (
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedPartners.has(partner.partner)}
                        onCheckedChange={() => handleTogglePartnerSelection(partner.partner)}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {partner.partner}
                    {isMergedPartner(partner.partner) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <div className="p-1 rounded hover:bg-accent/50 cursor-pointer">
                                <Merge className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-destructive/10"
                                onClick={() => handleUnmerge(partner.partner)}
                              >
                                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold text-xs">Merged Partners:</p>
                              {partnerMerges.get(partner.partner)?.map((p, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground">
                                  • {p}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
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
