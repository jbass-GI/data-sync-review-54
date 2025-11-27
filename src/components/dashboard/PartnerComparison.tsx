import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, TrendingUp, Users, Target, Award, Crown } from 'lucide-react';
import { PartnerMetrics } from '@/types/dashboard';
import { 
  calculatePartnerRankings, 
  comparePartners, 
  getPartnerRadarData,
  PartnerRanking 
} from '@/lib/partnerComparison';
import { formatCurrency, formatPercent } from '@/lib/dashboardMetrics';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface PartnerComparisonProps {
  partners: PartnerMetrics[];
}

export function PartnerComparison({ partners }: PartnerComparisonProps) {
  const [selectedPartner1, setSelectedPartner1] = useState<string>('');
  const [selectedPartner2, setSelectedPartner2] = useState<string>('');

  const rankings = calculatePartnerRankings(partners);
  const topPartners = rankings.slice(0, 5);

  const partner1Data = partners.find(p => p.partner === selectedPartner1);
  const partner2Data = partners.find(p => p.partner === selectedPartner2);

  const comparison = partner1Data && partner2Data 
    ? comparePartners(partner1Data, partner2Data)
    : null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-warning" />;
      case 2: return <Award className="h-5 w-5 text-muted-foreground" />;
      case 3: return <Award className="h-5 w-5 text-accent" />;
      default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getWinnerColor = (winner: 'partner1' | 'partner2' | 'tie', side: 'partner1' | 'partner2') => {
    if (winner === 'tie') return 'text-muted-foreground';
    return winner === side ? 'text-success font-bold' : 'text-muted-foreground';
  };

  // Prepare radar chart data with actual values for tooltip
  const radarData = partner1Data && partner2Data && partners.length > 0
    ? getPartnerRadarData(partner1Data, partners).map((p1Data, index) => {
        const p2Data = getPartnerRadarData(partner2Data, partners)[index];
        return {
          metric: p1Data.metric,
          [selectedPartner1]: p1Data.value,
          [selectedPartner2]: p2Data.value,
          [`${selectedPartner1}_actual`]: p1Data.displayValue,
          [`${selectedPartner2}_actual`]: p2Data.displayValue,
          fullMark: 100
        };
      })
    : [];

  // Custom tooltip for radar chart
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{payload[0].payload.metric}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold">
                {entry.payload[`${entry.name}_actual`]}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Partners Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Partner Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPartners.map((partner) => (
              <div
                key={partner.partner}
                className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  {getRankIcon(partner.rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{partner.partner}</h4>
                    <Badge variant="outline" className="text-xs">
                      #{partner.rank}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {partner.channelType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(partner.totalFunded)} • {partner.dealCount} deals
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    Top {Math.round(partner.percentileRank)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(partner.avgFeePercent)} avg fee
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Head-to-Head Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Head-to-Head Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partner Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Partner 1</label>
              <Select value={selectedPartner1} onValueChange={setSelectedPartner1}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select first partner" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {partners.map(partner => (
                    <SelectItem 
                      key={partner.partner} 
                      value={partner.partner}
                      disabled={partner.partner === selectedPartner2}
                    >
                      {partner.partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Partner 2</label>
              <Select value={selectedPartner2} onValueChange={setSelectedPartner2}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select second partner" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {partners.map(partner => (
                    <SelectItem 
                      key={partner.partner} 
                      value={partner.partner}
                      disabled={partner.partner === selectedPartner1}
                    >
                      {partner.partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Results */}
          {comparison && partner1Data && partner2Data ? (
            <div className="space-y-6">
              {/* Performance Radar Chart */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="text-sm font-semibold mb-4">Performance Comparison</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Radar
                      name={selectedPartner1}
                      dataKey={selectedPartner1}
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name={selectedPartner2}
                      dataKey={selectedPartner2}
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metric-by-Metric Comparison */}
              <div>
                <h4 className="text-sm font-semibold mb-4">Side-by-Side Metrics</h4>
                <div className="space-y-3">
                  {comparison.map((metric, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center p-4 rounded-lg bg-card/30 border border-border/50"
                    >
                      {/* Partner 1 Value */}
                      <div className={`text-right ${getWinnerColor(metric.winner, 'partner1')}`}>
                        <div className="text-lg font-semibold">
                          {metric.partner1Display}
                        </div>
                        {metric.winner === 'partner1' && (
                          <div className="text-xs text-success mt-1">
                            +{formatPercent(metric.differencePercent, 0)} ahead
                          </div>
                        )}
                      </div>

                      {/* Metric Label */}
                      <div className="text-center min-w-[120px]">
                        <div className="text-sm font-medium text-muted-foreground">
                          {metric.label}
                        </div>
                        {metric.winner !== 'tie' && (
                          <TrendingUp 
                            className={`h-4 w-4 mx-auto mt-1 ${
                              metric.winner === 'partner1' ? 'rotate-180' : ''
                            } text-primary`}
                          />
                        )}
                      </div>

                      {/* Partner 2 Value */}
                      <div className={`text-left ${getWinnerColor(metric.winner, 'partner2')}`}>
                        <div className="text-lg font-semibold">
                          {metric.partner2Display}
                        </div>
                        {metric.winner === 'partner2' && (
                          <div className="text-xs text-success mt-1">
                            +{formatPercent(metric.differencePercent, 0)} ahead
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Win Summary */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-card/30 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-chart-1">
                    {comparison.filter(m => m.winner === 'partner1').length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedPartner1} Wins
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {comparison.filter(m => m.winner === 'tie').length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ties
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-chart-2">
                    {comparison.filter(m => m.winner === 'partner2').length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedPartner2} Wins
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select two partners to compare their performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
