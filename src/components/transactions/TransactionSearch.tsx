
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransactionSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: string) => void
  pageSizeOptions: number[]
}

export const TransactionSearch = ({
  searchQuery,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions
}: TransactionSearchProps) => {
  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by transaction ID, customer, items, date, or amount..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={onPageSizeChange}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} items
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
