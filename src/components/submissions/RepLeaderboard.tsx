import { useState } from 'react';
import { Trophy, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RepPerformance, getRepLeaderboard } from '@/lib/repPerformance';

interface RepLeaderboardProps {
  repPerformance: RepPerformance[];
}

export function RepLeaderboard({ repPerformance }: RepLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'conversion' | 'revenue' | 'volume'>('conversion');
  
  const leaderboard = getRepLeaderboard(repPerformance, sortBy, 5);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getValue = (rep: RepPerformance) => {
    switch (sortBy) {
      case 'conversion':
        return `${rep.overallConversionRate.toFixed(1)}%`;
      case 'revenue':
        return formatCurrency(rep.totalRevenue);
      case 'volume':
        return rep.totalSubmissions.toString();
    }
  };
  
  const podiumColors = [
    { bg: 'bg-yellow-100', border: 'border-yellow-400', medal: '🥇' },
    { bg: 'bg-gray-100', border: 'border-gray-400', medal: '🥈' },
    { bg: 'bg-orange-100', border: 'border-orange-400', medal: '🥉' }
  ];
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Rep Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Top performers across all ISOs (min. 5 submissions)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sortBy === 'conversion' ? 'default' : 'outline'}
            onClick={() => setSortBy('conversion')}
          >
            <Trophy className="w-4 h-4 mr-1" />
            By Conversion
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'revenue' ? 'default' : 'outline'}
            onClick={() => setSortBy('revenue')}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            By Revenue
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'volume' ? 'default' : 'outline'}
            onClick={() => setSortBy('volume')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            By Volume
          </Button>
        </div>
      </div>
      
      {/* Podium for top 3 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {topThree.map((rep, idx) => {
          const colors = podiumColors[idx];
          return (
            <div 
              key={`${rep.isoNormalized}-${rep.repName}`}
              className={`text-center p-6 rounded-lg ${colors.bg} border-2 ${colors.border}`}
            >
              <div className="text-5xl mb-3">{colors.medal}</div>
              <div className="font-semibold text-lg mb-1">{rep.repName}</div>
              <div className="text-sm text-muted-foreground mb-3">{rep.isoNormalized}</div>
              <div className="text-3xl font-bold">
                {getValue(rep)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {rep.fundedDeals}/{rep.totalSubmissions} funded
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Full leaderboard table */}
      {rest.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead>ISO</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead className="text-right">Funded</TableHead>
                <TableHead className="text-right">Conv %</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rest.map((rep, idx) => (
                <TableRow key={`${rep.isoNormalized}-${rep.repName}`}>
                  <TableCell className="font-medium">#{idx + 4}</TableCell>
                  <TableCell>{rep.repName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rep.isoNormalized}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{rep.totalSubmissions}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">{rep.fundedDeals}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={
                      rep.overallConversionRate >= 20 ? 'bg-green-600' :
                      rep.overallConversionRate >= 12 ? 'bg-amber-600' : 'bg-red-600'
                    }>
                      {rep.overallConversionRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rep.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
