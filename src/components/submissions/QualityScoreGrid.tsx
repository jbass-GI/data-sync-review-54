import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ISOQualityScore } from '@/lib/qualityScore';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';

interface QualityScoreGridProps {
  scores: ISOQualityScore[];
  onISOClick?: (iso: string) => void;
  selectedISO?: string | null;
}

export function QualityScoreGrid({ scores, onISOClick, selectedISO }: QualityScoreGridProps) {
  const getGradeColor = (grade: ISOQualityScore['grade']) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-600';
    if (grade === 'B') return 'bg-blue-600';
    if (grade === 'C') return 'bg-amber-600';
    if (grade === 'D') return 'bg-orange-600';
    return 'bg-red-600';
  };
  
  const getTierBadge = (tier: number) => {
    const labels = ['Elite', 'Strong', 'Average', 'At Risk'];
    const colors = ['default', 'secondary', 'secondary', 'destructive'];
    return <Badge variant={colors[tier - 1] as any}>{labels[tier - 1]}</Badge>;
  };
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">ISO Quality Scores</h3>
        <p className="text-sm text-muted-foreground">
          Composite scores based on conversion, volume, revenue, speed, and consistency
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.map((score, index) => (
          <div
            key={score.iso}
            className={`relative p-5 rounded-lg border-2 transition-all cursor-pointer ${
              selectedISO === score.iso
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 hover:shadow-md'
            }`}
            onClick={() => onISOClick?.(score.iso)}
          >
            {/* Rank Badge */}
            {index < 3 && (
              <div className="absolute -top-3 -right-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  'bg-orange-400 text-orange-900'
                }`}>
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{score.iso}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge className={getGradeColor(score.grade)}>
                    {score.grade}
                  </Badge>
                  {getTierBadge(score.tier)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{score.totalScore}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <Progress value={score.totalScore} className="h-2 mb-4" />
            
            {/* Mini breakdown */}
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className="text-center">
                <div className="font-semibold text-green-600">{score.breakdown.conversionScore}</div>
                <div className="text-muted-foreground">Conv</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{score.breakdown.volumeScore}</div>
                <div className="text-muted-foreground">Vol</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-emerald-600">{score.breakdown.revenueScore}</div>
                <div className="text-muted-foreground">Rev</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-amber-600">{score.breakdown.speedScore}</div>
                <div className="text-muted-foreground">Speed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{score.breakdown.consistencyScore}</div>
                <div className="text-muted-foreground">Cons</div>
              </div>
            </div>
            
            {/* Quick insights */}
            {score.strengths.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-green-600">
                  ✓ {score.strengths[0]}
                </div>
              </div>
            )}
            {score.weaknesses.length > 0 && (
              <div className={score.strengths.length > 0 ? 'mt-1' : 'mt-3 pt-3 border-t'}>
                <div className="text-xs text-amber-600">
                  ⚠ {score.weaknesses[0]}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
