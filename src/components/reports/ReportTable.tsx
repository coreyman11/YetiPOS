import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportTableProps {
  data: any[];
  columns: any[];
  isLoading?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  columns,
  isLoading = false,
  searchable = false,
  sortable = false,
  emptyMessage = "No data available",
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const cellValue = column.cell 
          ? column.cell(item) 
          : String(item[column.key] ?? "");
          
        return String(cellValue)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortBy);
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      if (column?.cell) {
        valueA = column.cell(a);
        valueB = column.cell(b);
        
        // Strip out any HTML tags or non-alphanumeric characters
        if (typeof valueA === 'string') valueA = valueA.replace(/<[^>]*>/g, '').replace(/[^0-9a-zA-Z.]/g, '');
        if (typeof valueB === 'string') valueB = valueB.replace(/<[^>]*>/g, '').replace(/[^0-9a-zA-Z.]/g, '');
      }
      
      if (valueA === valueB) return 0;
      
      // Try to parse as numbers if possible
      const numA = parseFloat(valueA);
      const numB = parseFloat(valueB);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
      
      // Otherwise treat as strings
      valueA = String(valueA || "").toLowerCase();
      valueB = String(valueB || "").toLowerCase();
      
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortDirection, columns]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {searchable && (
          <div className="mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}

        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead
                      key={column.key}
                      className={
                        sortable && column.sortable
                          ? "cursor-pointer hover:text-primary transition-colors"
                          : ""
                      }
                      onClick={() => {
                        if (sortable && column.sortable) {
                          handleSort(column.key);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {sortable && column.sortable && sortBy === column.key && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex}
                    className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map(column => (
                      <TableCell key={`${rowIndex}-${column.key}`}>
                        {column.cell ? column.cell(row) : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
