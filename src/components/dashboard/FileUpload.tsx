import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileUpload(file);
      toast({
        title: "File uploaded",
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      toast({
        title: "File uploaded",
        description: `Processing ${file.name}...`,
      });
    }
  };

  return (
    <Card 
      className="p-8 border-2 border-dashed border-border/50 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label className="flex flex-col items-center justify-center cursor-pointer">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
        <p className="text-sm text-muted-foreground text-center">
          Drag and drop your Excel file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supports .xlsx and .xls formats
        </p>
      </label>
    </Card>
  );
}
