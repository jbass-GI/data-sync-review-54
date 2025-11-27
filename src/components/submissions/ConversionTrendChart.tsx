import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { MonthlyTrend, getConversionTrendData, calculateTrendDirection } from '@/lib/trendAnalysisISO';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ConversionTrendChartProps {
  trends: MonthlyTrend[];
  topISOs: string[];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#059669',
  '#D97706',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F59E0B'
];

export function ConversionTrendChart({ trends, topISOs }: ConversionTrendChartProps) {
  const [selectedISOs, setSelectedISOs] = useState<string[]>(topISOs.slice(0, 5));
  
  const trendData = useMemo(() => 
    getConversionTrendData(trends, selectedISOs),
    [trends, selectedISOs]
  );
  
  const toggleISO = (iso: string) => {
    setSelectedISOs(prev => 
      prev.includes(iso) 
        ? prev.filter(i => i !== iso)
        : [...prev, iso]
    );
  };
  
  const trendIndicators = useMemo(() => {
    return selectedISOs.map(iso => ({
      iso,
      trend: calculateTrendDirection(trends, iso, 3)
    }));
  }, [trends, selectedISOs]);
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Conversion Rate Trends</h3>
        <p className="text-sm text-muted-foreground">
          Track conversion performance over time (select up to 7 ISOs)
        </p>
      </div>
      
      {/* ISO Selection */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <Label className="text-sm font-medium mb-3 block">Select ISOs to Compare:</Label>
        <div className="flex flex-wrap gap-4">
          {topISOs.map((iso) => (
            <div key={iso} className="flex items-center space-x-2">
              <Checkbox
                id={`trend-${iso}`}
                checked={selectedISOs.includes(iso)}
                onCheckedChange={() => toggleISO(iso)}
                disabled={!selectedISOs.includes(iso) && selectedISOs.length >= 7}
              />
              <label
                htmlFor={`trend-${iso}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {iso}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yy')}
          />
          <YAxis 
            label={{ 
              value: 'Conversion Rate %', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value + '-01'), 'MMMM yyyy')}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Target reference line */}
          <ReferenceLine 
            y={15} 
            stroke="#D97706" 
            strokeDasharray="3 3"
            label={{ value: 'Target: 15%', position: 'right', fill: '#D97706', fontSize: 11 }}
          />
          
          {selectedISOs.map((iso, idx) => (
            <Line
              key={iso}
              type="monotone"
              dataKey={iso}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Trend Indicators */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {trendIndicators.map(({ iso, trend }) => {
          const isPositive = trend > 0;
          const isNeutral = Math.abs(trend) < 0.5;
          
          return (
            <div key={iso} className="border rounded-lg p-3">
              <div className="text-sm font-medium truncate" title={iso}>{iso}</div>
              <div className="flex items-center gap-2 mt-1">
                {isNeutral ? (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                ) : isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-lg font-bold ${
                  isNeutral ? 'text-muted-foreground' :
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive && '+'}{trend.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isNeutral ? 'Stable' : isPositive ? 'Improving' : 'Declining'}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
