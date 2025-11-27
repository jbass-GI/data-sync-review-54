import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger } from '@/components/ui/drawer';
import { X, Filter } from 'lucide-react';
import {
  SubmissionFilters,
  SUBMISSION_DATE_PRESETS,
  OFFER_SIZE_BUCKETS,
  PIPELINE_AGE_BUCKETS,
  STAGE_CATEGORIES
} from '@/lib/submissionFilters';

interface SubmissionFilterBarProps {
  filters: SubmissionFilters;
  onFiltersChange: (filters: SubmissionFilters) => void;
  availableISOs: string[];
  availableReps: string[];
}

export function SubmissionFilterBar({
  filters,
  onFiltersChange,
  availableISOs,
  availableReps
}: SubmissionFilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDatePresetChange = (value: string) => {
    onFiltersChange({ ...filters, datePreset: value });
  };

  const handleISOToggle = (iso: string) => {
    const newISOs = filters.isos.includes(iso)
      ? filters.isos.filter(i => i !== iso)
      : [...filters.isos, iso];
    onFiltersChange({ ...filters, isos: newISOs });
  };

  const handleStageToggle = (stage: string) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter(s => s !== stage)
      : [...filters.stages, stage];
    onFiltersChange({ ...filters, stages: newStages });
  };

  const handleOfferSizeToggle = (bucket: string) => {
    const newBuckets = filters.offerSizeBuckets.includes(bucket)
      ? filters.offerSizeBuckets.filter(b => b !== bucket)
      : [...filters.offerSizeBuckets, bucket];
    onFiltersChange({ ...filters, offerSizeBuckets: newBuckets });
  };

  const handlePipelineAgeToggle = (bucket: string) => {
    const newBuckets = filters.pipelineAgeBuckets.includes(bucket)
      ? filters.pipelineAgeBuckets.filter(b => b !== bucket)
      : [...filters.pipelineAgeBuckets, bucket];
    onFiltersChange({ ...filters, pipelineAgeBuckets: newBuckets });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      datePreset: 'all',
      isos: [],
      stages: [],
      offerSizeBuckets: [],
      pipelineAgeBuckets: [],
      reps: []
    });
  };

  const hasActiveFilters = 
    filters.datePreset !== 'all' ||
    filters.isos.length > 0 ||
    filters.stages.length > 0 ||
    filters.offerSizeBuckets.length > 0 ||
    filters.pipelineAgeBuckets.length > 0 ||
    filters.reps.length > 0;

  const FilterPanel = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Date Range</Label>
          <Select value={filters.datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBMISSION_DATE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ISO Partners */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            ISO Partners {filters.isos.length > 0 && `(${filters.isos.length}/${availableISOs.length})`}
          </Label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {availableISOs.map(iso => (
              <div key={iso} className="flex items-center space-x-2">
                <Checkbox
                  id={`iso-${iso}`}
                  checked={filters.isos.includes(iso)}
                  onCheckedChange={() => handleISOToggle(iso)}
                />
                <label htmlFor={`iso-${iso}`} className="text-sm cursor-pointer">
                  {iso}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Categories */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Stage</Label>
          <div className="space-y-2">
            {STAGE_CATEGORIES.map(stage => (
              <div key={stage} className="flex items-center space-x-2">
                <Checkbox
                  id={`stage-${stage}`}
                  checked={filters.stages.includes(stage)}
                  onCheckedChange={() => handleStageToggle(stage)}
                />
                <label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer">
                  {stage}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Offer Size */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Offer Size</Label>
          <div className="space-y-2">
            {OFFER_SIZE_BUCKETS.map(bucket => (
              <div key={bucket} className="flex items-center space-x-2">
                <Checkbox
                  id={`offer-${bucket}`}
                  checked={filters.offerSizeBuckets.includes(bucket)}
                  onCheckedChange={() => handleOfferSizeToggle(bucket)}
                />
                <label htmlFor={`offer-${bucket}`} className="text-sm cursor-pointer">
                  {bucket}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Age */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Pipeline Age</Label>
          <div className="space-y-2">
            {PIPELINE_AGE_BUCKETS.map(bucket => (
              <div key={bucket} className="flex items-center space-x-2">
                <Checkbox
                  id={`age-${bucket}`}
                  checked={filters.pipelineAgeBuckets.includes(bucket)}
                  onCheckedChange={() => handlePipelineAgeToggle(bucket)}
                />
                <label htmlFor={`age-${bucket}`} className="text-sm cursor-pointer">
                  {bucket}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
  
  return (
    <>
      {/* Desktop: Fixed sidebar */}
      <div className="hidden lg:block">
        <Card className="p-4">
          <FilterPanel />
        </Card>
      </div>
      
      {/* Mobile: Floating button + drawer */}
      <div className="lg:hidden">
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <Button 
              className="fixed bottom-4 right-4 z-50 shadow-lg"
              size="lg"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filter Submissions</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <FilterPanel />
            </div>
            <DrawerFooter>
              <Button onClick={() => setMobileOpen(false)}>Apply Filters</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
