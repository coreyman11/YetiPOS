
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface StaffSelectorProps {
  selectedCashier: string;
  onCashierSelect: (id: string) => void;
  users: any[];
  currentUserId?: string;
}

export const StaffSelector = ({
  selectedCashier,
  onCashierSelect,
  users,
  currentUserId,
}: StaffSelectorProps) => {
  // Auto-select current user if no cashier is selected
  useEffect(() => {
    if (!selectedCashier && currentUserId) {
      onCashierSelect(currentUserId);
    }
  }, [selectedCashier, currentUserId, onCashierSelect]);

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Assigned Staff</div>
      <Select
        value={selectedCashier}
        onValueChange={onCashierSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select staff member" />
        </SelectTrigger>
        <SelectContent>
          {users && users.length > 0 ? (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email || "Unnamed Staff"}
                {currentUserId && user.id === currentUserId ? " (You)" : ""}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-users" disabled>No staff members found</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
