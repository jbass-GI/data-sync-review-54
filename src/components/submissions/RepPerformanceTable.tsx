import { useState } from 'react';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConversionMetrics } from '@/types/funding';
import { RepPerformance } from '@/lib/repPerformance';

interface RepPerformanceTableProps {
  metrics: ConversionMetrics[];
  repPerformance: RepPerformance[];
  selectedISO?: string | null;
  onISOClick?: (iso: string) => void;
}

export function RepPerformanceTable({ 
  metrics, 
  repPerformance, 
  selectedISO,
  onISOClick 
}: RepPerformanceTableProps) {
  const [expandedISOs, setExpandedISOs] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (iso: string) => {
    const newExpanded = new Set(expandedISOs);
    if (newExpanded.has(iso)) {
      newExpanded.delete(iso);
    } else {
      newExpanded.add(iso);
    }
    setExpandedISOs(newExpanded);
  };
  
  const getRepsByISO = (iso: string) => {
    return repPerformance
      .filter(r => r.isoNormalized === iso)
      .sort((a, b) => b.overallConversionRate - a.overallConversionRate);
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
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">ISO & Rep Performance</h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">ISO / Rep</TableHead>
              <TableHead className="text-right">Subs</TableHead>
              <TableHead className="text-right">Funded</TableHead>
              <TableHead className="text-right">Conv %</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((iso) => {
              const isExpanded = expandedISOs.has(iso.iso);
              const reps = getRepsByISO(iso.iso);
              const hasReps = reps.length > 0;
              
              return (
                <>
                  {/* ISO Row */}
                  <TableRow 
                    className={`cursor-pointer hover:bg-muted/50 font-medium ${
                      selectedISO === iso.iso ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => {
                      if (hasReps) toggleExpanded(iso.iso);
                      onISOClick?.(iso.iso);
                    }}
                  >
                    <TableCell className="flex items-center gap-2">
                      {hasReps ? (
                        isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                      ) : (
                        <span className="w-4" />
                      )}
                      <span className={selectedISO === iso.iso ? 'text-primary font-semibold' : ''}>
                        {iso.iso}
                      </span>
                      {hasReps && (
                        <Badge variant="secondary" className="text-xs">
                          {reps.length} rep{reps.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{iso.totalSubmissions}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600">{iso.fundedCount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {getConversionBadge(iso.overallConversionRate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(iso.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                  
                  {/* Rep Rows */}
                  {isExpanded && reps.map((rep) => (
                    <TableRow 
                      key={`${rep.isoNormalized}-${rep.repName}`}
                      className="bg-muted/30"
                    >
                      <TableCell className="pl-12">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">└─</span>
                          <span className="text-sm">{rep.repName}</span>
                          {rep.rankWithinISO === 1 && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{rep.totalSubmissions}</TableCell>
                      <TableCell className="text-right text-sm">
                        <span className="text-green-600">{rep.fundedDeals}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {getConversionBadge(rep.overallConversionRate)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(rep.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={rep.rankWithinISO === 1 ? 'font-semibold text-yellow-600' : 'text-muted-foreground'}>
                          #{rep.rankWithinISO} of {rep.totalRepsInISO}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
