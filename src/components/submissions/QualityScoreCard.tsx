import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ISOQualityScore } from '@/lib/qualityScore';
import { Trophy, TrendingUp, DollarSign, Zap, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QualityScoreCardProps {
  score: ISOQualityScore;
  rank?: number;
  totalISOs?: number;
}

export function QualityScoreCard({ score, rank, totalISOs }: QualityScoreCardProps) {
  const getGradeColor = (grade: ISOQualityScore['grade']) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-600';
    if (grade === 'B') return 'bg-blue-600';
    if (grade === 'C') return 'bg-amber-600';
    if (grade === 'D') return 'bg-orange-600';
    return 'bg-red-600';
  };
  
  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Elite';
      case 2: return 'Strong';
      case 3: return 'Average';
      case 4: return 'Needs Improvement';
      default: return 'Unknown';
    }
  };
  
  const breakdownItems = [
    { 
      label: 'Conversion', 
      value: score.breakdown.conversionScore, 
      max: 40, 
      icon: Trophy,
      color: 'text-green-600'
    },
    { 
      label: 'Volume', 
      value: score.breakdown.volumeScore, 
      max: 15, 
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    { 
      label: 'Revenue', 
      value: score.breakdown.revenueScore, 
      max: 20, 
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    { 
      label: 'Speed', 
      value: score.breakdown.speedScore, 
      max: 15, 
      icon: Zap,
      color: 'text-amber-600'
    },
    { 
      label: 'Consistency', 
      value: score.breakdown.consistencyScore, 
      max: 10, 
      icon: Target,
      color: 'text-purple-600'
    }
  ];
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-1">{score.iso}</h3>
          {rank && totalISOs && (
            <p className="text-sm text-muted-foreground">
              Ranked #{rank} of {totalISOs}
            </p>
          )}
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{score.totalScore}</div>
          <Badge className={getGradeColor(score.grade)}>
            Grade {score.grade}
          </Badge>
          <div className="text-xs text-muted-foreground mt-2">
            Tier {score.tier} - {getTierLabel(score.tier)}
          </div>
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="space-y-4 mb-6">
        {breakdownItems.map((item) => {
          const Icon = item.icon;
          const percentage = (item.value / item.max) * 100;
          
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">
                  {item.value}/{item.max}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
      
      {/* Strengths */}
      {score.strengths.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-green-700 mb-2">✓ Strengths:</div>
          <ul className="text-sm space-y-1">
            {score.strengths.map((strength, idx) => (
              <li key={idx} className="text-green-600">• {strength}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Weaknesses */}
      {score.weaknesses.length > 0 && (
        <div>
          <div className="text-sm font-medium text-amber-700 mb-2">⚠ Areas for Improvement:</div>
          <ul className="text-sm space-y-1">
            {score.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-amber-600">• {weakness}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
