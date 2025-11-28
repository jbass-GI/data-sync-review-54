import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  comparisonValue?: string;
  currentPeriodLabel?: string;
  comparisonPeriodLabel?: string;
  isComparisonActive?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  trendValue, 
  comparisonValue,
  currentPeriodLabel,
  comparisonPeriodLabel,
  isComparisonActive = false
}: MetricCardProps) {
  return (
    <Card className="metric-card p-6 border-border/50 bg-card/50 backdrop-blur hover:card-glow transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2 font-medium">{title}</p>
          
          {isComparisonActive && comparisonValue ? (
            <div className="space-y-3">
              {/* Current Period */}
              <div>
                <p className="text-xs text-primary font-medium mb-1">{currentPeriodLabel || 'Current'}</p>
                <h3 className="text-2xl font-bold stat-highlight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">{value}</h3>
              </div>
              
              {/* Comparison Period */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{comparisonPeriodLabel || 'Prior'}</p>
                <p className="text-xl font-semibold text-muted-foreground">{comparisonValue}</p>
              </div>
              
              {/* Change indicator */}
              {trend && trendValue && (
                <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                  <span className={cn(
                    "text-sm font-semibold",
                    trend === 'up' && "text-success",
                    trend === 'down' && "text-destructive",
                    trend === 'neutral' && "text-muted-foreground"
                  )}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold stat-highlight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">{value}</h3>
              {comparisonValue && (
                <p className="text-xs text-muted-foreground mt-1">
                  Prior: <span className="font-semibold">{comparisonValue}</span>
                </p>
              )}
              {subValue && (
                <p className="text-sm text-accent/80 mt-1 font-medium">{subValue}</p>
              )}
              {trend && trendValue && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={cn(
                    "text-xs font-medium",
                    trend === 'up' && "text-success",
                    trend === 'down' && "text-destructive",
                    trend === 'neutral' && "text-muted-foreground"
                  )}>
                    {trendValue}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
          <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
    </Card>
  );
}
