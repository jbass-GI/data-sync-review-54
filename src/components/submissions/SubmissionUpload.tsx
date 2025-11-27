import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { parseSubmissionsFile } from '@/lib/parseSubmissions';
import { Submission, DataQualityMetrics } from '@/types/submission';

interface SubmissionUploadProps {
  onDataLoaded: (
    submissions: Submission[],
    dataQuality: DataQualityMetrics,
    normalizationLog: { original: string; normalized: string }[]
  ) => void;
}

export function SubmissionUpload({ onDataLoaded }: SubmissionUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const result = await parseSubmissionsFile(file);
      onDataLoaded(result.submissions, result.dataQuality, result.normalizationLog);
      
      toast({
        title: "Data loaded successfully",
        description: `Processed ${result.submissions.length} submissions`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onDataLoaded, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      handleFileUpload({ target: input } as any);
    }
  }, [handleFileUpload]);

  return (
    <Card 
      className="border-2 border-dashed border-border hover:border-primary/50 transition-colors"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Upload Monday.com Export</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Drag and drop your CSV/Excel file or click to browse
        </p>
        
        <label htmlFor="file-upload">
          <Button disabled={isUploading} asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Processing...' : 'Choose File'}
            </span>
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        
        <p className="text-xs text-muted-foreground mt-4">
          Supports CSV and Excel formats
        </p>
      </div>
    </Card>
  );
}
