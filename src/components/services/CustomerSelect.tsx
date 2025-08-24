
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Plus, User } from "lucide-react";

interface CustomerSelectProps {
  selectedCustomer: any | null;
  onCustomerSelect: (customer: any | null) => void;
}

export const CustomerSelect = ({
  selectedCustomer,
  onCustomerSelect,
}: CustomerSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", searchQuery],
    queryFn: async () => {
      const query = supabase
        .from("customers")
        .select("id, name, email, phone, first_name, last_name, loyalty_points, created_at, location_id")
        .order("name", { ascending: true });

      if (searchQuery) {
        query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-search">Customer</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {selectedCustomer ? (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{selectedCustomer.name}</div>
              {selectedCustomer.email && (
                <div className="text-xs text-muted-foreground">
                  {selectedCustomer.email}
                </div>
              )}
              {selectedCustomer.phone && (
                <div className="text-xs text-muted-foreground">
                  {selectedCustomer.phone}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCustomerSelect(null)}
          >
            Clear
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-40 rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : customers.length > 0 ? (
            <div className="p-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent text-left"
                  onClick={() => onCustomerSelect(customer)}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.email || customer.phone || "No contact info"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No customers found
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-auto"
                  onClick={() => {
                    // This would typically open a dialog to add a new customer
                    // For now, we'll just log a message
                    console.log("Would open dialog to add customer");
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Customer
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};
