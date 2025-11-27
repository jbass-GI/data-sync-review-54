import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Calendar, Building2, RefreshCw } from 'lucide-react';
import { DataQualityMetrics } from '@/types/submission';
import { Badge } from '@/components/ui/badge';

interface DataQualityCardProps {
  dataQuality: DataQualityMetrics;
}

export function DataQualityCard({ dataQuality }: DataQualityCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        Data Quality Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <div className="text-2xl font-bold text-foreground">{dataQuality.totalRecords}</div>
          <div className="text-sm text-muted-foreground">Total Records</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-green-600">
            {dataQuality.validISOCount}
            <span className="text-sm ml-1">({dataQuality.validISOPercent.toFixed(1)}%)</span>
          </div>
          <div className="text-sm text-muted-foreground">Valid ISOs</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-amber-600">{dataQuality.missingOfferAmount}</div>
          <div className="text-sm text-muted-foreground">Missing Offers</div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">
            {dataQuality.earliestDate && format(dataQuality.earliestDate, 'MMM d, yyyy')}
          </div>
          <div className="text-xs text-muted-foreground">to</div>
          <div className="text-sm font-medium">
            {dataQuality.latestDate && format(dataQuality.latestDate, 'MMM d, yyyy')}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{dataQuality.uniqueISOs}</div>
          <div className="text-sm text-muted-foreground">Unique ISOs</div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 mb-1">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{dataQuality.normalizationsApplied}</div>
          <div className="text-sm text-muted-foreground">Normalizations</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm font-medium mb-2">Identified ISOs:</div>
        <div className="flex flex-wrap gap-2">
          {dataQuality.isoList.map(iso => (
            <Badge key={iso} variant="secondary">{iso}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
