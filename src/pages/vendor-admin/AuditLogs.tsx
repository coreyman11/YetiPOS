import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  History, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  User,
  Building2,
  Activity,
  ToggleLeft,
  Eye,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  location_id: string;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: string;
  admin_user?: {
    full_name: string;
    email: string;
  };
  location?: {
    name: string;
  };
}

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Get audit logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['vendor-audit-logs', searchTerm, selectedAction, selectedLocation, selectedDate],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('vendor_admin_audit_log')
        .select(`
          *,
          admin_user:user_profiles!admin_user_id(full_name, email),
          location:locations(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation);
      }

      if (selectedDate) {
        const startDate = startOfDay(selectedDate);
        const endDate = endOfDay(selectedDate);
        query = query.gte('created_at', startDate.toISOString())
                   .lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).filter(log => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          log.action.toLowerCase().includes(searchLower) ||
          log.target_type.toLowerCase().includes(searchLower) ||
          log.admin_user?.full_name?.toLowerCase().includes(searchLower) ||
          log.admin_user?.email?.toLowerCase().includes(searchLower) ||
          log.location?.name?.toLowerCase().includes(searchLower)
        );
      });
    }
  });

  // Get unique actions for filter
  const { data: actions = [] } = useQuery({
    queryKey: ['vendor-audit-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_admin_audit_log')
        .select('action')
        .order('action');
      
      if (error) throw error;
      return [...new Set((data || []).map(item => item.action))];
    }
  });

  // Get locations for filter
  const { data: locations = [] } = useQuery({
    queryKey: ['vendor-audit-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted')) return 'destructive';
    if (action.includes('enabled')) return 'default';
    if (action.includes('disabled')) return 'outline';
    return 'outline';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('feature_toggle')) return ToggleLeft;
    if (action.includes('user')) return User;
    return Activity;
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleExportLogs = () => {
    // Implementation for exporting logs would go here
    console.log('Exporting logs...');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all vendor admin actions and system changes.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Action Filter */}
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
                {selectedDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(undefined)}
                      className="w-full"
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-4">
        {logs.map((log) => {
          const ActionIcon = getActionIcon(log.action);
          const isExpanded = expandedLog === log.id;
          
          return (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.target_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{log.admin_user?.full_name || log.admin_user?.email || 'Unknown'}</span>
                        </div>
                        {log.location && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3" />
                            <span>{log.location.name}</span>
                          </div>
                        )}
                        <span>{format(new Date(log.created_at), 'PPp')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm">
                    {/* Target ID */}
                    <div>
                      <label className="font-medium text-muted-foreground">Target ID:</label>
                      <p className="mt-1 font-mono text-xs bg-muted p-2 rounded">
                        {log.target_id}
                      </p>
                    </div>

                    {/* Old Values */}
                    {log.old_values && (
                      <div>
                        <label className="font-medium text-muted-foreground">Previous Values:</label>
                        <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.old_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* New Values */}
                    {log.new_values && (
                      <div>
                        <label className="font-medium text-muted-foreground">New Values:</label>
                        <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Metadata */}
                    {log.metadata && (
                      <div>
                        <label className="font-medium text-muted-foreground">Metadata:</label>
                        <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {logs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedAction !== 'all' || selectedLocation !== 'all' || selectedDate
                ? 'Try adjusting your filters to see more results.'
                : 'No admin actions have been logged yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLogs;