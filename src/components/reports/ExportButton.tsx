
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { format as formatDate } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

export type ExportFormat = "csv" | "excel" | "pdf";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const generateFinancialReportPDF = (pdfData: any, filename: string) => {
  const doc = new jsPDF();
  const { title, dateRange, metrics } = pdfData;
  
  // Set up fonts and styles
  doc.setFontSize(20);
  doc.text(title, 20, 30);
  
  doc.setFontSize(12);
  doc.text(`${formatDate(dateRange.from, 'MMM dd, yyyy')} – ${formatDate(dateRange.to, 'MMM dd, yyyy')}`, 20, 45);
  
  let yPos = 70;
  
  // Revenue Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Revenue', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Gross Sales', 25, yPos);
  doc.text(formatCurrency(metrics.totalSales), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Less: Refunds', 25, yPos);
  doc.text(`-${formatCurrency(metrics.totalRefunds)}`, 150, yPos, { align: 'right' });
  yPos += 10;
  
  // Draw line
  doc.line(25, yPos, 150, yPos);
  yPos += 8;
  
  doc.setFont(undefined, 'bold');
  doc.text('Net Sales', 25, yPos);
  doc.text(formatCurrency(metrics.netSales), 150, yPos, { align: 'right' });
  yPos += 25;
  
  // Taxes Section
  doc.setFontSize(14);
  doc.text('Taxes', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Taxes Collected', 25, yPos);
  doc.text(formatCurrency(metrics.taxesCollected), 150, yPos, { align: 'right' });
  yPos += 25;
  
  // Payment Breakdown Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Payment Breakdown', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Cash', 25, yPos);
  doc.text(formatCurrency(metrics.cashPayments), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Card', 25, yPos);
  doc.text(formatCurrency(metrics.cardPayments), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Gift Card', 25, yPos);
  doc.text(formatCurrency(metrics.giftCardPayments), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Other', 25, yPos);
  doc.text(formatCurrency(metrics.otherPayments), 150, yPos, { align: 'right' });
  yPos += 25;
  
  // Operational Metrics Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Operational Metrics', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Transactions', 25, yPos);
  doc.text(formatNumber(metrics.transactionCount), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Average Ticket', 25, yPos);
  doc.text(formatCurrency(metrics.avgTicketSize), 150, yPos, { align: 'right' });
  yPos += 10;
  
  doc.text('Unique Customers', 25, yPos);
  doc.text(formatNumber(metrics.uniqueCustomers), 150, yPos, { align: 'right' });
  yPos += 20;
  
  // Footer
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated ${formatDate(new Date(), 'MMM dd, yyyy h:mm a')}`, 20, yPos);
  
  // Save the PDF
  doc.save(`${filename}-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const generateTablePDF = (data: any[], filename: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Data Export', 20, 20);
  
  // Simple table representation - this could be enhanced with a table library
  let yPos = 40;
  doc.setFontSize(10);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    doc.text(headers.join(' | '), 20, yPos);
    yPos += 10;
    
    data.slice(0, 40).forEach((row) => { // Limit to 40 rows to fit on page
      const values = headers.map(header => String(row[header] || ''));
      doc.text(values.join(' | '), 20, yPos);
      yPos += 8;
      
      if (yPos > 280) { // Start new page if needed
        doc.addPage();
        yPos = 20;
      }
    });
  }
  
  doc.save(`${filename}-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
};

interface ExportButtonProps {
  data: any[];
  filename: string;
  format?: ExportFormat;
  disabled?: boolean;
  transformData?: (data: any[]) => any[];
  pdfData?: {
    title: string;
    dateRange: { from: Date; to: Date };
    metrics: any;
  };
}

export const ExportButton = ({
  data,
  filename,
  format = "excel",
  disabled = false,
  transformData,
  pdfData
}: ExportButtonProps) => {
  const { toast } = useToast();
  
  const handleExport = () => {
    // For PDF with pdfData, we don't need to check data length
    if (format === "pdf" && pdfData) {
      // PDF with custom data - proceed without validation
    } else if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = transformData ? transformData(data) : data;
    
    try {
      if (format === "excel" || format === "csv") {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        // Auto-size columns
        const colWidths = exportData.reduce((acc, row) => {
          Object.keys(row).forEach((key) => {
            const length = (row[key]?.toString() || '').length;
            acc[key] = Math.max(acc[key] || 0, length);
          });
          return acc;
        }, {});
        
        ws['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] + 2 }));
        
        const fileExtension = format === "excel" ? "xlsx" : "csv";
        // Define bookType for XLSX export
        const bookType = format === "excel" ? "xlsx" : "csv";
        
        XLSX.writeFile(wb, `${filename}-${formatDate(new Date(), 'yyyy-MM-dd')}.${fileExtension}`, {
          bookType: bookType as XLSX.BookType
        });
      } else if (format === "pdf") {
        if (pdfData) {
          generateFinancialReportPDF(pdfData, filename);
        } else {
          generateTablePDF(exportData, filename);
        }
      }
      
      toast({
        title: "Export successful",
        description: `Your data has been exported to ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto"
      onClick={handleExport}
      disabled={disabled || (format !== "pdf" && (!data || data.length === 0)) || (format === "pdf" && !pdfData && (!data || data.length === 0))}
    >
      {format === "pdf" ? (
        <FileText className="mr-2 h-4 w-4" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      Export {format.toUpperCase()}
    </Button>
  );
};
