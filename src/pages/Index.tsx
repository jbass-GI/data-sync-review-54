import { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, FileText, Percent, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PartnerTable } from '@/components/dashboard/PartnerTable';
import { DealTypeChart } from '@/components/dashboard/DealTypeChart';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { DataUploadOptions } from '@/components/dashboard/DataUploadOptions';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MiniHeader } from '@/components/dashboard/MiniHeader';
import { ComparisonSelector } from '@/components/dashboard/ComparisonSelector';
import { MTDTracking } from '@/components/dashboard/MTDTracking';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { PartnerComparison } from '@/components/dashboard/PartnerComparison';
import { ExportMenu } from '@/components/dashboard/ExportMenu';
import { parseExcelFile } from '@/lib/parseExcel';
import { loadDefaultFundingData } from '@/lib/loadDefaultData';
import { calculateDashboardMetrics, calculatePartnerMetrics, formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import { applyFilters, getFilterOptions, DashboardFilters, getDateRangeFromPreset, getFilterDisplayLabels } from '@/lib/filterUtils';
import { calculateMTDMetrics } from '@/lib/mtdProjections';
import { calculateWeeklyTrends, calculateMonthlyTrends } from '@/lib/trendAnalysis';
import { comparePeriods, getComparisonPeriods, ComparisonType } from '@/lib/periodComparison';
import { Deal, PartnerMetrics } from '@/types/dashboard';
import { Submission, DataQualityMetrics, ISOMetrics } from '@/types/submission';
import { FundingRecord } from '@/types/funding';
import { applySubmissionFilters, SubmissionFilters, getFilterOptions as getSubmissionFilterOptions } from '@/lib/submissionFilters';
import { calculateISOMetrics, getTopISOsByVolume, getSubmissionTimeline } from '@/lib/isoMetrics';
import { matchSubmissionsToFunding } from '@/lib/fundingMatcher';
import { enrichSubmissionsWithFunding, calculateConversionMetrics, calculateOverallStats, EnrichedSubmission } from '@/lib/conversionMetrics';
import { calculateRepPerformance, RepPerformance } from '@/lib/repPerformance';
import { calculateMonthlyTrends as calculateISOMonthlyTrends, MonthlyTrend } from '@/lib/trendAnalysisISO';
import { calculateAllQualityScores, generatePerformanceAlerts, ISOQualityScore, PerformanceAlert } from '@/lib/qualityScore';
import { SubmissionUpload } from '@/components/submissions/SubmissionUpload';
import { GoogleSheetSync } from '@/components/submissions/GoogleSheetSync';
import { DataQualityCard } from '@/components/submissions/DataQualityCard';
import { ISOSummaryTable } from '@/components/submissions/ISOSummaryTable';
import { SubmissionVolumeChart } from '@/components/submissions/SubmissionVolumeChart';
import { AvgOfferSizeChart } from '@/components/submissions/AvgOfferSizeChart';
import { SubmissionTimelineChart } from '@/components/submissions/SubmissionTimelineChart';
import { SubmissionFilterBar } from '@/components/submissions/SubmissionFilterBar';
import { NormalizationLog } from '@/components/submissions/NormalizationLog';
import { FilterPresets } from '@/components/submissions/FilterPresets';
import { FundingUpload } from '@/components/submissions/FundingUpload';
import { UnmatchedReview } from '@/components/submissions/UnmatchedReview';
import { ConversionTable } from '@/components/submissions/ConversionTable';
import { ConversionFunnel } from '@/components/submissions/ConversionFunnel';
import { EfficiencyScatter } from '@/components/submissions/EfficiencyScatter';
import { RepPerformanceTable } from '@/components/submissions/RepPerformanceTable';
import { RepLeaderboard } from '@/components/submissions/RepLeaderboard';
import { ConversionTrendChart } from '@/components/submissions/ConversionTrendChart';
import { QualityScoreCard } from '@/components/submissions/QualityScoreCard';
import { QualityScoreGrid } from '@/components/submissions/QualityScoreGrid';
import { PerformanceAlerts } from '@/components/submissions/PerformanceAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import glazerLogo from '@/assets/glazer-logo.png';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'fundings' | 'submissions'>('fundings');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fundingRecords, setFundingRecords] = useState<FundingRecord[]>([]);
  const [enrichedSubmissions, setEnrichedSubmissions] = useState<EnrichedSubmission[]>([]);
  const [unmatchedSubmissions, setUnmatchedSubmissions] = useState<Submission[]>([]);
  const [manualMatches, setManualMatches] = useState<Map<string, string | null>>(new Map());
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics | null>(null);
  const [normalizationLog, setNormalizationLog] = useState<{ original: string; normalized: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check if there's MTD data
  const hasMTDData = useMemo(() => {
    if (deals.length === 0) return false;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return deals.some(deal => deal.fundingDate >= monthStart && deal.fundingDate <= now);
  }, [deals]);
  
  const [filters, setFilters] = useState<DashboardFilters>({
    datePreset: 'mtd', // Will be updated when deals load if no MTD data
    dealType: 'all',
    partners: [],
    channelTypes: [],
    lifecycleTypes: [],
    ticketSizeBuckets: [],
    months: [],
    quarters: []
  });
  const [partnerMerges, setPartnerMerges] = useState<Map<string, string[]>>(new Map());
  const [showMiniHeader, setShowMiniHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  const isComparisonActive = comparisonType !== 'none';
  
  // Submission filters
  const [submissionFilters, setSubmissionFilters] = useState<SubmissionFilters>({
    datePreset: 'all',
    isos: [],
    stages: [],
    offerSizeBuckets: [],
    pipelineAgeBuckets: [],
    reps: []
  });
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  
  const handleISOClick = (iso: string) => {
    setSelectedISO(selectedISO === iso ? null : iso);
  };
  
  const handleApplyFilterPreset = (preset: Partial<SubmissionFilters>) => {
    setSubmissionFilters(prev => ({
      ...prev,
      ...preset
    }));
  };

  // Scroll detection for mini header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = 200; // Approximate height of main header

      // Show mini header when scrolled past main header and scrolling down
      if (currentScrollY > headerHeight) {
        setShowMiniHeader(true);
      } else {
        setShowMiniHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auto-load default funding data on mount
  useEffect(() => {
    const loadDefaultData = async () => {
      setIsLoading(true);
      try {
        const defaultDeals = await loadDefaultFundingData();
        if (defaultDeals.length > 0) {
          setDeals(defaultDeals);
          
          // Check if data has MTD deals
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const hasMTD = defaultDeals.some(deal => deal.fundingDate >= monthStart && deal.fundingDate <= now);
          
          setFilters(prev => ({
            ...prev,
            datePreset: hasMTD ? 'mtd' : 'all'
          }));
          
          toast({
            title: "Data loaded",
            description: `Loaded ${defaultDeals.length} deals from tracker`,
          });
        }
      } catch (error) {
        console.error('Failed to load default data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDefaultData();
  }, []);

  const handleFileUpload = async (file: File, mode: 'replace' | 'append' = 'replace') => {
    setIsLoading(true);
    try {
      const parsedDeals = await parseExcelFile(file);
      
      if (mode === 'append') {
        // Merge new deals with existing deals
        // Create a Set of existing deal identifiers to avoid duplicates
        const existingDealIds = new Set(
          deals.map(d => `${d.dealName}-${d.fundingDate.toISOString()}-${d.partner}`)
        );
        
        // Filter out duplicates and add new deals
        const newUniqueDeals = parsedDeals.filter(
          d => !existingDealIds.has(`${d.dealName}-${d.fundingDate.toISOString()}-${d.partner}`)
        );
        
        const duplicatesCount = parsedDeals.length - newUniqueDeals.length;
        setDeals([...deals, ...newUniqueDeals]);
        
        // Show success message with details
        toast({
          title: "Data merged successfully",
          description: `Added ${newUniqueDeals.length} new deals${duplicatesCount > 0 ? ` (${duplicatesCount} duplicates skipped)` : ''}`,
        });
      } else {
        // Replace all data
        setDeals(parsedDeals);
        
        // Check if new data has MTD deals
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const hasMTD = parsedDeals.some(deal => deal.fundingDate >= monthStart && deal.fundingDate <= now);
        
        // Reset filters - use MTD if available, otherwise all time
        setFilters({
          datePreset: hasMTD ? 'mtd' : 'all',
          dealType: 'all',
          partners: [],
          channelTypes: [],
          lifecycleTypes: [],
          ticketSizeBuckets: [],
          months: [],
          quarters: []
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get filter options from available data
  const filterOptions = useMemo(() => getFilterOptions(deals), [deals]);

  // Apply all filters
  const filteredDeals = useMemo(() => applyFilters(deals, filters), [deals, filters]);

  // Get date range for metrics calculation
  const dateRangeForMetrics = useMemo(() => {
    if (filters.datePreset === 'custom' && filters.customDateRange) {
      return filters.customDateRange;
    } else if (filters.datePreset !== 'all') {
      return getDateRangeFromPreset(filters.datePreset, deals);
    }
    return undefined;
  }, [filters, deals]);

  const metrics = filteredDeals.length > 0 ? calculateDashboardMetrics(filteredDeals, dateRangeForMetrics) : null;
  
  // Calculate partner metrics and apply merges
  const rawPartnerMetrics = filteredDeals.length > 0 ? calculatePartnerMetrics(filteredDeals) : [];
  const partnerMetrics = useMemo(() => {
    if (partnerMerges.size === 0) return rawPartnerMetrics;
    
    const mergedMetrics: PartnerMetrics[] = [];
    const processedPartners = new Set<string>();
    
    // First, create all merged partners
    partnerMerges.forEach((partnerNames, mergedName) => {
      const partnersToMerge = rawPartnerMetrics.filter(m => partnerNames.includes(m.partner));
      
      if (partnersToMerge.length === 0) return;
      
      // Mark all individual partners as processed
      partnerNames.forEach(name => processedPartners.add(name));
      
      // Create merged partner
      const merged: PartnerMetrics = {
        partner: mergedName,
        channelType: partnersToMerge[0].channelType,
        totalFunded: partnersToMerge.reduce((sum, p) => sum + p.totalFunded, 0),
        totalFees: partnersToMerge.reduce((sum, p) => sum + p.totalFees, 0),
        dealCount: partnersToMerge.reduce((sum, p) => sum + p.dealCount, 0),
        avgTicketSize: 0,
        avgFeePercent: 0,
        newDealsCount: partnersToMerge.reduce((sum, p) => sum + p.newDealsCount, 0),
        renewalDealsCount: partnersToMerge.reduce((sum, p) => sum + p.renewalDealsCount, 0),
        consistencyScore: Math.round(partnersToMerge.reduce((sum, p) => sum + (p.consistencyScore || 0), 0) / partnersToMerge.length),
        consecutiveBusinessDays: Math.max(...partnersToMerge.map(p => p.consecutiveBusinessDays || 0)),
        consecutiveNewDeals: Math.max(...partnersToMerge.map(p => p.consecutiveNewDeals || 0)),
        consecutiveRenewalDeals: Math.max(...partnersToMerge.map(p => p.consecutiveRenewalDeals || 0)),
        daysWithMultipleDeals: partnersToMerge.reduce((sum, p) => sum + (p.daysWithMultipleDeals || 0), 0),
        maxDealsInDay: Math.max(...partnersToMerge.map(p => p.maxDealsInDay || 0))
      };
      
      // Recalculate averages
      merged.avgTicketSize = merged.totalFunded / merged.dealCount;
      merged.avgFeePercent = (merged.totalFees / merged.totalFunded) * 100;
      
      mergedMetrics.push(merged);
    });
    
    // Then add all non-merged partners
    rawPartnerMetrics.forEach(metric => {
      if (!processedPartners.has(metric.partner)) {
        mergedMetrics.push(metric);
      }
    });
    
    // Sort by total funded
    return mergedMetrics.sort((a, b) => b.totalFunded - a.totalFunded);
  }, [rawPartnerMetrics, partnerMerges]);
  
  // Get display labels based on current filter
  const displayLabels = getFilterDisplayLabels(filters.datePreset);
  
  // Calculate MTD projections (only when viewing MTD or all data)
  const mtdMetrics = deals.length > 0 && (filters.datePreset === 'mtd' || filters.datePreset === 'all')
    ? calculateMTDMetrics(deals)
    : null;

  // Calculate trend data for charts
  const weeklyTrends = useMemo(() => calculateWeeklyTrends(filteredDeals), [filteredDeals]);
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(filteredDeals), [filteredDeals]);

  // Period comparison
  const comparisonConfig = useMemo(() => 
    getComparisonPeriods(comparisonType, new Date()),
    [comparisonType]
  );

  const comparisonResult = useMemo(() => {
    if (!comparisonConfig) return null;
    return comparePeriods(deals, comparisonConfig);
  }, [deals, comparisonConfig]);

  const handleComparisonToggle = () => {
    if (comparisonType === 'none') {
      setComparisonType('ytd-vs-ytd');
    } else {
      setComparisonType('none');
    }
  };
  
  // Submission data handlers
  const handleSubmissionDataLoaded = (
    subs: Submission[],
    quality: DataQualityMetrics,
    log: { original: string; normalized: string }[]
  ) => {
    setSubmissions(subs);
    setDataQuality(quality);
    setNormalizationLog(log);
    
    // If funding data exists, automatically rematch
    if (fundingRecords.length > 0) {
      performMatching(subs, fundingRecords);
    }
  };
  
  const handleFundingDataLoaded = (funding: FundingRecord[]) => {
    setFundingRecords(funding);
    
    // If submissions exist, automatically match
    if (submissions.length > 0) {
      performMatching(submissions, funding);
    }
    
    toast({
      title: "Funding data loaded",
      description: `${funding.length} funding records ready for matching`,
    });
  };
  
  const performMatching = (subs: Submission[], funding: FundingRecord[]) => {
    const matchResult = matchSubmissionsToFunding(subs, funding);
    
    // Apply manual matches if any exist
    const manuallyMatched = matchResult.matched.map(m => {
      const manualMatch = manualMatches.get(m.submission.name);
      if (manualMatch) {
        const fundingRecord = funding.find(f => f.dealName === manualMatch);
        if (fundingRecord) {
          return { submission: m.submission, funding: fundingRecord };
        }
      }
      return m;
    });
    
    const enriched = enrichSubmissionsWithFunding(subs, manuallyMatched);
    setEnrichedSubmissions(enriched);
    setUnmatchedSubmissions(matchResult.unmatched);
    
    toast({
      title: "Matching complete",
      description: `${manuallyMatched.length} submissions matched to funding, ${matchResult.unmatched.length} unmatched`,
    });
  };
  
  const handleManualMatch = (submissionName: string, fundingDealName: string | null) => {
    const newMatches = new Map(manualMatches);
    newMatches.set(submissionName, fundingDealName);
    setManualMatches(newMatches);
    
    // Rematch with new manual matches
    if (submissions.length > 0 && fundingRecords.length > 0) {
      performMatching(submissions, fundingRecords);
    }
  };
  
  // Calculate submission/conversion metrics
  const hasFundingData = fundingRecords.length > 0 && enrichedSubmissions.length > 0;
  
  const filteredSubmissions = useMemo(() => 
    applySubmissionFilters(hasFundingData ? enrichedSubmissions : submissions, submissionFilters),
    [submissions, enrichedSubmissions, submissionFilters, hasFundingData]
  );
  
  const isoMetrics = useMemo(() => 
    calculateISOMetrics(filteredSubmissions),
    [filteredSubmissions]
  );
  
  const conversionMetrics = useMemo(() => 
    hasFundingData ? calculateConversionMetrics(filteredSubmissions as EnrichedSubmission[]) : [],
    [filteredSubmissions, hasFundingData]
  );
  
  const overallConversionStats = useMemo(() => 
    hasFundingData ? calculateOverallStats(filteredSubmissions as EnrichedSubmission[]) : null,
    [filteredSubmissions, hasFundingData]
  );
  
  const topISOs = useMemo(() => 
    hasFundingData 
      ? conversionMetrics.slice(0, 5).map(m => m.iso)
      : getTopISOsByVolume(isoMetrics, 5).map(m => m.iso),
    [isoMetrics, conversionMetrics, hasFundingData]
  );
  
  const submissionTimelineData = useMemo(() => 
    getSubmissionTimeline(filteredSubmissions, topISOs),
    [filteredSubmissions, topISOs]
  );
  
  const submissionFilterOptions = useMemo(() => 
    getSubmissionFilterOptions(submissions),
    [submissions]
  );
  
  // Calculate summary stats for submissions
  const submissionSummaryStats = useMemo(() => {
    if (filteredSubmissions.length === 0) return null;
    
    const totalSubs = filteredSubmissions.length;
    const avgOffer = filteredSubmissions.reduce((sum, s) => sum + s.offerAmount, 0) / totalSubs;
    const offersMade = filteredSubmissions.filter(s => s.stageCategory === 'Offered' || s.stageCategory === 'Funded').length;
    const avgDays = filteredSubmissions.reduce((sum, s) => sum + s.daysInPipeline, 0) / totalSubs;
    
    return {
      totalSubmissions: totalSubs,
      avgOffer: Math.round(avgOffer),
      offersMade,
      avgPipeline: Math.round(avgDays)
    };
  }, [filteredSubmissions]);
  
  // Phase 3: Advanced analytics (only with funding data)
  const repPerformance = useMemo(() => 
    hasFundingData ? calculateRepPerformance(filteredSubmissions as EnrichedSubmission[]) : [],
    [filteredSubmissions, hasFundingData]
  );
  
  const isoMonthlyTrends = useMemo(() => 
    hasFundingData ? calculateISOMonthlyTrends(enrichedSubmissions) : [],
    [enrichedSubmissions, hasFundingData]
  );
  
  const qualityScores = useMemo(() => 
    hasFundingData && conversionMetrics.length > 0 
      ? calculateAllQualityScores(conversionMetrics, isoMonthlyTrends)
      : [],
    [conversionMetrics, isoMonthlyTrends, hasFundingData]
  );
  
  const performanceAlerts = useMemo(() => 
    hasFundingData && conversionMetrics.length > 0
      ? generatePerformanceAlerts(conversionMetrics, qualityScores, isoMonthlyTrends)
      : [],
    [conversionMetrics, qualityScores, isoMonthlyTrends, hasFundingData]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mini Header */}
      {deals.length > 0 && (
        <MiniHeader 
          filters={filters}
          onFiltersChange={setFilters}
          isVisible={showMiniHeader}
          hasMTDData={hasMTDData}
        />
      )}

      {/* Header */}
      <header className="border-b border-border/50 bg-gradient-to-r from-card via-card to-card/80 backdrop-blur relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="container mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={glazerLogo} 
                alt="Glazer Investments" 
                className="h-20 w-auto logo-glow transition-all duration-300 hover:scale-105"
              />
              <div className="border-l-2 border-gradient pl-6">
                <h1 className="text-2xl font-bold text-gradient mb-1">
                  MCA Production Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time Performance Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {deals.length > 0 && (
                <ExportMenu 
                  deals={filteredDeals}
                  partners={partnerMetrics}
                  metrics={metrics}
                  filters={filters}
                />
              )}
              <div className="text-right border-l border-border/50 pl-4">
                <p className="text-sm font-medium text-foreground">January 2025</p>
                <p className="text-xs text-accent mt-1 flex items-center justify-end gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
                  Live Updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      {deals.length > 0 && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availablePartners={filterOptions.partners}
          availableMonths={filterOptions.months}
          availableQuarters={filterOptions.quarters}
          deals={deals}
          onComparisonToggle={handleComparisonToggle}
          isComparisonActive={isComparisonActive}
          hasMTDData={hasMTDData}
        />
      )}

      {/* Comparison Selector */}
      {deals.length > 0 && comparisonConfig && (
        <div className="container mx-auto px-6 pt-4">
          <ComparisonSelector
            comparisonType={comparisonType}
            onComparisonTypeChange={setComparisonType}
            currentLabel={comparisonConfig.currentPeriod.label}
            comparisonLabel={comparisonConfig.comparisonPeriod.label}
            isActive={isComparisonActive}
          />
        </div>
      )}

      <main className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fundings' | 'submissions')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="fundings">Fundings Dashboard</TabsTrigger>
            <TabsTrigger value="submissions">ISO Submissions</TabsTrigger>
          </TabsList>
          
          {/* Fundings Tab */}
          <TabsContent value="fundings">
        {!deals.length ? (
          <div className="max-w-2xl mx-auto mt-12">
            <FileUpload onFileUpload={handleFileUpload} />
            <p className="text-center text-muted-foreground mt-6 text-sm">
              Upload your Excel file to view production analytics and partner performance
            </p>
          </div>
        ) : !filteredDeals.length || !metrics ? (
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No deals match your filters</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or clearing them to see more data
              </p>
              <button
                onClick={() => {
                  const hasMTD = deals.some(deal => {
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return deal.fundingDate >= monthStart && deal.fundingDate <= now;
                  });
                  setFilters({
                    datePreset: hasMTD ? 'mtd' : 'all',
                    dealType: 'all',
                    partners: [],
                    channelTypes: [],
                    lifecycleTypes: [],
                    ticketSizeBuckets: [],
                    months: [],
                    quarters: []
                  });
                  setPartnerMerges(new Map());
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reset Filters
              </button>
            </div>
            <div className="mt-8">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* MTD Tracking & Projections - Hide in comparison mode */}
            {mtdMetrics && !isComparisonActive && (
              <MTDTracking metrics={mtdMetrics} />
            )}

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title={isComparisonActive ? `${comparisonConfig?.currentPeriod.label} Funded` : displayLabels.fundedLabel}
                value={formatCurrency(metrics!.totalFunded)}
                icon={DollarSign}
                trend={comparisonResult && comparisonResult.percentChanges.totalFunded >= 0 ? "up" : "down"}
                trendValue={
                  comparisonResult 
                    ? `${comparisonResult.percentChanges.totalFunded >= 0 ? '+' : ''}${comparisonResult.percentChanges.totalFunded.toFixed(1)}% vs ${comparisonConfig?.comparisonPeriod.label}`
                    : `${metrics!.dealCount} deals`
                }
                comparisonValue={comparisonResult ? formatCurrency(comparisonResult.comparison.totalFunded) : undefined}
              />
              <MetricCard
                title="Management Fees"
                value={formatCurrency(metrics!.totalFees)}
                subValue={isComparisonActive && comparisonResult 
                  ? `${comparisonResult.percentChanges.totalFees >= 0 ? '+' : ''}${comparisonResult.percentChanges.totalFees.toFixed(1)}%`
                  : `Avg ${formatPercent(metrics!.avgFeePercent)}`
                }
                icon={Percent}
                trend={comparisonResult && comparisonResult.percentChanges.totalFees >= 0 ? "up" : "down"}
                comparisonValue={comparisonResult ? formatCurrency(comparisonResult.comparison.totalFees) : undefined}
              />
              <MetricCard
                title="Average Ticket Size"
                value={formatCurrency(metrics!.avgTicketSize)}
                icon={TrendingUp}
                trend={comparisonResult && comparisonResult.percentChanges.avgTicketSize >= 0 ? "up" : "down"}
                trendValue={comparisonResult 
                  ? `${comparisonResult.percentChanges.avgTicketSize >= 0 ? '+' : ''}${comparisonResult.percentChanges.avgTicketSize.toFixed(1)}%`
                  : undefined
                }
                comparisonValue={comparisonResult ? formatCurrency(comparisonResult.comparison.avgTicketSize) : undefined}
              />
              <MetricCard
                title="Total Deals"
                value={metrics!.dealCount.toString()}
                subValue={isComparisonActive && comparisonResult
                  ? `${comparisonResult.percentChanges.dealCount >= 0 ? '+' : ''}${comparisonResult.percentChanges.dealCount.toFixed(1)}%`
                  : displayLabels.dealsLabel
                }
                icon={comparisonResult && comparisonResult.percentChanges.dealCount >= 0 ? FileText : TrendingDown}
                comparisonValue={comparisonResult ? comparisonResult.comparison.dealCount.toString() : undefined}
              />
            </div>

            {/* Progress Bar - Hide in comparison mode */}
            {!isComparisonActive && (
              <ProgressBar
                title={displayLabels.targetLabel}
                current={formatCurrency(metrics!.totalFunded)}
                target={formatCurrency(metrics!.monthlyTarget)}
                percentage={metrics!.targetProgress}
              />
            )}

            {/* Deal Type Mix */}
            <DealTypeChart
              newDealsFunded={metrics!.newDealsFunded}
              renewalDealsFunded={metrics!.renewalDealsFunded}
            />

            {/* Trend Charts */}
            {(weeklyTrends.length > 0 || monthlyTrends.length > 0) && (
              <TrendCharts
                weeklyTrends={weeklyTrends}
                monthlyTrends={monthlyTrends}
              />
            )}

            {/* Partner Table */}
            <PartnerTable 
              partners={partnerMetrics} 
              partnerMerges={partnerMerges}
              onPartnerMergesChange={setPartnerMerges}
            />

            {/* Partner Comparison */}
            {partnerMetrics.length >= 2 && (
              <PartnerComparison 
                partners={partnerMetrics}
                partnerMerges={partnerMerges}
              />
            )}

            {/* Upload Options */}
            <div className="pt-4">
              <DataUploadOptions 
                onFileUpload={handleFileUpload}
                hasExistingData={deals.length > 0}
              />
            </div>
          </div>
        )}
          </TabsContent>
          
          {/* Submissions Tab */}
          <TabsContent value="submissions">
            {!submissions.length ? (
              <div className="max-w-2xl mx-auto mt-12 space-y-6">
                <GoogleSheetSync onDataLoaded={handleSubmissionDataLoaded} />
                <div className="text-center text-muted-foreground text-sm">or</div>
                <SubmissionUpload onDataLoaded={handleSubmissionDataLoaded} />
                <p className="text-center text-muted-foreground mt-6 text-sm">
                  Sync from Google Sheets or upload your Monday.com export
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Normalization Log */}
                {normalizationLog.length > 0 && (
                  <NormalizationLog 
                    normalizationLog={normalizationLog}
                    totalRecords={submissions.length}
                  />
                )}
                
                {/* Data Quality Card */}
                {dataQuality && <DataQualityCard dataQuality={dataQuality} />}
                
                {/* Unmatched Review */}
                {hasFundingData && unmatchedSubmissions.length > 0 && (
                  <UnmatchedReview
                    unmatched={unmatchedSubmissions}
                    fundingRecords={fundingRecords}
                    onManualMatch={handleManualMatch}
                    onClose={() => setUnmatchedSubmissions([])}
                  />
                )}
                
                {/* Phase 2: Conversion Metrics View (with funding data) */}
                {hasFundingData && overallConversionStats && (
                  <div className="space-y-6">
                    {/* Overall Conversion Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                      <MetricCard
                        title="Total Submissions"
                        value={overallConversionStats.totalSubmissions.toString()}
                        icon={FileText}
                      />
                      <MetricCard
                        title="Unique ISOs"
                        value={conversionMetrics.length.toString()}
                        icon={TrendingUp}
                      />
                      <MetricCard
                        title="Funded Deals"
                        value={`${overallConversionStats.fundedCount} (${overallConversionStats.overallConversionRate.toFixed(1)}%)`}
                        icon={DollarSign}
                      />
                      <MetricCard
                        title="Offers Made"
                        value={`${overallConversionStats.offeredCount} (${overallConversionStats.submissionToOfferRate.toFixed(1)}%)`}
                        icon={TrendingUp}
                      />
                      <MetricCard
                        title="Avg Days to Fund"
                        value={`${Math.round(overallConversionStats.avgDaysToFund)}d`}
                        icon={TrendingDown}
                      />
                      <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(overallConversionStats.totalRevenue)}
                        icon={DollarSign}
                      />
                      <MetricCard
                        title="Offer→Fund Rate"
                        value={`${overallConversionStats.offerToFundedRate.toFixed(1)}%`}
                        icon={Percent}
                      />
                    </div>
                    
                    {/* Performance Alerts */}
                    {performanceAlerts.length > 0 && (
                      <PerformanceAlerts alerts={performanceAlerts} />
                    )}
                    
                    {/* Quality Score Grid */}
                    {qualityScores.length > 0 && (
                      <QualityScoreGrid 
                        scores={qualityScores}
                        selectedISO={selectedISO}
                        onISOClick={handleISOClick}
                      />
                    )}
                    
                    {/* Rep Leaderboard */}
                    {repPerformance.length > 0 && (
                      <RepLeaderboard repPerformance={repPerformance} />
                    )}
                    
                    {/* Conversion Trend Chart */}
                    {isoMonthlyTrends.length > 0 && (
                      <ConversionTrendChart 
                        trends={isoMonthlyTrends}
                        topISOs={topISOs}
                      />
                    )}
                    
                    {/* Rep Performance Table (with drill-down) */}
                    <RepPerformanceTable
                      metrics={conversionMetrics}
                      repPerformance={repPerformance}
                      selectedISO={selectedISO}
                      onISOClick={handleISOClick}
                    />
                    
                    {/* Conversion Table */}
                    <ConversionTable
                      metrics={conversionMetrics}
                      selectedISO={selectedISO}
                      onISOClick={handleISOClick}
                    />
                    
                    {/* Conversion Funnel */}
                    <ConversionFunnel metrics={conversionMetrics} topN={5} />
                    
                    {/* Efficiency Scatter Plot */}
                    <EfficiencyScatter 
                      metrics={conversionMetrics}
                      selectedISO={selectedISO}
                    />
                    
                    {/* Timeline Chart */}
                    {submissionTimelineData.length > 0 && (
                      <SubmissionTimelineChart 
                        timelineData={submissionTimelineData} 
                        topISOs={topISOs}
                        selectedISO={selectedISO}
                      />
                    )}
                  </div>
                )}
                
                {/* Phase 1: Basic ISO Metrics View (no funding data) */}
                {!hasFundingData && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-1">
                      <SubmissionFilterBar
                        filters={submissionFilters}
                        onFiltersChange={setSubmissionFilters}
                        availableISOs={submissionFilterOptions.isos}
                        availableReps={submissionFilterOptions.reps}
                      />
                    </div>
                    
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                      {/* Filter Presets */}
                      <FilterPresets onApplyPreset={handleApplyFilterPreset} />
                      
                      {/* Summary Stats */}
                      {submissionSummaryStats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <MetricCard
                            title="Total Submissions"
                            value={submissionSummaryStats.totalSubmissions.toString()}
                            icon={FileText}
                          />
                          <MetricCard
                            title="Avg Offer"
                            value={formatCurrency(submissionSummaryStats.avgOffer)}
                            icon={DollarSign}
                          />
                          <MetricCard
                            title="Offers Made"
                            value={submissionSummaryStats.offersMade.toString()}
                            icon={TrendingUp}
                          />
                          <MetricCard
                            title="Avg Pipeline Days"
                            value={`${submissionSummaryStats.avgPipeline}d`}
                            icon={TrendingDown}
                          />
                        </div>
                      )}
                      
                      {/* ISO Summary Table */}
                      <ISOSummaryTable 
                        metrics={isoMetrics}
                        selectedISO={selectedISO}
                        onISOClick={handleISOClick}
                      />
                      
                      {/* Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SubmissionVolumeChart 
                          metrics={isoMetrics}
                          selectedISO={selectedISO}
                        />
                        <AvgOfferSizeChart 
                          metrics={isoMetrics}
                          selectedISO={selectedISO}
                        />
                      </div>
                      
                      {/* Timeline Chart */}
                      {submissionTimelineData.length > 0 && (
                        <SubmissionTimelineChart 
                          timelineData={submissionTimelineData} 
                          topISOs={topISOs}
                          selectedISO={selectedISO}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="space-y-4 pt-4">
                  <GoogleSheetSync onDataLoaded={handleSubmissionDataLoaded} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <SubmissionUpload onDataLoaded={handleSubmissionDataLoaded} />
                    </div>
                    <div>
                      <FundingUpload onDataLoaded={handleFundingDataLoaded} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
