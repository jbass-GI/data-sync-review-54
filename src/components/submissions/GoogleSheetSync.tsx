import { useState } from 'react';
import { RefreshCw, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchGoogleSheetData } from '@/lib/parseGoogleSheet';
import { Submission, DataQualityMetrics } from '@/types/submission';

interface GoogleSheetSyncProps {
  onDataLoaded: (
    submissions: Submission[],
    dataQuality: DataQualityMetrics,
    normalizationLog: { original: string; normalized: string }[]
  ) => void;
  lastSyncTime?: Date | null;
}

export function GoogleSheetSync({ onDataLoaded, lastSyncTime }: GoogleSheetSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const result = await fetchGoogleSheetData();
      onDataLoaded(result.submissions, result.dataQuality, result.normalizationLog);
      setSyncStatus('success');
      
      toast({
        title: "Data synced successfully",
        description: `Loaded ${result.submissions.length} submissions from Google Sheets`,
      });
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to fetch data from Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Google Sheets Live Sync</h3>
              <p className="text-sm text-muted-foreground">
                {lastSyncTime 
                  ? `Last synced: ${lastSyncTime.toLocaleTimeString()}`
                  : 'Pull real-time data from connected sheet'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {syncStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {syncStatus === 'error' && (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
