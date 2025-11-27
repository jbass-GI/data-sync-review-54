import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, FileText, Percent } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PartnerTable } from '@/components/dashboard/PartnerTable';
import { DealTypeChart } from '@/components/dashboard/DealTypeChart';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MTDTracking } from '@/components/dashboard/MTDTracking';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { PartnerComparison } from '@/components/dashboard/PartnerComparison';
import { ExportMenu } from '@/components/dashboard/ExportMenu';
import { parseExcelFile } from '@/lib/parseExcel';
import { calculateDashboardMetrics, calculatePartnerMetrics, formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import { applyFilters, getFilterOptions, DashboardFilters, getDateRangeFromPreset } from '@/lib/filterUtils';
import { calculateMTDMetrics } from '@/lib/mtdProjections';
import { calculateWeeklyTrends, calculateMonthlyTrends } from '@/lib/trendAnalysis';
import { Deal } from '@/types/dashboard';

const Index = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    datePreset: 'mtd', // Default to Month-to-Date
    dealType: 'all',
    partners: [],
    channelTypes: [],
    lifecycleTypes: [],
    ticketSizeBuckets: [],
    months: [],
    quarters: []
  });

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedDeals = await parseExcelFile(file);
      setDeals(parsedDeals);
      // Reset filters to MTD when new data is uploaded
      setFilters({
        datePreset: 'mtd',
        dealType: 'all',
        partners: [],
        channelTypes: [],
        lifecycleTypes: [],
        ticketSizeBuckets: [],
        months: [],
        quarters: []
      });
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
      return getDateRangeFromPreset(filters.datePreset);
    }
    return undefined;
  }, [filters]);

  const metrics = filteredDeals.length > 0 ? calculateDashboardMetrics(filteredDeals, dateRangeForMetrics) : null;
  const partnerMetrics = filteredDeals.length > 0 ? calculatePartnerMetrics(filteredDeals) : [];
  
  // Calculate MTD projections (only when viewing MTD or all data)
  const mtdMetrics = deals.length > 0 && (filters.datePreset === 'mtd' || filters.datePreset === 'all')
    ? calculateMTDMetrics(deals)
    : null;

  // Calculate trend data for charts
  const weeklyTrends = useMemo(() => calculateWeeklyTrends(filteredDeals), [filteredDeals]);
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(filteredDeals), [filteredDeals]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* Header */}
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Glazer Investments
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                MCA Production Dashboard
              </p>
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
              <div className="text-right">
                <p className="text-sm text-muted-foreground">January 2025</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated in real-time
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
        />
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
                onClick={() => setFilters({
                  datePreset: 'mtd',
                  dealType: 'all',
                  partners: [],
                  channelTypes: [],
                  lifecycleTypes: [],
                  ticketSizeBuckets: [],
                  months: [],
                  quarters: []
                })}
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
            {mtdMetrics && (
              <MTDTracking metrics={mtdMetrics} />
            )}

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Funded (MTD)"
                value={formatCurrency(metrics!.totalFunded)}
                icon={DollarSign}
                trend="up"
                trendValue={`${metrics!.dealCount} deals`}
              />
              <MetricCard
                title="Management Fees"
                value={formatCurrency(metrics!.totalFees)}
                subValue={`Avg ${formatPercent(metrics!.avgFeePercent)}`}
                icon={Percent}
              />
              <MetricCard
                title="Average Ticket Size"
                value={formatCurrency(metrics!.avgTicketSize)}
                icon={TrendingUp}
              />
              <MetricCard
                title="Total Deals"
                value={metrics!.dealCount.toString()}
                subValue="Closed this month"
                icon={FileText}
              />
            </div>

            {/* Progress Bar */}
            <ProgressBar
              title="Monthly Target Progress"
              current={formatCurrency(metrics!.totalFunded)}
              target={formatCurrency(metrics!.monthlyTarget)}
              percentage={metrics!.targetProgress}
            />

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
            <PartnerTable partners={partnerMetrics} />

            {/* Partner Comparison */}
            {partnerMetrics.length >= 2 && (
              <PartnerComparison partners={partnerMetrics} />
            )}

            {/* Upload New File */}
            <div className="pt-4">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
