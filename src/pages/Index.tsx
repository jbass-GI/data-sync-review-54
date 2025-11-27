import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, FileText, Percent } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PartnerTable } from '@/components/dashboard/PartnerTable';
import { DealTypeChart } from '@/components/dashboard/DealTypeChart';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { parseExcelFile } from '@/lib/parseExcel';
import { calculateDashboardMetrics, calculatePartnerMetrics, formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import { Deal } from '@/types/dashboard';

const Index = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedDeals = await parseExcelFile(file);
      setDeals(parsedDeals);
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter deals by date range
  const filteredDeals = useMemo(() => {
    if (!dateRange?.from || deals.length === 0) return deals;
    
    return deals.filter(deal => {
      const dealDate = deal.fundingDate;
      const isAfterStart = dealDate >= dateRange.from!;
      const isBeforeEnd = !dateRange.to || dealDate <= dateRange.to;
      return isAfterStart && isBeforeEnd;
    });
  }, [deals, dateRange]);

  const metrics = filteredDeals.length > 0 ? calculateDashboardMetrics(filteredDeals, dateRange) : null;
  const partnerMetrics = filteredDeals.length > 0 ? calculatePartnerMetrics(filteredDeals) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gradient">
                  Glazer Investments
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  MCA Production Dashboard
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">January 2025</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated in real-time
                </p>
              </div>
            </div>
            
            {deals.length > 0 && (
              <div className="flex items-center gap-4">
                <DateRangeFilter 
                  dateRange={dateRange} 
                  onDateRangeChange={setDateRange}
                />
                {dateRange && (
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredDeals.length} of {deals.length} deals
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!deals.length ? (
          <div className="max-w-2xl mx-auto mt-12">
            <FileUpload onFileUpload={handleFileUpload} />
            <p className="text-center text-muted-foreground mt-6 text-sm">
              Upload your Excel file to view production analytics and partner performance
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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

            {/* Partner Table */}
            <PartnerTable partners={partnerMetrics} />

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
