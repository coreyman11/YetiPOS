import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Crown } from 'lucide-react';
import { Customer } from '@/pages/services/hooks/payment/types';

interface StorefrontCustomerIndicatorProps {
  customer: Customer;
  onClearCustomer?: () => void;
}

export const StorefrontCustomerIndicator: React.FC<StorefrontCustomerIndicatorProps> = ({
  customer,
  onClearCustomer
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          Storefront Customer
        </span>
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{customer.name}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-sm text-muted-foreground">{customer.email}</span>
      </div>
      
      {customer.loyalty_points > 0 && (
        <Badge variant="secondary" className="text-xs">
          {customer.loyalty_points} points
        </Badge>
      )}
      
      {onClearCustomer && (
        <button
          onClick={onClearCustomer}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
};