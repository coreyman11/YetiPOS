import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Bell, 
  LogOut,
  Building2,
  ToggleLeft,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useVendorAdminStatus } from '@/hooks/useVendorAdminStatus';

interface VendorLayoutProps {
  children?: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  
  // Check if user is vendor admin from the userProfile role
  const isVendorAdmin = userProfile?.role === 'Vendor Admin' || userProfile?.role_name === 'Vendor Admin';
  
  // Show loading while user profile is loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not vendor admin
  if (!isVendorAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have vendor admin permissions to access this area.
          </p>
          <Link to="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      path: '/vendor-admin',
      label: 'Overview',
      icon: BarChart3,
    },
    {
      path: '/vendor-admin/customers',
      label: 'Customer Management',
      icon: Users,
    },
    {
      path: '/vendor-admin/features',
      label: 'Feature Management',
      icon: ToggleLeft,
    },
    {
      path: '/vendor-admin/audit',
      label: 'Audit Logs',
      icon: History,
    },
    {
      path: '/vendor-admin/settings',
      label: 'Vendor Settings',
      icon: Settings,
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/vendor-admin') {
      return location.pathname === '/vendor-admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Vendor Admin Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Vendor Admin Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Vendor Admin</h1>
              <p className="text-sm text-muted-foreground">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-border space-y-3">
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || 'V'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userProfile?.full_name || 'Vendor Admin'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userProfile?.email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Link to="/" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                Customer View
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="px-3"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {navigationItems.find(item => isActivePath(item.path))?.label || 'Vendor Admin'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;