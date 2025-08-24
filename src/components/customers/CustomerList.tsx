
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Database } from "@/types/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerRow } from "./CustomerRow";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerListProps {
  customers: Customer[];
  pointsValueCents: number;
  inModal?: boolean;
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerList = ({
  customers,
  pointsValueCents,
  inModal = false,
  onCustomerSelect,
}: CustomerListProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Points Balance</TableHead>
            <TableHead>Points Value</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                pointsValueCents={pointsValueCents}
                inModal={inModal}
                onCustomerSelect={onCustomerSelect}
              />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
