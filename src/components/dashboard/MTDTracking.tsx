import { TrendingUp, TrendingDown, Activity, Target, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MTDMetrics, formatCompactCurrency } from '@/lib/mtdProjections';
import { formatCurrency, formatPercent } from '@/lib/dashboardMetrics';

interface MTDTrackingProps {
  metrics: MTDMetrics;
}

export function MTDTracking({ metrics }: MTDTrackingProps) {
  const getStatusColor = (status: 'Ahead' | 'On Track' | 'Behind') => {
    switch (status) {
      case 'Ahead': return 'text-success';
      case 'Behind': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  const getStatusBadgeVariant = (status: 'Ahead' | 'On Track' | 'Behind') => {
    switch (status) {
      case 'Ahead': return 'default';
      case 'Behind': return 'destructive';
      default: return 'secondary';
    }
  };

  const getConfidenceColor = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High': return 'text-success';
      case 'Medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Projections Card */}
      <Card className="metric-card hover:card-glow transition-all duration-300 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <span className="text-gradient">Month-End Projection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gradient">
                {formatCompactCurrency(metrics.projectedMonthEnd)}
              </span>
              <Badge variant={getStatusBadgeVariant(metrics.paceStatus)} className="text-xs">
                {metrics.paceStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Projected based on current pace
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">vs Target:</span>
              <span className={metrics.projectedVsTarget >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                {metrics.projectedVsTarget >= 0 ? '+' : ''}
                {formatCompactCurrency(metrics.projectedVsTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <span className={`font-semibold ${getConfidenceColor(metrics.projectionConfidence)}`}>
                {metrics.projectionConfidence}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Business Days Left:</span>
              <span className="font-semibold">{metrics.businessDaysRemaining} days</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Month Progress</span>
              <span>{formatPercent(metrics.monthProgress, 0)}</span>
            </div>
            <Progress value={metrics.monthProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Burn Rate Card */}
      <Card className="metric-card hover:card-glow transition-all duration-300 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/10 rounded-lg border border-accent/20">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <span className="text-gradient">Burn Rate Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatCompactCurrency(metrics.dailyBurnRate)}
              </span>
              <span className="text-sm text-muted-foreground">/bus. day</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Current daily average (business days)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target Rate:</span>
              <span className="font-semibold">
                {formatCompactCurrency(metrics.targetDailyBurnRate)}/bus. day
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Business Days Used:</span>
              <span className="font-semibold">
                {metrics.businessDaysElapsed} of {metrics.businessDaysElapsed + metrics.businessDaysRemaining}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={getStatusBadgeVariant(metrics.burnRateStatus)}>
                {metrics.burnRateStatus}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              {metrics.dailyBurnRate >= metrics.targetDailyBurnRate ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm">
                {metrics.dailyBurnRate >= metrics.targetDailyBurnRate 
                  ? `${formatPercent(((metrics.dailyBurnRate / metrics.targetDailyBurnRate - 1) * 100), 0)} above target` 
                  : `${formatPercent(((1 - metrics.dailyBurnRate / metrics.targetDailyBurnRate) * 100), 0)} below target`
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pace to Target Card */}
      <Card className="metric-card hover:card-glow transition-all duration-300 border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-gradient-to-br from-success/20 to-accent/10 rounded-lg border border-success/20">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <span className="text-gradient">Pace to Target</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatCompactCurrency(metrics.requiredDailyPace)}
              </span>
              <span className="text-sm text-muted-foreground">/bus. day</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Required per business day to hit target
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Pace:</span>
              <span className="font-semibold">
                {formatCompactCurrency(metrics.dailyBurnRate)}/bus. day
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-semibold">
                {formatCompactCurrency(metrics.remainingToTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={getStatusBadgeVariant(metrics.paceStatus)}>
                {metrics.paceStatus}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target Progress</span>
                <span>{formatPercent(metrics.targetProgress, 1)}</span>
              </div>
              <Progress value={metrics.targetProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.businessDaysElapsed} of {metrics.businessDaysElapsed + metrics.businessDaysRemaining} business days elapsed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
