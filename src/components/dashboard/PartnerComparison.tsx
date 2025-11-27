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
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trophy, TrendingUp, Users, Target, Award, Crown, Zap, ArrowUpDown } from 'lucide-react';
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

type RankingSortField = 'rank' | 'partner' | 'consistencyScore' | 'totalFunded' | 'totalFees' | 'avgFeePerDeal' | 'dealCount' | 'avgTicketSize' | 'avgFeePercent';
type SortDirection = 'asc' | 'desc';

export function PartnerComparison({ partners }: PartnerComparisonProps) {
  const [selectedPartner1, setSelectedPartner1] = useState<string>('');
  const [selectedPartner2, setSelectedPartner2] = useState<string>('');
  const [sortField, setSortField] = useState<RankingSortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const rankings = calculatePartnerRankings(partners);
  
  const handleSort = (field: RankingSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'partner':
        aValue = a.partner;
        bValue = b.partner;
        break;
      case 'consistencyScore':
        aValue = a.consistencyScore || 0;
        bValue = b.consistencyScore || 0;
        break;
      case 'avgFeePerDeal':
        aValue = a.dealCount > 0 ? a.totalFees / a.dealCount : 0;
        bValue = b.dealCount > 0 ? b.totalFees / b.dealCount : 0;
        break;
      default:
        aValue = a[sortField];
        bValue = b[sortField];
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const topPartners = sortedRankings.slice(0, 10); // Show top 10 partners

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
      <Card className="hover:card-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <span className="text-gradient">Partner Rankings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th 
                    className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('partner')}
                  >
                    <div className="flex items-center gap-1">
                      Partner
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('consistencyScore')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Consistency
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('totalFunded')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Funded
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('totalFees')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Fees
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('avgFeePerDeal')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Fee/Deal
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('dealCount')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Deals
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('avgTicketSize')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Ticket
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('avgFeePercent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Fee %
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">New/Renewal</th>
                </tr>
              </thead>
              <tbody>
                {topPartners.map((partner) => (
                  <tr
                    key={partner.partner}
                    className="border-b border-border/20 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        {getRankIcon(partner.rank)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm">{partner.partner}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {partner.channelType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {partner.consistencyScore !== undefined && partner.consistencyScore > 0 ? (
                        <TooltipProvider>
                          <TooltipUI>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                <div className="flex items-center gap-1">
                                  <Zap className="h-4 w-4 text-warning" />
                                  <span className={`text-sm font-semibold ${
                                    partner.consistencyScore >= 70 ? 'text-success' :
                                    partner.consistencyScore >= 40 ? 'text-warning' :
                                    'text-muted-foreground'
                                  }`}>
                                    {partner.consistencyScore}
                                  </span>
                                </div>
                                {partner.consecutiveBusinessDays !== undefined && partner.consecutiveBusinessDays > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {partner.consecutiveBusinessDays}d streak
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <p className="font-semibold text-sm mb-2">Consistency Breakdown</p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Funding Day Streak:</span>
                                    <span className="font-semibold">{partner.consecutiveBusinessDays || 0} days</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Multiple deal days:</span>
                                    <span className="font-semibold">{partner.daysWithMultipleDeals || 0} days</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Max deals in day:</span>
                                    <span className="font-semibold">{partner.maxDealsInDay || 0} deals</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Consecutive new deals:</span>
                                    <span className="font-semibold">{partner.consecutiveNewDeals || 0}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Consecutive renewals:</span>
                                    <span className="font-semibold">{partner.consecutiveRenewalDeals || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </TooltipUI>
                        </TooltipProvider>
                      ) : (
                        <div className="text-center text-xs text-muted-foreground">-</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-sm">{formatCurrency(partner.totalFunded)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-sm text-success">{formatCurrency(partner.totalFees)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-sm text-primary">
                        {formatCurrency(partner.dealCount > 0 ? partner.totalFees / partner.dealCount : 0)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {partner.dealCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm text-muted-foreground">{formatCurrency(partner.avgTicketSize)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm text-muted-foreground">{formatPercent(partner.avgFeePercent)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <span className="text-chart-1 font-medium">{partner.newDealsCount}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-chart-2 font-medium">{partner.renewalDealsCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Head-to-Head Comparison */}
      <Card className="hover:card-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-gradient">Head-to-Head Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-7xl mx-auto">
            {/* Partner Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Performance Radar Chart */}
                <div className="bg-card/30 rounded-lg p-6">
                  <h4 className="text-sm font-semibold mb-4">Performance Comparison</h4>
                  <div className="max-w-md mx-auto">
                    <ResponsiveContainer width="100%" height={300}>
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
                </div>

                {/* Metric-by-Metric Comparison */}
                <div>
                  <h4 className="text-sm font-semibold mb-4">Metric Breakdown</h4>
                  <div className="space-y-2 max-w-2xl">
                    {comparison.map((metric, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center p-3 rounded-lg bg-card/30 border border-border/50"
                      >
                        {/* Partner 1 Value */}
                        <div className={`text-right ${getWinnerColor(metric.winner, 'partner1')}`}>
                          <div className="text-sm font-semibold">
                            {metric.partner1Display}
                          </div>
                          {metric.winner === 'partner1' && (
                            <div className="text-xs text-success mt-0.5">
                              +{formatPercent(metric.differencePercent, 0)}
                            </div>
                          )}
                        </div>

                        {/* Metric Label */}
                        <div className="text-center min-w-[100px]">
                          <div className="text-xs font-medium text-muted-foreground">
                            {metric.label}
                          </div>
                          {metric.winner !== 'tie' && (
                            <TrendingUp 
                              className={`h-3 w-3 mx-auto mt-1 ${
                                metric.winner === 'partner1' ? 'rotate-180' : ''
                              } text-primary`}
                            />
                          )}
                        </div>

                        {/* Partner 2 Value */}
                        <div className={`text-left ${getWinnerColor(metric.winner, 'partner2')}`}>
                          <div className="text-sm font-semibold">
                            {metric.partner2Display}
                          </div>
                          {metric.winner === 'partner2' && (
                            <div className="text-xs text-success mt-0.5">
                              +{formatPercent(metric.differencePercent, 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Win Summary */}
                  <div className="grid grid-cols-3 gap-3 mt-6 p-4 bg-card/30 rounded-lg max-w-2xl">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-1">
                        {comparison.filter(m => m.winner === 'partner1').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Wins
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {comparison.filter(m => m.winner === 'tie').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Ties
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-2">
                        {comparison.filter(m => m.winner === 'partner2').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Wins
                      </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
