import { DashboardFilters } from '@/lib/filterUtils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import glazerLogo from '@/assets/glazer-logo.png';

interface MiniHeaderProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  isVisible: boolean;
}

export function MiniHeader({ filters, onFiltersChange, isVisible }: MiniHeaderProps) {
  const handleResetToMTD = () => {
    onFiltersChange({
      datePreset: 'mtd',
      dealType: 'all',
      partners: [],
      channelTypes: [],
      lifecycleTypes: [],
      ticketSizeBuckets: [],
      months: [],
      quarters: []
    });
  };

  const handleAllTime = () => {
    onFiltersChange({
      ...filters,
      datePreset: 'all',
    });
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img 
            src={glazerLogo} 
            alt="Glazer Investments" 
            className="h-12 w-auto logo-glow"
          />
          
          <div className="h-8 w-px bg-border/50" />

          {/* Streamlined Filters */}
          <div className="flex items-center gap-3 flex-1">
            {/* Date Range Quick Select */}
            <Select 
              value={filters.datePreset} 
              onValueChange={(value) => onFiltersChange({ ...filters, datePreset: value })}
            >
              <SelectTrigger className="w-[160px] h-9 bg-background/80">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[60]">
                <SelectItem value="mtd">Month-to-Date</SelectItem>
                <SelectItem value="ytd">Year-to-Date</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Deal Type Quick Select */}
            <Select 
              value={filters.dealType} 
              onValueChange={(value: 'all' | 'new' | 'renewal') => 
                onFiltersChange({ ...filters, dealType: value })
              }
            >
              <SelectTrigger className="w-[140px] h-9 bg-background/80">
                <SelectValue placeholder="Deal Type" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[60]">
                <SelectItem value="all">All Deals</SelectItem>
                <SelectItem value="new">New Only</SelectItem>
                <SelectItem value="renewal">Renewal Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetToMTD}
              className="h-9 bg-background/80 hover:bg-primary/10"
            >
              Reset to MTD
            </Button>
            <Button 
              variant={filters.datePreset === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={handleAllTime}
              className="h-9 bg-background/80 hover:bg-primary/10"
            >
              All Time
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
