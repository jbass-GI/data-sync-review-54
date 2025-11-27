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
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:card-glow transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <span className={cn(
            "text-lg font-bold px-3 py-1 rounded-lg",
            isOnTrack && "text-success bg-success/10",
            isAtRisk && "text-warning bg-warning/10",
            !isOnTrack && !isAtRisk && "text-destructive bg-destructive/10"
          )}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="relative h-4 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out relative",
              isOnTrack && "bg-gradient-to-r from-success via-success to-success/80",
              isAtRisk && "bg-gradient-to-r from-warning via-warning to-warning/80",
              !isOnTrack && !isAtRisk && "bg-gradient-to-r from-destructive via-destructive to-destructive/80"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <span className="text-lg font-bold text-gradient">{current}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Target</p>
            <span className="text-lg font-semibold text-accent/80">{target}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
