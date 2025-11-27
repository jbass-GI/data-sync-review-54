import { Card } from '@/components/ui/card';
import { ConversionMetrics } from '@/types/funding';

interface ConversionFunnelProps {
  metrics: ConversionMetrics[];
  topN?: number;
}

export function ConversionFunnel({ metrics, topN = 5 }: ConversionFunnelProps) {
  const topISOs = metrics.slice(0, topN);
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Conversion Funnel by ISO</h3>
      
      <div className="space-y-8">
        {topISOs.map((iso) => (
          <div key={iso.iso}>
            <h4 className="font-medium mb-3 text-sm">{iso.iso}</h4>
            
            <div className="space-y-3">
              {/* Stage 1: Submissions */}
              <div className="relative">
                <div 
                  className="bg-blue-100 h-14 rounded-lg flex items-center px-4 transition-all hover:bg-blue-200"
                  style={{ width: '100%' }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-medium text-blue-900">
                      📊 Submissions
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {iso.totalSubmissions}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stage 2: Offers */}
              <div className="relative ml-8">
                <div 
                  className="bg-blue-400 h-14 rounded-lg flex items-center px-4 transition-all hover:bg-blue-500"
                  style={{ 
                    width: `${Math.max(iso.submissionToOfferRate, 10)}%`,
                    minWidth: '120px'
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-medium text-white">
                      📝 Offers
                    </span>
                    <span className="text-sm font-bold text-white">
                      {iso.offeredCount} ({iso.submissionToOfferRate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stage 3: Funded */}
              <div className="relative ml-16">
                <div 
                  className="bg-green-500 h-14 rounded-lg flex items-center px-4 transition-all hover:bg-green-600"
                  style={{ 
                    width: `${Math.max(iso.overallConversionRate, 8)}%`,
                    minWidth: '100px'
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-medium text-white">
                      ✅ Funded
                    </span>
                    <span className="text-sm font-bold text-white">
                      {iso.fundedCount} ({iso.overallConversionRate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Drop-off indicators */}
            <div className="mt-3 ml-4 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <span>{iso.totalSubmissions - iso.offeredCount} declined before offer</span>
                <span className="text-red-600 font-medium">
                  ({((1 - iso.submissionToOfferRate / 100) * 100).toFixed(0)}% drop)
                </span>
              </div>
              {iso.offeredCount > iso.fundedCount && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span>
                  <span>{iso.offeredCount - iso.fundedCount} offered but not funded</span>
                  <span className="text-amber-600 font-medium">
                    ({((1 - iso.offerToFundedRate / 100) * 100).toFixed(0)}% drop)
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {metrics.length > topN && (
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Showing top {topN} ISOs by volume
        </p>
      )}
    </Card>
  );
}
