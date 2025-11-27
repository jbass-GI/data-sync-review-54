import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Submission } from '@/types/submission';
import { FundingRecord } from '@/types/funding';
import { getPotentialMatches } from '@/lib/fundingMatcher';
import { Badge } from '@/components/ui/badge';

interface UnmatchedReviewProps {
  unmatched: Submission[];
  fundingRecords: FundingRecord[];
  onManualMatch: (submissionName: string, fundingDealName: string | null) => void;
  onClose: () => void;
}

export function UnmatchedReview({ 
  unmatched, 
  fundingRecords, 
  onManualMatch,
  onClose 
}: UnmatchedReviewProps) {
  const [selections, setSelections] = useState<Map<string, string | null>>(new Map());
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  
  const handleSelection = (submissionName: string, fundingDealName: string) => {
    const newSelections = new Map(selections);
    if (fundingDealName === 'skip') {
      newSelections.set(submissionName, null);
    } else {
      newSelections.set(submissionName, fundingDealName);
    }
    setSelections(newSelections);
  };
  
  const handleApply = (submissionName: string) => {
    const selection = selections.get(submissionName);
    onManualMatch(submissionName, selection === undefined ? null : selection);
    setReviewed(new Set([...reviewed, submissionName]));
  };
  
  const handleApplyAll = () => {
    unmatched.forEach(sub => {
      const selection = selections.get(sub.name);
      onManualMatch(sub.name, selection === undefined ? null : selection);
    });
    onClose();
  };
  
  const pendingCount = unmatched.filter(s => !reviewed.has(s.name)).length;
  
  if (unmatched.length === 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">All submissions have been matched to funding records!</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6 bg-amber-50 border-amber-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">Manual Matching Required</h3>
            <p className="text-sm text-amber-700">
              {pendingCount} submission{pendingCount !== 1 ? 's' : ''} could not be automatically matched
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {unmatched.map(sub => {
          const isReviewed = reviewed.has(sub.name);
          const potentialMatches = getPotentialMatches(sub.name, fundingRecords);
          
          return (
            <div 
              key={sub.name} 
              className={`p-3 rounded-lg border ${
                isReviewed ? 'bg-green-50 border-green-200' : 'bg-white border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-sm">{sub.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ISO: {sub.isoNormalized} • Stage: {sub.stageCategory}
                    {sub.offerAmount > 0 && ` • Offer: $${sub.offerAmount.toLocaleString()}`}
                  </div>
                  
                  {!isReviewed && (
                    <div className="mt-3">
                      <Select
                        value={selections.get(sub.name) || ''}
                        onValueChange={(value) => handleSelection(sub.name, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Select funding record or skip --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">
                            ❌ Skip (not funded)
                          </SelectItem>
                          {potentialMatches.map(({ record, score }) => (
                            <SelectItem key={record.dealName} value={record.dealName}>
                              <div className="flex items-center gap-2">
                                <span>{record.dealName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {score}% match
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  ${record.fundedAmount.toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {isReviewed && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">
                        {selections.get(sub.name) ? 'Matched' : 'Skipped'}
                      </span>
                    </div>
                  )}
                </div>
                
                {!isReviewed && (
                  <Button
                    size="sm"
                    onClick={() => handleApply(sub.name)}
                    disabled={!selections.has(sub.name)}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {pendingCount > 0 && (
        <div className="flex gap-2">
          <Button onClick={handleApplyAll} className="flex-1">
            Apply All Selections ({selections.size} selected)
          </Button>
          <Button variant="outline" onClick={onClose}>
            Skip for Now
          </Button>
        </div>
      )}
    </Card>
  );
}
