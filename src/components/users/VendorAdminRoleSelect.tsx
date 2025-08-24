import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VendorAdminRoleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  includeVendorAdmin?: boolean;
}

export const VendorAdminRoleSelect: React.FC<VendorAdminRoleSelectProps> = ({
  value,
  onValueChange,
  includeVendorAdmin = false,
}) => {
  const { data: roles = [] } = useQuery({
    queryKey: ['vendor-admin-roles', includeVendorAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, role_scope')
        .order('name');
      
      if (error) throw error;

      // Filter roles based on includeVendorAdmin flag
      if (includeVendorAdmin) {
        return data || [];
      } else {
        return data?.filter(role => role.role_scope !== 'vendor') || [];
      }
    },
  });

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.name} value={role.name}>
            {role.name}
            {role.role_scope === 'vendor' && (
              <span className="ml-2 text-xs text-orange-600">(Vendor)</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};