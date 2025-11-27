import { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataUploadOptionsProps {
  onFileUpload: (file: File, mode: 'replace' | 'append') => void;
  hasExistingData: boolean;
}

export function DataUploadOptions({ onFileUpload, hasExistingData }: DataUploadOptionsProps) {
  const { toast } = useToast();
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'append') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileUpload(file, mode);
        toast({
          title: mode === 'append' ? "Adding more data" : "Replacing data",
          description: `Processing ${file.name}...`,
        });
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
      // Reset the input
      e.target.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, mode: 'replace' | 'append') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileUpload(file, mode);
      toast({
        title: mode === 'append' ? "Adding more data" : "Replacing data",
        description: `Processing ${file.name}...`,
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
    }
  }, [onFileUpload, toast]);

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        Upload Data
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Replace Data Option */}
        <div
          className="relative border-2 border-dashed border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer bg-background/50"
          onDrop={(e) => handleDrop(e, 'replace')}
          onDragOver={(e) => e.preventDefault()}
        >
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileInput(e, 'replace')}
              className="hidden"
            />
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-1">Replace All Data</h4>
            <p className="text-xs text-muted-foreground text-center">
              Upload a new file and replace all existing deals
            </p>
          </label>
        </div>

        {/* Append Data Option */}
        <div
          className="relative border-2 border-dashed border-border/50 rounded-lg p-6 hover:border-success/50 transition-colors cursor-pointer bg-background/50"
          onDrop={(e) => handleDrop(e, 'append')}
          onDragOver={(e) => e.preventDefault()}
        >
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileInput(e, 'append')}
              className="hidden"
            />
            <div className="p-3 bg-success/10 rounded-full mb-3">
              <Plus className="w-6 h-6 text-success" />
            </div>
            <h4 className="font-semibold mb-1">Add More Data</h4>
            <p className="text-xs text-muted-foreground text-center">
              Upload additional deals and merge with existing data
            </p>
          </label>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Supports .xlsx and .xls formats • Drag and drop or click to browse
      </p>
    </Card>
  );
}
