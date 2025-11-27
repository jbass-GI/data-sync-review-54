import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface SubmissionTimelineChartProps {
  timelineData: { month: string; [key: string]: number | string }[];
  topISOs: string[];
  selectedISO?: string | null;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#059669',
  '#D97706',
  '#8B5CF6',
  '#EC4899'
];

export function SubmissionTimelineChart({ timelineData, topISOs, selectedISO }: SubmissionTimelineChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submission Timeline (Top 5 ISOs)</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
            />
            <YAxis className="text-xs" />
            <Tooltip 
              labelFormatter={(value) => format(new Date(value + '-01'), 'MMMM yyyy')}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {topISOs.map((iso, index) => (
              <Line
                key={iso}
                type="monotone"
                dataKey={iso}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={selectedISO === iso ? 3 : 2}
                dot={{ r: selectedISO === iso ? 5 : 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
