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
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Month-End Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
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
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Burn Rate Analysis
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
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Pace to Target
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
