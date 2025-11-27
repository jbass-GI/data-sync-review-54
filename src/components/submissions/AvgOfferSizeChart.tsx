import { ISOMetrics } from '@/types/submission';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface AvgOfferSizeChartProps {
  metrics: ISOMetrics[];
  selectedISO?: string | null;
}

export function AvgOfferSizeChart({ metrics, selectedISO }: AvgOfferSizeChartProps) {
  const data = metrics
    .sort((a, b) => b.avgOfferAmount - a.avgOfferAmount)
    .map(m => ({
      iso: m.iso,
      avgOffer: Math.round(m.avgOfferAmount)
    }));

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Average Offer Size by ISO</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="iso" className="text-xs" width={90} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Avg Offer']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="avgOffer" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell 
                  key={entry.iso} 
                  fill={selectedISO === entry.iso ? 'hsl(var(--destructive))' : 'hsl(142 76% 36%)'} 
                />
              ))}
              <LabelList 
                dataKey="avgOffer" 
                position="right"
                formatter={(value: number) => formatCurrency(value)}
                style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
