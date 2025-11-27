import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SubmissionTimelineChartProps {
  timelineData: { month: string; [key: string]: number | string }[];
  topISOs: string[];
}

const ISO_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(24 95% 53%)',
  'hsl(262 83% 58%)',
  'hsl(346 77% 50%)'
];

export function SubmissionTimelineChart({ timelineData, topISOs }: SubmissionTimelineChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submission Timeline (Top 5 ISOs)</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {topISOs.map((iso, index) => (
              <Line
                key={iso}
                type="monotone"
                dataKey={iso}
                stroke={ISO_COLORS[index % ISO_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
