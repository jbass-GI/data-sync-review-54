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
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <h2 className="text-xl font-bold mb-6">Deal Type Mix</h2>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">New Deals</span>
            <span className="text-sm font-bold text-primary">{newPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${newPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(newDealsFunded)} • Avg 1.75% fee
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Renewal Deals</span>
            <span className="text-sm font-bold text-accent">{renewalPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-500"
              style={{ width: `${renewalPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(renewalDealsFunded)} • Avg 1.25% fee
          </p>
        </div>
      </div>
    </Card>
  );
}
