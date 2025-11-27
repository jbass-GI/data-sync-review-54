import { ISOMetrics } from '@/types/submission';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface SubmissionVolumeChartProps {
  metrics: ISOMetrics[];
  selectedISO?: string | null;
}

export function SubmissionVolumeChart({ metrics, selectedISO }: SubmissionVolumeChartProps) {
  const data = metrics
    .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
    .map(m => ({
      iso: m.iso,
      submissions: m.totalSubmissions
    }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submission Volume by ISO</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis type="category" dataKey="iso" className="text-xs" width={90} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="submissions" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell 
                  key={entry.iso} 
                  fill={selectedISO === entry.iso ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                />
              ))}
              <LabelList 
                dataKey="submissions" 
                position="right"
                style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
