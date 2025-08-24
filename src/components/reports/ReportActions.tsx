
import { Button } from "@/components/ui/button";
import { Printer, Download, RefreshCw } from "lucide-react";

interface ReportActionsProps {
  onExport: () => void;
  onPrint: () => void;
  onRefresh: () => void;
  isExporting?: boolean;
}

export const ReportActions = ({ 
  onExport, 
  onPrint, 
  onRefresh,
  isExporting = false
}: ReportActionsProps) => {
  return (
    <div className="flex space-x-2 mt-4 justify-end">
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExport}
        disabled={isExporting}
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};
