import { Card } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label, Cell } from 'recharts';
import { ConversionMetrics } from '@/types/funding';

interface EfficiencyScatterProps {
  metrics: ConversionMetrics[];
  selectedISO?: string | null;
}

export function EfficiencyScatter({ metrics, selectedISO }: EfficiencyScatterProps) {
  const data = metrics.map(m => ({
    iso: m.iso,
    submissions: m.totalSubmissions,
    conversionRate: m.overallConversionRate,
    revenue: m.totalRevenue
  }));
  
  // Calculate averages for reference lines
  const avgSubmissions = data.reduce((sum, d) => sum + d.submissions, 0) / data.length;
  const avgConversion = data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length;
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.iso}</p>
          <div className="text-xs space-y-1">
            <p>Submissions: <span className="font-medium">{data.submissions}</span></p>
            <p>Conversion: <span className="font-medium">{data.conversionRate.toFixed(1)}%</span></p>
            <p>Revenue: <span className="font-medium">${(data.revenue / 1000).toFixed(0)}K</span></p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const getQuadrantColor = (submissions: number, conversion: number) => {
    const isHighVolume = submissions >= avgSubmissions;
    const isHighConversion = conversion >= avgConversion;
    
    if (isHighVolume && isHighConversion) return 'hsl(142 76% 36%)'; // Green - Star performers
    if (isHighVolume && !isHighConversion) return 'hsl(24 95% 53%)'; // Orange - High volume, low conversion
    if (!isHighVolume && isHighConversion) return 'hsl(var(--primary))'; // Blue - Low volume, high conversion
    return 'hsl(var(--muted-foreground))'; // Gray - Needs improvement
  };
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">ISO Efficiency Quadrants</h3>
        <p className="text-sm text-muted-foreground">
          Volume vs. Conversion Rate Analysis
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 80, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          
          <XAxis 
            type="number" 
            dataKey="submissions" 
            name="Submissions"
            stroke="hsl(var(--muted-foreground))"
          >
            <Label 
              value="Total Submissions" 
              position="bottom" 
              offset={20}
              style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
          </XAxis>
          
          <YAxis 
            type="number" 
            dataKey="conversionRate" 
            name="Conversion"
            stroke="hsl(var(--muted-foreground))"
          >
            <Label 
              value="Overall Conversion Rate (%)" 
              angle={-90} 
              position="left"
              offset={10}
              style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
          </YAxis>
          
          {/* Reference lines for quadrants */}
          <ReferenceLine 
            x={avgSubmissions} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine 
            y={avgConversion} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter 
            data={data} 
            fill="hsl(var(--primary))"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={selectedISO === entry.iso 
                  ? 'hsl(var(--destructive))' 
                  : getQuadrantColor(entry.submissions, entry.conversionRate)
                }
                strokeWidth={selectedISO === entry.iso ? 3 : 0}
                stroke="hsl(var(--destructive))"
                r={selectedISO === entry.iso ? 8 : 6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(142_76%_36%)]" />
          <span>🌟 Star Performers (High Volume + High Conversion)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(24_95%_53%)]" />
          <span>⚠️ High Volume, Low Conversion (Needs Quality Focus)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]" />
          <span>💎 Quality Partners (Low Volume, High Conversion)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--muted-foreground))]" />
          <span>📉 Needs Improvement (Low Volume + Low Conversion)</span>
        </div>
      </div>
    </Card>
  );
}
