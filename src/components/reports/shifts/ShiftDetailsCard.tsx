
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, CreditCard, Receipt, AlertTriangle } from 'lucide-react';

interface ShiftDetailsCardProps {
  shift: any;
}

export const ShiftDetailsCard = ({ shift }: ShiftDetailsCardProps) => {
  const calculateDuration = () => {
    if (!shift.end_time) return 'Active';
    
    const start = new Date(shift.start_time).getTime();
    const end = new Date(shift.end_time).getTime();
    const durationInHours = (end - start) / (1000 * 60 * 60);
    
    const hours = Math.floor(durationInHours);
    const minutes = Math.floor((durationInHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Shift #{shift.id}: {shift.name}</CardTitle>
          <Badge variant={shift.status === 'active' ? "default" : "secondary"}>
            {shift.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Shift Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Cashier</span>
                  </div>
                  <span className="font-medium">
                    {shift.user_profile?.full_name || shift.assigned_user_id || 'Unassigned'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Start Time</span>
                  </div>
                  <span className="font-medium">
                    {format(parseISO(shift.start_time), 'PPP p')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">End Time</span>
                  </div>
                  <span className="font-medium">
                    {shift.end_time ? format(parseISO(shift.end_time), 'PPP p') : 'Active'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <span className="font-medium">
                    {calculateDuration()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Financial Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Opening Balance</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(shift.opening_balance || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Closing Balance</span>
                  </div>
                  <span className="font-medium">
                    {shift.closing_balance !== null ? formatCurrency(shift.closing_balance) : '-'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Sales</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(shift.total_sales || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${shift.cash_discrepancy < 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Cash Discrepancy</span>
                  </div>
                  <span className={`font-medium ${shift.cash_discrepancy < 0 ? 'text-amber-500' : shift.cash_discrepancy > 0 ? 'text-green-500' : ''}`}>
                    {shift.cash_discrepancy !== null ? formatCurrency(shift.cash_discrepancy) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-3">Transaction Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Cash Sales</span>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(shift.total_sales || 0)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Card Sales</span>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(0)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-indigo-500" />
                    <span className="font-medium">Transactions</span>
                  </div>
                  <span className="text-lg font-bold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
