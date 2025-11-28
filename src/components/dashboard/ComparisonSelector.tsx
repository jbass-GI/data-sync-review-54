import { GitCompare, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComparisonType, PeriodOption } from '@/lib/periodComparison';

interface ComparisonSelectorProps {
  comparisonType: ComparisonType;
  onComparisonTypeChange: (type: ComparisonType) => void;
  currentLabel: string;
  comparisonLabel: string;
  isActive: boolean;
  availablePeriods: {
    months: PeriodOption[];
    quarters: PeriodOption[];
    years: PeriodOption[];
  };
  selectedCurrentPeriod: string | null;
  selectedComparisonPeriod: string | null;
  onCurrentPeriodChange: (value: string) => void;
  onComparisonPeriodChange: (value: string) => void;
}

export function ComparisonSelector({
  comparisonType,
  onComparisonTypeChange,
  currentLabel,
  comparisonLabel,
  isActive,
  availablePeriods,
  selectedCurrentPeriod,
  selectedComparisonPeriod,
  onCurrentPeriodChange,
  onComparisonPeriodChange
}: ComparisonSelectorProps) {
  if (!isActive) return null;

  const isCustomMode = comparisonType === 'custom';
  const allPeriods = [
    ...availablePeriods.months,
    ...availablePeriods.quarters,
    ...availablePeriods.years
  ];

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Top row: Comparison type and quick toggle */}
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
                <SelectItem value="custom">Custom Period Selection</SelectItem>
              </SelectContent>
            </Select>

            {!isCustomMode && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  Current: {currentLabel}
                </Badge>
                <span className="text-muted-foreground">vs</span>
                <Badge variant="secondary" className="gap-1">
                  Prior: {comparisonLabel}
                </Badge>
              </div>
            )}

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

          {/* Custom period selection row */}
          {isCustomMode && (
            <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Select periods to compare:</span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedCurrentPeriod || ''} onValueChange={onCurrentPeriodChange}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Current period" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-[300px]">
                    {availablePeriods.years.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Years</SelectLabel>
                        {availablePeriods.years.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {availablePeriods.quarters.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Quarters</SelectLabel>
                        {availablePeriods.quarters.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {availablePeriods.months.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Months</SelectLabel>
                        {availablePeriods.months.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground font-medium">vs</span>

                <Select value={selectedComparisonPeriod || ''} onValueChange={onComparisonPeriodChange}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Comparison period" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-[300px]">
                    {availablePeriods.years.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Years</SelectLabel>
                        {availablePeriods.years.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {availablePeriods.quarters.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Quarters</SelectLabel>
                        {availablePeriods.quarters.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {availablePeriods.months.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Months</SelectLabel>
                        {availablePeriods.months.map(period => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCurrentPeriod && selectedComparisonPeriod && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    {allPeriods.find(p => p.value === selectedCurrentPeriod)?.label || currentLabel}
                  </Badge>
                  <span className="text-muted-foreground">vs</span>
                  <Badge variant="secondary" className="gap-1">
                    {allPeriods.find(p => p.value === selectedComparisonPeriod)?.label || comparisonLabel}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
