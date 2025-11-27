import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface NormalizationLogProps {
  normalizationLog: { original: string; normalized: string }[];
  totalRecords: number;
}

export function NormalizationLog({ normalizationLog, totalRecords }: NormalizationLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group normalizations by result to show counts
  const grouped = normalizationLog.reduce((acc, item) => {
    const key = `${item.original}→${item.normalized}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const uniqueNormalizations = Object.entries(grouped).map(([key, count]) => {
    const [original, normalized] = key.split('→');
    return { original, normalized, count };
  });
  
  const uniqueISOs = new Set(normalizationLog.map(n => n.normalized)).size;
  const partnershipNormalizations = normalizationLog.filter(n => n.original.includes('/')).length;
  
  if (normalizationLog.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">All ISO names are already normalized - no corrections needed!</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                ISO Normalization Applied
              </h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-700">
                {isOpen ? (
                  <>
                    Hide Details <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    View Details <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <div className="text-sm text-blue-800 space-y-1">
            <p>✓ {totalRecords} records processed</p>
            <p>✓ {normalizationLog.length} variations consolidated into {uniqueISOs} unique ISOs</p>
            {partnershipNormalizations > 0 && (
              <p>✓ {partnershipNormalizations} partnership formats normalized (slash handling)</p>
            )}
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-blue-200 pt-3">
            <div className="space-y-1 text-xs max-h-[300px] overflow-y-auto">
              {uniqueNormalizations
                .sort((a, b) => b.count - a.count)
                .map(({ original, normalized, count }, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1 px-2 bg-white rounded text-blue-900">
                    <span className="font-mono text-amber-700">"{original}"</span>
                    <span className="text-blue-400">→</span>
                    <span className="font-mono font-semibold">"{normalized}"</span>
                    <span className="ml-auto text-blue-600">({count} record{count !== 1 ? 's' : ''})</span>
                  </div>
                ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
