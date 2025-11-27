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
}

export function TrendCharts({ weeklyTrends, monthlyTrends }: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('monthly');

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
              {entry.dataKey === 'dealCount' || entry.name === 'Deal Count'
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
          <CardTitle className="text-gradient">Production Trends</CardTitle>
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
            {/* Monthly Production Area Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Monthly Production vs Target</h4>
              <ResponsiveContainer width="100%" height={300}>
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
                  />
                  <Area
                    type="monotone"
                    dataKey="totalFunded"
                    name="Total Funded"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorFunded)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly New vs Renewal Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-4">New vs Renewal Mix</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
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
                    dataKey="newDealsFunded" 
                    name="New Deals" 
                    stackId="a"
                    fill="hsl(var(--chart-1))" 
                  />
                  <Bar 
                    dataKey="renewalDealsFunded" 
                    name="Renewals" 
                    stackId="a"
                    fill="hsl(var(--chart-2))" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Deal Count & Avg Ticket */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Deal Volume</h4>
                <ResponsiveContainer width="100%" height={250}>
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Average Ticket Size</h4>
                <ResponsiveContainer width="100%" height={250}>
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Weekly Trends */}
          <TabsContent value="weekly" className="space-y-6">
            {/* Weekly Production Bar Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Weekly Production</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    dataKey="totalFunded" 
                    name="Total Funded" 
                    fill="hsl(var(--primary))" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly New vs Renewal */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Weekly New vs Renewal Mix</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    fill="hsl(var(--chart-1))" 
                  />
                  <Bar 
                    dataKey="renewalDealsFunded" 
                    name="Renewals" 
                    stackId="a"
                    fill="hsl(var(--chart-2))" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Deal Count & Avg Ticket */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Weekly Deal Volume</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="dealCount" 
                      name="Deal Count" 
                      fill="hsl(var(--chart-3))" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Weekly Avg Ticket Size</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                      dataKey="avgTicket" 
                      name="Avg Ticket" 
                      fill="hsl(var(--chart-4))" 
                    />
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
