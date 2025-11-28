import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/dashboardMetrics';

interface DealTypeChartProps {
  newDealsFunded: number;
  renewalDealsFunded: number;
  comparisonNewDealsFunded?: number;
  comparisonRenewalDealsFunded?: number;
  currentPeriodLabel?: string;
  comparisonPeriodLabel?: string;
  isComparisonActive?: boolean;
}

export function DealTypeChart({ 
  newDealsFunded, 
  renewalDealsFunded,
  comparisonNewDealsFunded,
  comparisonRenewalDealsFunded,
  currentPeriodLabel = 'Current',
  comparisonPeriodLabel = 'Prior',
  isComparisonActive = false
}: DealTypeChartProps) {
  const total = newDealsFunded + renewalDealsFunded;
  const newPercent = total > 0 ? (newDealsFunded / total) * 100 : 0;
  const renewalPercent = total > 0 ? (renewalDealsFunded / total) * 100 : 0;

  const compTotal = (comparisonNewDealsFunded || 0) + (comparisonRenewalDealsFunded || 0);
  const compNewPercent = compTotal > 0 ? ((comparisonNewDealsFunded || 0) / compTotal) * 100 : 0;
  const compRenewalPercent = compTotal > 0 ? ((comparisonRenewalDealsFunded || 0) / compTotal) * 100 : 0;

  const newChange = comparisonNewDealsFunded && comparisonNewDealsFunded > 0 
    ? ((newDealsFunded - comparisonNewDealsFunded) / comparisonNewDealsFunded) * 100 
    : 0;
  const renewalChange = comparisonRenewalDealsFunded && comparisonRenewalDealsFunded > 0 
    ? ((renewalDealsFunded - comparisonRenewalDealsFunded) / comparisonRenewalDealsFunded) * 100 
    : 0;

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:card-glow transition-all duration-300" data-chart="deal-type">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
        <h2 className="text-xl font-bold text-gradient">
          Deal Type Mix
          {isComparisonActive && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({currentPeriodLabel} vs {comparisonPeriodLabel})
            </span>
          )}
        </h2>
      </div>
      
      <div className="space-y-6">
        {/* New Deals */}
        <div className="group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/80" />
              <span className="text-sm font-semibold">New Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{newPercent.toFixed(1)}%</span>
              {isComparisonActive && (
                <span className={`text-xs ${newChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ({newChange >= 0 ? '+' : ''}{newChange.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          
          {isComparisonActive ? (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{currentPeriodLabel}</span>
                  <span>{formatCurrency(newDealsFunded)}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-1000"
                    style={{ width: `${newPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{comparisonPeriodLabel}</span>
                  <span>{formatCurrency(comparisonNewDealsFunded || 0)}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/40 via-primary/40 to-primary/30 transition-all duration-1000"
                    style={{ width: `${compNewPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="h-4 bg-secondary/50 rounded-full overflow-hidden border border-border/50 group-hover:border-primary/50 transition-all">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-1000 relative"
                  style={{ width: `${newPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(newDealsFunded)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg 1.75% fee
                </p>
              </div>
            </>
          )}
        </div>

        {/* Renewal Deals */}
        <div className="group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-accent/80" />
              <span className="text-sm font-semibold">Renewal Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-accent">{renewalPercent.toFixed(1)}%</span>
              {isComparisonActive && (
                <span className={`text-xs ${renewalChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ({renewalChange >= 0 ? '+' : ''}{renewalChange.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          
          {isComparisonActive ? (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{currentPeriodLabel}</span>
                  <span>{formatCurrency(renewalDealsFunded)}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-accent via-accent to-accent/80 transition-all duration-1000"
                    style={{ width: `${renewalPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{comparisonPeriodLabel}</span>
                  <span>{formatCurrency(comparisonRenewalDealsFunded || 0)}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-accent/40 via-accent/40 to-accent/30 transition-all duration-1000"
                    style={{ width: `${compRenewalPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="h-4 bg-secondary/50 rounded-full overflow-hidden border border-border/50 group-hover:border-accent/50 transition-all">
                <div 
                  className="h-full bg-gradient-to-r from-accent via-accent to-accent/80 transition-all duration-1000 relative"
                  style={{ width: `${renewalPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(renewalDealsFunded)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg 1.25% fee
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
