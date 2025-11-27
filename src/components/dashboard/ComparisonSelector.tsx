import { GitCompare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComparisonType } from '@/lib/periodComparison';

interface ComparisonSelectorProps {
  comparisonType: ComparisonType;
  onComparisonTypeChange: (type: ComparisonType) => void;
  currentLabel: string;
  comparisonLabel: string;
  isActive: boolean;
}

export function ComparisonSelector({
  comparisonType,
  onComparisonTypeChange,
  currentLabel,
  comparisonLabel,
  isActive
}: ComparisonSelectorProps) {
  if (!isActive) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Period Comparison:</span>
          </div>

          <Select value={comparisonType} onValueChange={(value) => onComparisonTypeChange(value as ComparisonType)}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Select comparison type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="month-vs-month">Month vs Month</SelectItem>
              <SelectItem value="quarter-vs-quarter">Quarter vs Quarter</SelectItem>
              <SelectItem value="year-vs-year">Year vs Year</SelectItem>
              <SelectItem value="ytd-vs-ytd">YTD vs YTD</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              Current: {currentLabel}
            </Badge>
            <span className="text-muted-foreground">vs</span>
            <Badge variant="secondary" className="gap-1">
              Prior: {comparisonLabel}
            </Badge>
          </div>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComparisonTypeChange('none')}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Exit Comparison
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
