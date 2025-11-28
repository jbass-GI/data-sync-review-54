import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { WeeklyTrend, MonthlyTrend } from '@/lib/trendAnalysis';
import { formatCurrency } from '@/lib/dashboardMetrics';

interface TrendChartsProps {
  weeklyTrends: WeeklyTrend[];
  monthlyTrends: MonthlyTrend[];
  comparisonWeeklyTrends?: WeeklyTrend[];
  comparisonMonthlyTrends?: MonthlyTrend[];
  currentPeriodLabel?: string;
  comparisonPeriodLabel?: string;
  isComparisonActive?: boolean;
}

export function TrendCharts({ 
  weeklyTrends, 
  monthlyTrends,
  comparisonWeeklyTrends,
  comparisonMonthlyTrends,
  currentPeriodLabel = 'Current',
  comparisonPeriodLabel = 'Prior',
  isComparisonActive = false
}: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('monthly');

  // Merge data for comparison charts - using index-based alignment
  const mergedMonthlyData = isComparisonActive && comparisonMonthlyTrends 
    ? monthlyTrends.map((current, index) => {
        const comparison = comparisonMonthlyTrends[index];
        return {
          ...current,
          label: `Period ${index + 1}`,
          currentFunded: current.totalFunded,
          comparisonFunded: comparison?.totalFunded || 0,
          currentDeals: current.dealCount,
          comparisonDeals: comparison?.dealCount || 0,
          currentAvgTicket: current.avgTicket,
          comparisonAvgTicket: comparison?.avgTicket || 0,
          currentNewDeals: current.newDealsFunded,
          comparisonNewDeals: comparison?.newDealsFunded || 0,
          currentRenewals: current.renewalDealsFunded,
          comparisonRenewals: comparison?.renewalDealsFunded || 0,
        };
      })
    : monthlyTrends;

  const mergedWeeklyData = isComparisonActive && comparisonWeeklyTrends
    ? weeklyTrends.map((current, index) => {
        const comparison = comparisonWeeklyTrends[index];
        return {
          ...current,
          label: `Week ${index + 1}`,
          currentFunded: current.totalFunded,
          comparisonFunded: comparison?.totalFunded || 0,
          currentDeals: current.dealCount,
          comparisonDeals: comparison?.dealCount || 0,
          currentAvgTicket: current.avgTicket,
          comparisonAvgTicket: comparison?.avgTicket || 0,
        };
      })
    : weeklyTrends;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-semibold">
              {entry.dataKey?.includes('Deals') && !entry.dataKey?.includes('Funded')
                ? entry.value 
                : formatCurrency(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Format currency for Y-axis (compact)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <Card className="col-span-full hover:card-glow transition-all duration-300" data-chart="trends">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-gradient">
            Production Trends
            {isComparisonActive && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({currentPeriodLabel} vs {comparisonPeriodLabel})
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'monthly')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly View
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly View
            </TabsTrigger>
          </TabsList>

          {/* Monthly Trends */}
          <TabsContent value="monthly" className="space-y-6">
            {/* Monthly Production Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-4">
                {isComparisonActive ? 'Monthly Production Comparison' : 'Monthly Production vs Target'}
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                {isComparisonActive ? (
                  <BarChart data={mergedMonthlyData}>
                    <defs>
                      <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      </linearGradient>
                      <linearGradient id="barComparison" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="currentFunded" 
                      name={currentPeriodLabel}
                      fill="url(#barCurrent)"
                      radius={[4, 4, 0, 0]}
                      activeBar={false}
                    />
                    <Bar 
                      dataKey="comparisonFunded" 
                      name={comparisonPeriodLabel}
                      fill="url(#barComparison)"
                      radius={[4, 4, 0, 0]}
                      activeBar={false}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorFunded" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="targetAmount"
                      name="Monthly Target"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#colorTarget)"
                      activeDot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalFunded"
                      name="Total Funded"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorFunded)"
                      activeDot={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Monthly New vs Renewal Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-4">
                {isComparisonActive ? 'New Deals Comparison' : 'New vs Renewal Mix'}
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                {isComparisonActive ? (
                  <BarChart data={mergedMonthlyData}>
                    <defs>
                      <linearGradient id="barCurrentNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/>
                      </linearGradient>
                      <linearGradient id="barComparisonNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="currentNewDeals" 
                      name={`New Deals (${currentPeriodLabel})`}
                      fill="url(#barCurrentNew)"
                      radius={[4, 4, 0, 0]}
                      activeBar={false}
                    />
                    <Bar 
                      dataKey="comparisonNewDeals" 
                      name={`New Deals (${comparisonPeriodLabel})`}
                      fill="url(#barComparisonNew)"
                      radius={[4, 4, 0, 0]}
                      activeBar={false}
                    />
                  </BarChart>
                ) : (
                  <BarChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="barNewDealsMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/>
                      </linearGradient>
                      <linearGradient id="barRenewalsMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="newDealsFunded" 
                      name="New Deals" 
                      stackId="a"
                      fill="url(#barNewDealsMonthly)"
                      radius={[6, 6, 0, 0]}
                      activeBar={false}
                    />
                    <Bar 
                      dataKey="renewalDealsFunded" 
                      name="Renewals" 
                      stackId="a"
                      fill="url(#barRenewalsMonthly)"
                      activeBar={false}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Monthly Deal Count & Avg Ticket */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Deal Volume</h4>
                <ResponsiveContainer width="100%" height={250}>
                  {isComparisonActive ? (
                    <BarChart data={mergedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="currentDeals"
                        name={`Deals (${currentPeriodLabel})`}
                        fill="hsl(var(--chart-3))"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                      <Bar
                        dataKey="comparisonDeals"
                        name={`Deals (${comparisonPeriodLabel})`}
                        fill="hsl(var(--chart-3) / 0.4)"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="dealCount"
                        name="Deal Count"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Average Ticket Size</h4>
                <ResponsiveContainer width="100%" height={250}>
                  {isComparisonActive ? (
                    <BarChart data={mergedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="currentAvgTicket"
                        name={`Avg Ticket (${currentPeriodLabel})`}
                        fill="hsl(var(--chart-4))"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                      <Bar
                        dataKey="comparisonAvgTicket"
                        name={`Avg Ticket (${comparisonPeriodLabel})`}
                        fill="hsl(var(--chart-4) / 0.4)"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgTicket"
                        name="Avg Ticket"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Weekly Trends */}
          <TabsContent value="weekly" className="space-y-6">
            {/* Weekly Production Bar Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-4">
                {isComparisonActive ? 'Weekly Production Comparison' : 'Weekly Production'}
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={isComparisonActive ? mergedWeeklyData : weeklyTrends}>
                  <defs>
                    <linearGradient id="barFunded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    </linearGradient>
                    <linearGradient id="barFundedComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="barNewDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/>
                    </linearGradient>
                    <linearGradient id="barRenewals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey={isComparisonActive ? "label" : "weekLabel"}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {isComparisonActive ? (
                    <>
                      <Bar 
                        dataKey="currentFunded" 
                        name={currentPeriodLabel}
                        fill="url(#barFunded)"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                      <Bar 
                        dataKey="comparisonFunded" 
                        name={comparisonPeriodLabel}
                        fill="url(#barFundedComp)"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      />
                    </>
                  ) : (
                    <Bar 
                      dataKey="totalFunded" 
                      name="Total Funded" 
                      fill="url(#barFunded)"
                      radius={[6, 6, 0, 0]}
                      activeBar={false}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly New vs Renewal */}
            {!isComparisonActive && (
              <div>
                <h4 className="text-sm font-semibold mb-4">Weekly New vs Renewal Mix</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyTrends}>
                    <defs>
                      <linearGradient id="barNewDeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/>
                      </linearGradient>
                      <linearGradient id="barRenewals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="weekLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="newDealsFunded" 
                      name="New Deals" 
                      stackId="a"
                      fill="url(#barNewDeals)"
                      radius={[6, 6, 0, 0]}
                      activeBar={false}
                    />
                    <Bar 
                      dataKey="renewalDealsFunded" 
                      name="Renewals" 
                      stackId="a"
                      fill="url(#barRenewals)"
                      activeBar={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly Deal Count & Avg Ticket */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Weekly Deal Volume</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={isComparisonActive ? mergedWeeklyData : weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={isComparisonActive ? "label" : "weekLabel"}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {isComparisonActive ? (
                      <>
                        <Bar 
                          dataKey="currentDeals" 
                          name={`Deals (${currentPeriodLabel})`}
                          fill="hsl(var(--chart-3))"
                          radius={[4, 4, 0, 0]}
                          activeBar={false}
                        />
                        <Bar 
                          dataKey="comparisonDeals" 
                          name={`Deals (${comparisonPeriodLabel})`}
                          fill="hsl(var(--chart-3) / 0.4)"
                          radius={[4, 4, 0, 0]}
                          activeBar={false}
                        />
                      </>
                    ) : (
                      <Bar 
                        dataKey="dealCount" 
                        name="Deal Count" 
                        fill="hsl(var(--chart-3))"
                        activeBar={false}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Weekly Avg Ticket Size</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={isComparisonActive ? mergedWeeklyData : weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={isComparisonActive ? "label" : "weekLabel"}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {isComparisonActive ? (
                      <>
                        <Bar 
                          dataKey="currentAvgTicket" 
                          name={`Avg Ticket (${currentPeriodLabel})`}
                          fill="hsl(var(--chart-4))"
                          radius={[4, 4, 0, 0]}
                          activeBar={false}
                        />
                        <Bar 
                          dataKey="comparisonAvgTicket" 
                          name={`Avg Ticket (${comparisonPeriodLabel})`}
                          fill="hsl(var(--chart-4) / 0.4)"
                          radius={[4, 4, 0, 0]}
                          activeBar={false}
                        />
                      </>
                    ) : (
                      <Bar 
                        dataKey="avgTicket" 
                        name="Avg Ticket" 
                        fill="hsl(var(--chart-4))"
                        activeBar={false}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
