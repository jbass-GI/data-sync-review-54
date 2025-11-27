import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { SubmissionFilters } from '@/lib/submissionFilters';

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<SubmissionFilters>) => void;
}

export function FilterPresets({ onApplyPreset }: FilterPresetsProps) {
  const presets = [
    {
      label: 'MTD',
      icon: Calendar,
      filters: { datePreset: 'mtd' }
    },
    {
      label: 'Large Deals (>$500K)',
      icon: DollarSign,
      filters: { offerSizeBuckets: ['$500K-$1M', '$1M+'] }
    },
    {
      label: 'Stale (>90 days)',
      icon: Clock,
      filters: { pipelineAgeBuckets: ['Stale 90+d'] }
    },
    {
      label: 'Offered/Funded',
      icon: TrendingUp,
      filters: { stages: ['Offered', 'Funded'] }
    }
  ];
  
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground mr-2 self-center">Quick Filters:</span>
      {presets.map((preset) => {
        const Icon = preset.icon;
        return (
          <Button
            key={preset.label}
            size="sm"
            variant="outline"
            onClick={() => onApplyPreset(preset.filters)}
            className="text-xs"
          >
            <Icon className="w-3 h-3 mr-1" />
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
