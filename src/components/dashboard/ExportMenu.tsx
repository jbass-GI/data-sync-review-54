import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Deal } from '@/types/dashboard';
import { PartnerMetrics, DashboardMetrics } from '@/types/dashboard';
import {
  exportDealsToExcel,
  exportPartnerMetricsToExcel,
  exportDashboardToExcel,
  exportDashboardToPDF,
  getFilterDescription
} from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportMenuProps {
  deals: Deal[];
  partners: PartnerMetrics[];
  metrics: DashboardMetrics | null;
  filters: any;
}

export function ExportMenu({ deals, partners, metrics, filters }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: 'deals-excel' | 'partners-excel' | 'full-excel' | 'pdf') => {
    setIsExporting(true);
    
    try {
      const filterDesc = getFilterDescription(filters);

      switch (type) {
        case 'deals-excel':
          await exportDealsToExcel(deals);
          toast({
            title: "Export successful",
            description: "Deals data exported to Excel",
          });
          break;

        case 'partners-excel':
          await exportPartnerMetricsToExcel(partners);
          toast({
            title: "Export successful",
            description: "Partner metrics exported to Excel",
          });
          break;

        case 'full-excel':
          await exportDashboardToExcel(deals, partners, metrics, filterDesc);
          toast({
            title: "Export successful",
            description: "Complete dashboard exported to Excel",
          });
          break;

        case 'pdf':
          // Get chart elements for PDF export
          const chartElements: HTMLElement[] = [];
          const dealTypeChart = document.querySelector('[data-chart="deal-type"]') as HTMLElement;
          const trendChart = document.querySelector('[data-chart="trends"]') as HTMLElement;
          
          if (dealTypeChart) chartElements.push(dealTypeChart);
          if (trendChart) chartElements.push(trendChart);

          await exportDashboardToPDF(metrics, partners, deals, filterDesc, chartElements);
          toast({
            title: "Export successful",
            description: "Dashboard report exported to PDF",
          });
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('full-excel')}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Complete Dashboard (Excel)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Dashboard Report (PDF)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('deals-excel')}
          className="cursor-pointer"
        >
          <FileDown className="mr-2 h-4 w-4" />
          <span>Deals Only (Excel)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('partners-excel')}
          className="cursor-pointer"
        >
          <FileDown className="mr-2 h-4 w-4" />
          <span>Partner Metrics (Excel)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
