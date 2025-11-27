import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parseFundingFile } from '@/lib/parseFunding';
import { FundingRecord } from '@/types/funding';

interface FundingUploadProps {
  onDataLoaded: (fundingRecords: FundingRecord[]) => void;
}

export function FundingUpload({ onDataLoaded }: FundingUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const fundingRecords = await parseFundingFile(file);
      
      onDataLoaded(fundingRecords);
      
      toast({
        title: "Funding data loaded successfully",
        description: `Parsed ${fundingRecords.length} funding records`,
      });
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse funding ledger",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileSpreadsheet className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Upload Funding Ledger</h3>
          <p className="text-sm text-muted-foreground">
            Upload your funding ledger to calculate conversion metrics
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Upload Excel or CSV file</p>
            <p className="text-xs text-muted-foreground">
              File should contain: Deal Name, Funding Date, Funded Amount, Mgmt Fee, Partner/ISO
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
            id="funding-file-input"
          />
          <label htmlFor="funding-file-input">
            <Button asChild disabled={isProcessing}>
              <span>
                {isProcessing ? 'Processing...' : 'Choose File'}
              </span>
            </Button>
          </label>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Tip:</strong> Deal names will be automatically matched to submissions</p>
          <p>📊 Expected columns: Deal Name, Funding Date, Funded Amount, Management Fee, Partner</p>
        </div>
      </div>
    </Card>
  );
}
