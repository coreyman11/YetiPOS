
import { Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface ContactInformationProps {
  selectedCustomer: Customer;
  editingCustomer: Customer | null;
  onUpdate: (customer: Customer) => void;
}

export const ContactInformation = ({
  selectedCustomer,
  editingCustomer,
  onUpdate,
}: ContactInformationProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Contact Information</h3>
      <div className="space-y-2">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Email</label>
          {editingCustomer ? (
            <Input
              value={editingCustomer.email}
              onChange={(e) => onUpdate({
                ...editingCustomer,
                email: e.target.value
              })}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${selectedCustomer.email}`} className="hover:underline">
                {selectedCustomer.email}
              </a>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Phone</label>
          {editingCustomer ? (
            <Input
              value={editingCustomer.phone}
              onChange={(e) => onUpdate({
                ...editingCustomer,
                phone: e.target.value
              })}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">
                {selectedCustomer.phone}
              </a>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Mobile</label>
          {editingCustomer ? (
            <Input
              value={editingCustomer.mobile}
              onChange={(e) => onUpdate({
                ...editingCustomer,
                mobile: e.target.value
              })}
            />
          ) : (
            selectedCustomer.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={`tel:${selectedCustomer.mobile}`} className="hover:underline">
                  {selectedCustomer.mobile}
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
