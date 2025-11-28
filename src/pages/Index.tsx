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
import { comparePeriods, getComparisonPeriods, ComparisonType, getAvailablePeriodsFromData, PeriodOption } from '@/lib/periodComparison';
import { Deal, PartnerMetrics } from '@/types/dashboard';
import glazerLogo from '@/assets/glazer-logo.png';

const Index = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
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
    datePreset: 'all', // Will be updated based on data when loaded
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
  const [selectedCurrentPeriod, setSelectedCurrentPeriod] = useState<string | null>(null);
  const [selectedComparisonPeriod, setSelectedComparisonPeriod] = useState<string | null>(null);
  const isComparisonActive = comparisonType !== 'none';

  // Scroll detection for mini header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = 200;

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
          
          // Determine best initial preset based on data
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const hasMTD = defaultDeals.some(deal => deal.fundingDate >= monthStart && deal.fundingDate <= now);
          
          // Get most recent month from data
          const dealDates = defaultDeals.map(d => d.fundingDate);
          const maxDate = new Date(Math.max(...dealDates.map(d => d.getTime())));
          const mostRecentMonth = `month-${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
          
          setFilters(prev => ({
            ...prev,
            // Use MTD if current data, otherwise default to most recent month or all
            datePreset: hasMTD ? 'mtd' : mostRecentMonth
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
        const existingDealIds = new Set(
          deals.map(d => `${d.dealName}-${d.fundingDate.toISOString()}-${d.partner}`)
        );
        
        const newUniqueDeals = parsedDeals.filter(
          d => !existingDealIds.has(`${d.dealName}-${d.fundingDate.toISOString()}-${d.partner}`)
        );
        
        const duplicatesCount = parsedDeals.length - newUniqueDeals.length;
        setDeals([...deals, ...newUniqueDeals]);
        
        toast({
          title: "Data merged successfully",
          description: `Added ${newUniqueDeals.length} new deals${duplicatesCount > 0 ? ` (${duplicatesCount} duplicates skipped)` : ''}`,
        });
      } else {
        setDeals(parsedDeals);
        
        // Determine best initial preset based on data
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const hasMTD = parsedDeals.some(deal => deal.fundingDate >= monthStart && deal.fundingDate <= now);
        
        // Get most recent month from data
        const dealDates = parsedDeals.map(d => d.fundingDate);
        const maxDate = new Date(Math.max(...dealDates.map(d => d.getTime())));
        const mostRecentMonth = `month-${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
        
        setFilters({
          datePreset: hasMTD ? 'mtd' : mostRecentMonth,
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

  const filterOptions = useMemo(() => getFilterOptions(deals), [deals]);
  const filteredDeals = useMemo(() => applyFilters(deals, filters), [deals, filters]);

  const dateRangeForMetrics = useMemo(() => {
    if (filters.datePreset === 'custom' && filters.customDateRange) {
      return filters.customDateRange;
    } else if (filters.datePreset !== 'all') {
      return getDateRangeFromPreset(filters.datePreset, deals);
    }
    return undefined;
  }, [filters, deals]);

  const metrics = filteredDeals.length > 0 ? calculateDashboardMetrics(filteredDeals, dateRangeForMetrics) : null;
  
  const rawPartnerMetrics = filteredDeals.length > 0 ? calculatePartnerMetrics(filteredDeals) : [];
  const partnerMetrics = useMemo(() => {
    if (partnerMerges.size === 0) return rawPartnerMetrics;
    
    const mergedMetrics: PartnerMetrics[] = [];
    const processedPartners = new Set<string>();
    
    partnerMerges.forEach((partnerNames, mergedName) => {
      const partnersToMerge = rawPartnerMetrics.filter(m => partnerNames.includes(m.partner));
      
      if (partnersToMerge.length === 0) return;
      
      partnerNames.forEach(name => processedPartners.add(name));
      
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
      
      merged.avgTicketSize = merged.totalFunded / merged.dealCount;
      merged.avgFeePercent = (merged.totalFees / merged.totalFunded) * 100;
      
      mergedMetrics.push(merged);
    });
    
    rawPartnerMetrics.forEach(metric => {
      if (!processedPartners.has(metric.partner)) {
        mergedMetrics.push(metric);
      }
    });
    
    return mergedMetrics.sort((a, b) => b.totalFunded - a.totalFunded);
  }, [rawPartnerMetrics, partnerMerges]);
  
  const displayLabels = getFilterDisplayLabels(filters.datePreset);
  
  const mtdMetrics = deals.length > 0 && (filters.datePreset === 'mtd' || filters.datePreset === 'all')
    ? calculateMTDMetrics(deals)
    : null;

  const weeklyTrends = useMemo(() => calculateWeeklyTrends(filteredDeals), [filteredDeals]);
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(filteredDeals), [filteredDeals]);

  const availablePeriods = useMemo(() =>
    getAvailablePeriodsFromData(deals),
    [deals]
  );

  // Find the selected period options for custom comparison
  const findPeriodOption = (value: string | null): PeriodOption | undefined => {
    if (!value) return undefined;
    return [...availablePeriods.months, ...availablePeriods.quarters, ...availablePeriods.years]
      .find(p => p.value === value);
  };

  const comparisonConfig = useMemo(() => {
    const customCurrentOption = findPeriodOption(selectedCurrentPeriod);
    const customComparisonOption = findPeriodOption(selectedComparisonPeriod);
    return getComparisonPeriods(comparisonType, new Date(), customCurrentOption, customComparisonOption);
  }, [comparisonType, selectedCurrentPeriod, selectedComparisonPeriod, availablePeriods]);

  // Calculate comparison period trends
  const comparisonPeriodDeals = useMemo(() => {
    if (!comparisonConfig) return [];
    return deals.filter(deal => {
      const dealDate = deal.fundingDate;
      return dealDate >= comparisonConfig.comparisonPeriod.startDate && 
             dealDate <= comparisonConfig.comparisonPeriod.endDate;
    });
  }, [deals, comparisonConfig]);

  const currentPeriodDeals = useMemo(() => {
    if (!comparisonConfig) return [];
    return deals.filter(deal => {
      const dealDate = deal.fundingDate;
      return dealDate >= comparisonConfig.currentPeriod.startDate && 
             dealDate <= comparisonConfig.currentPeriod.endDate;
    });
  }, [deals, comparisonConfig]);

  const comparisonWeeklyTrends = useMemo(() => 
    isComparisonActive ? calculateWeeklyTrends(comparisonPeriodDeals) : [],
    [comparisonPeriodDeals, isComparisonActive]
  );
  
  const comparisonMonthlyTrends = useMemo(() => 
    isComparisonActive ? calculateMonthlyTrends(comparisonPeriodDeals) : [],
    [comparisonPeriodDeals, isComparisonActive]
  );

  const currentWeeklyTrends = useMemo(() => 
    isComparisonActive ? calculateWeeklyTrends(currentPeriodDeals) : weeklyTrends,
    [currentPeriodDeals, weeklyTrends, isComparisonActive]
  );
  
  const currentMonthlyTrends = useMemo(() => 
    isComparisonActive ? calculateMonthlyTrends(currentPeriodDeals) : monthlyTrends,
    [currentPeriodDeals, monthlyTrends, isComparisonActive]
  );

  const comparisonResult = useMemo(() => {
    if (!comparisonConfig) return null;
    return comparePeriods(deals, comparisonConfig);
  }, [deals, comparisonConfig]);

  const handleComparisonToggle = () => {
    if (comparisonType === 'none') {
      setComparisonType('custom');
    } else {
      setComparisonType('none');
      setSelectedCurrentPeriod(null);
      setSelectedComparisonPeriod(null);
    }
  };

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
                {deals.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Last Funded: {new Date(Math.max(...deals.map(d => d.fundingDate.getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deals.length} deals loaded
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data loaded</p>
                )}
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
      {deals.length > 0 && (comparisonConfig || isComparisonActive) && (
        <div className="container mx-auto px-6 pt-4">
          <ComparisonSelector
            comparisonType={comparisonType}
            onComparisonTypeChange={setComparisonType}
            currentLabel={comparisonConfig?.currentPeriod.label || ''}
            comparisonLabel={comparisonConfig?.comparisonPeriod.label || ''}
            isActive={isComparisonActive}
            availablePeriods={availablePeriods}
            selectedCurrentPeriod={selectedCurrentPeriod}
            selectedComparisonPeriod={selectedComparisonPeriod}
            onCurrentPeriodChange={setSelectedCurrentPeriod}
            onComparisonPeriodChange={setSelectedComparisonPeriod}
          />
        </div>
      )}

      <main className="container mx-auto px-6 py-8">
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
            {/* MTD Tracking & Projections */}
            {mtdMetrics && !isComparisonActive && (
              <MTDTracking metrics={mtdMetrics} />
            )}

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title={isComparisonActive && comparisonConfig ? `${comparisonConfig.currentPeriod.label} Funded` : displayLabels.fundedLabel}
                value={formatCurrency(isComparisonActive && comparisonResult ? comparisonResult.current.totalFunded : metrics!.totalFunded)}
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
                value={formatCurrency(isComparisonActive && comparisonResult ? comparisonResult.current.totalFees : metrics!.totalFees)}
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
                value={formatCurrency(isComparisonActive && comparisonResult ? comparisonResult.current.avgTicketSize : metrics!.avgTicketSize)}
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
                value={(isComparisonActive && comparisonResult ? comparisonResult.current.dealCount : metrics!.dealCount).toString()}
                subValue={isComparisonActive && comparisonResult
                  ? `${comparisonResult.percentChanges.dealCount >= 0 ? '+' : ''}${comparisonResult.percentChanges.dealCount.toFixed(1)}%`
                  : displayLabels.dealsLabel
                }
                icon={comparisonResult && comparisonResult.percentChanges.dealCount >= 0 ? FileText : TrendingDown}
                comparisonValue={comparisonResult ? comparisonResult.comparison.dealCount.toString() : undefined}
              />
            </div>

            {/* Progress Bar */}
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
              newDealsFunded={isComparisonActive && comparisonResult ? comparisonResult.current.newDealsFunded : metrics!.newDealsFunded}
              renewalDealsFunded={isComparisonActive && comparisonResult ? comparisonResult.current.renewalDealsFunded : metrics!.renewalDealsFunded}
              comparisonNewDealsFunded={comparisonResult?.comparison.newDealsFunded}
              comparisonRenewalDealsFunded={comparisonResult?.comparison.renewalDealsFunded}
              currentPeriodLabel={comparisonConfig?.currentPeriod.label}
              comparisonPeriodLabel={comparisonConfig?.comparisonPeriod.label}
              isComparisonActive={isComparisonActive && !!comparisonResult}
            />

            {/* Trend Charts */}
            {(currentWeeklyTrends.length > 0 || currentMonthlyTrends.length > 0) && (
              <TrendCharts
                weeklyTrends={currentWeeklyTrends}
                monthlyTrends={currentMonthlyTrends}
                comparisonWeeklyTrends={comparisonWeeklyTrends}
                comparisonMonthlyTrends={comparisonMonthlyTrends}
                currentPeriodLabel={comparisonConfig?.currentPeriod.label}
                comparisonPeriodLabel={comparisonConfig?.comparisonPeriod.label}
                isComparisonActive={isComparisonActive}
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
      </main>
    </div>
  );
};

export default Index;
