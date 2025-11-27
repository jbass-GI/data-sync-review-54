import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  title: string;
  current: string;
  target: string;
  percentage: number;
}

export function ProgressBar({ title, current, target, percentage }: ProgressBarProps) {
  const isOnTrack = percentage >= 80;
  const isAtRisk = percentage >= 50 && percentage < 80;
  
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <span className={cn(
            "text-sm font-bold",
            isOnTrack && "text-success",
            isAtRisk && "text-warning",
            !isOnTrack && !isAtRisk && "text-destructive"
          )}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-3"
        />
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground font-semibold">{current}</span>
          <span className="text-muted-foreground">Target: {target}</span>
        </div>
      </div>
    </Card>
  );
}
