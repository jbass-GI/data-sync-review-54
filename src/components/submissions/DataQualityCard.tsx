import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Calendar, Building2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { DataQualityMetrics } from '@/types/submission';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DataQualityCardProps {
  dataQuality: DataQualityMetrics;
}

export function DataQualityCard({ dataQuality }: DataQualityCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate quality score
  const qualityScore = Math.round(
    ((dataQuality.validISOCount / dataQuality.totalRecords) * 40 +
    ((dataQuality.totalRecords - dataQuality.missingOfferAmount) / dataQuality.totalRecords) * 40 +
    20) // Base score for having data at all
  );
  
  const getStatusColor = (percent: number) => {
    if (percent >= 95) return 'text-green-600';
    if (percent >= 90) return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getStatusBadge = (score: number) => {
    if (score >= 95) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 90) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Needs Review' };
  };
  
  const statusBadge = getStatusBadge(qualityScore);
  const validISOPercent = dataQuality.validISOPercent;
  const validOfferPercent = ((dataQuality.totalRecords - dataQuality.missingOfferAmount) / dataQuality.totalRecords) * 100;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Data Quality Indicators</h3>
              <Badge variant={statusBadge.variant}>
                {qualityScore}% {statusBadge.label}
              </Badge>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
      
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Valid ISO metric */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Records with Valid ISO</div>
                <div className={`text-2xl font-bold ${getStatusColor(validISOPercent)}`}>
                  {dataQuality.validISOCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {dataQuality.totalRecords} ({validISOPercent.toFixed(1)}%)
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      validISOPercent >= 95 ? 'bg-green-600' : 
                      validISOPercent >= 90 ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${validISOPercent}%` }}
                  />
                </div>
              </div>
              
              {/* Valid Offer Amount metric */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Records with Offer Amount</div>
                <div className={`text-2xl font-bold ${getStatusColor(validOfferPercent)}`}>
                  {dataQuality.totalRecords - dataQuality.missingOfferAmount}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {dataQuality.totalRecords} ({validOfferPercent.toFixed(1)}%)
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      validOfferPercent >= 95 ? 'bg-green-600' : 
                      validOfferPercent >= 90 ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${validOfferPercent}%` }}
                  />
                </div>
              </div>
              
              {/* Date Range */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Date Range</div>
                </div>
                <div className="text-sm font-medium">
                  {dataQuality.earliestDate && format(dataQuality.earliestDate, 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground my-1">to</div>
                <div className="text-sm font-medium">
                  {dataQuality.latestDate && format(dataQuality.latestDate, 'MMM d, yyyy')}
                </div>
              </div>
              
              {/* Unique ISOs */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Unique ISOs Identified</div>
                </div>
                <div className="text-2xl font-bold text-foreground">{dataQuality.uniqueISOs}</div>
                <div className="flex items-center gap-1 mt-2">
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                  <div className="text-sm text-blue-600">
                    {dataQuality.normalizationsApplied} normalizations
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Identified ISOs:</div>
              <div className="flex flex-wrap gap-2">
                {dataQuality.isoList.map(iso => (
                  <Badge key={iso} variant="secondary">{iso}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
