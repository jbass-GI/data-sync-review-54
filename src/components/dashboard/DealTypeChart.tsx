import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/dashboardMetrics';

interface DealTypeChartProps {
  newDealsFunded: number;
  renewalDealsFunded: number;
}

export function DealTypeChart({ newDealsFunded, renewalDealsFunded }: DealTypeChartProps) {
  const total = newDealsFunded + renewalDealsFunded;
  const newPercent = (newDealsFunded / total) * 100;
  const renewalPercent = (renewalDealsFunded / total) * 100;

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:card-glow transition-all duration-300" data-chart="deal-type">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
        <h2 className="text-xl font-bold text-gradient">Deal Type Mix</h2>
      </div>
      
      <div className="space-y-6">
        <div className="group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/80" />
              <span className="text-sm font-semibold">New Deals</span>
            </div>
            <span className="text-sm font-bold text-primary">{newPercent.toFixed(1)}%</span>
          </div>
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
        </div>

        <div className="group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-accent/80" />
              <span className="text-sm font-semibold">Renewal Deals</span>
            </div>
            <span className="text-sm font-bold text-accent">{renewalPercent.toFixed(1)}%</span>
          </div>
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
        </div>
      </div>
    </Card>
  );
}
