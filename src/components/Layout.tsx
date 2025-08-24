import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Settings, ReceiptText, FileBarChart, ShoppingCart, Package, Wrench, Gift, Percent, ChevronRight, Store, ChevronLeft, Clock, MapPin, Receipt, CreditCard, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { StoreDropdown } from "@/components/StoreDropdown";
import { usePermissions } from "@/hooks/usePermissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogoSettings } from "@/hooks/useLogoSettings";
import { useDeviceType } from "@/hooks/use-mobile";
import { MobileNavigation } from "@/components/ui/mobile-navigation";
import { FeatureGuard } from "@/components/ui/FeatureGuard";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userProfile, activeUser, isContextSwitched } = useAuth();
  const { data: logoSettings } = useLogoSettings();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  // Use activeUser for display if context is switched
  const displayUser = activeUser || userProfile;
  const { hasPermission } = usePermissions();

  const isRegisterRoute = location.pathname === '/register';

  useEffect(() => {
    if (!isRegisterRoute && isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  }, [isRegisterRoute, isSidebarCollapsed]);

  // Check if user is vendor admin to show all routes
  const isVendorAdmin = userProfile?.role === 'Vendor Admin' || userProfile?.role_name === 'Vendor Admin';

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: 'view_dashboard' },
    { icon: ShoppingCart, label: "Register", path: "/register", permission: 'process_transactions' },
    { icon: Users, label: "Customers", path: "/customers", permission: 'view_customers' },
    { icon: CreditCard, label: "Memberships", path: "/memberships", permission: 'manage_memberships' },
    { icon: DollarSign, label: "Billing", path: "/billing", permission: 'manage_billing' },
    { icon: Package, label: "Inventory", path: "/inventory", permission: 'view_inventory' },
    { icon: ReceiptText, label: "Transactions", path: "/transactions", permission: 'view_transactions' },
    { icon: FileBarChart, label: "Reports", path: "/reports", permission: 'view_reports' },
    { icon: Store, label: "Portal", path: "/portal", permission: 'manage_stores' },
    { icon: Gift, label: "Gift Cards", path: "/gift-cards", permission: 'manage_gift_cards' },
    {
      icon: Wrench,
      label: "Configuration",
      children: [
        { icon: Gift, label: "Loyalty Program", path: "/configuration/loyalty-program", permission: 'manage_loyalty' },
        { icon: Percent, label: "Tax Settings", path: "/configuration/tax", permission: 'manage_taxes' },
        { icon: Receipt, label: "Receipts", path: "/configuration/receipts", permission: 'manage_receipts' },
        { icon: Users, label: "User Management", path: "/configuration/users", permission: 'view_users' },
        { icon: Clock, label: "Shift Management", path: "/configuration/shifts", permission: 'manage_shifts' },
        { icon: MapPin, label: "Locations", path: "/configuration/locations", permission: 'manage_locations' },
        { icon: Percent, label: "Discounts", path: "/configuration/discounts", permission: 'manage_discounts' },
        { icon: Package, label: "Label Generator", path: "/configuration/labels", permission: 'generate_labels' },
      ],
    },
    { icon: Settings, label: "Settings", path: "/settings", permission: 'manage_settings' },
  ] as Array<{
    icon: any;
    label: string;
    path?: string;
    permission?: string;
    children?: Array<{
      icon: any;
      label: string;
      path: string;
      permission?: string;
    }>;
  }>;

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const handleNavigation = (path: string) => {
    if (isRegisterRoute && isSidebarCollapsed && path !== '/register') {
      setIsSidebarCollapsed(false);
    }
    navigate(path);
  };

  const getUserInitials = () => {
    if (displayUser?.full_name) {
      const nameParts = displayUser.full_name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        return nameParts[0][0].toUpperCase();
      }
    }
    if (displayUser?.email) {
      return displayUser.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    return displayUser?.full_name || displayUser?.email || "User";
  };

  const renderDesktopMenuItem = (item: typeof menuItems[0]) => {
    if ('children' in item && item.children) {
      const isExpanded = expandedMenus.includes(item.label);
      // Always render parent - FeatureGuard will handle visibility of children
      
      
      return (
        <div key={item.label} className="space-y-1">
          <div 
            className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg cursor-pointer"
            onClick={() => toggleMenu(item.label)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {!isSidebarCollapsed && item.label}
              </div>
              {!isSidebarCollapsed && (
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              )}
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div className={`pl-4 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}>
              {item.children.map((child) => (
                <FeatureGuard key={child.path} permission={child.permission} requireBoth>
                  <button
                    onClick={() => handleNavigation(child.path)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      location.pathname === child.path
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <child.icon className="h-4 w-4" />
                    {child.label}
                  </button>
                </FeatureGuard>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <FeatureGuard key={item.path || item.label} permission={item.permission} requireBoth>
        <button
          onClick={() => item.path && handleNavigation(item.path)}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            location.pathname === item.path
              ? "bg-secondary text-secondary-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {!isSidebarCollapsed && item.label}
        </button>
      </FeatureGuard>
    );
  };

  const renderMobileMenuItem = (item: typeof menuItems[0]) => {
    if ('children' in item && item.children) {
      const isExpanded = expandedMenus.includes(item.label);
      // Always render parent - FeatureGuard will handle visibility of children
      
      return (
        <div key={item.label} className="space-y-1">
          <div 
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg cursor-pointer"
            onClick={() => toggleMenu(item.label)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
          <div className={`pl-4 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}>
            {item.children.map((child) => (
              <FeatureGuard key={child.path} permission={child.permission} requireBoth>
                <SidebarMenuItem className="list-none">
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => handleNavigation(child.path)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        location.pathname === child.path
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.label}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </FeatureGuard>
            ))}
          </div>
        </div>
      );
    }

    return (
      <FeatureGuard permission={item.permission} requireBoth>
        <SidebarMenuItem key={item.path} className="list-none">
          <SidebarMenuButton asChild>
            <button
              onClick={() => item.path && handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </FeatureGuard>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar className="md:hidden">
            <SidebarContent>
              <div className="p-4 border-b">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  {logoSettings?.logo_url ? (
                    <>
                      <img 
                        src={logoSettings.logo_url} 
                        alt="Company logo"
                        className="h-6 w-auto max-w-[100px] object-contain"
                      />
                      <span className="text-xs text-muted-foreground">
                        Powered by Timber
                      </span>
                    </>
                  ) : (
                    <h1 className="text-lg font-semibold">
                      TimberPOS
                    </h1>
                  )}
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <SidebarGroup>
                  <SidebarGroupContent>
                    {menuItems.map((item) => renderMobileMenuItem(item))}
                  </SidebarGroupContent>
                </SidebarGroup>
              </ScrollArea>
              
              <SidebarFooter className="border-t p-4">
                <div className="space-y-4">
                  <StoreDropdown />
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium line-clamp-1">
                        {getUserDisplayName()}
                        {isContextSwitched && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Cashier Mode
                          </span>
                        )}
                      </p>
                      {displayUser?.role && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {displayUser.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </SidebarFooter>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 overflow-hidden">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                {logoSettings?.logo_url ? (
                  <>
                    <img 
                      src={logoSettings.logo_url} 
                      alt="Company logo"
                      className="h-6 w-auto max-w-[100px] object-contain"
                    />
                    <span className="text-xs text-muted-foreground">
                      Powered by Timber
                    </span>
                  </>
                ) : (
                  <h1 className="text-lg font-semibold">
                    TimberPOS
                  </h1>
                )}
              </div>
              <SidebarTrigger />
            </div>
            
            {/* Main Content */}
            <div className="p-2 pb-20 h-[calc(100vh-64px)] overflow-auto">
              <Outlet />
            </div>
            
            {/* Mobile Bottom Navigation */}
            <MobileNavigation />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Desktop/Tablet Layout - Simple flex structure
  return (
    <div className="min-h-screen flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Always visible */}
      <div 
        className={`flex flex-col border-r bg-white transition-all duration-300 h-full ${
          isSidebarCollapsed && isRegisterRoute ? 'w-[60px]' : 'w-[280px]'
        }`}
      >
        {/* Header */}
        <div className="p-3 py-4 flex-shrink-0 border-b">
          <div className="flex items-center justify-between mb-2 px-4">
            {(!isSidebarCollapsed || !isRegisterRoute) && (
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                {logoSettings?.logo_url ? (
                  <>
                    <img 
                      src={logoSettings.logo_url} 
                      alt="Company logo"
                      className="h-8 w-auto max-w-[120px] object-contain"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Powered by Timber
                    </span>
                  </>
                ) : (
                  <h2 className="text-lg font-semibold tracking-tight">
                    TimberPOS
                  </h2>
                )}
              </div>
            )}
            {isRegisterRoute && (
              <button
                onClick={toggleSidebar}
                className={`flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors ${
                  isSidebarCollapsed ? 'ml-auto' : 'ml-auto'
                }`}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-black" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-black" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className={`p-4 space-y-1 ${isSidebarCollapsed && isRegisterRoute ? 'px-2' : ''}`}>
            {menuItems.map((item) => 
              isSidebarCollapsed && isRegisterRoute ? (
                <FeatureGuard key={item.path || item.label} permission={item.permission} requireBoth>
                  <div className="flex justify-center">
                    <button
                      onClick={() => item.path && handleNavigation(item.path)}
                      className={`flex items-center justify-center h-10 w-10 rounded-md ${
                        location.pathname === item.path
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      title={item.label}
                    >
                      <item.icon className="h-5 w-5" />
                    </button>
                  </div>
                </FeatureGuard>
              ) : (
                renderDesktopMenuItem(item)
              )
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="border-t p-4 flex-shrink-0">
          {isSidebarCollapsed && isRegisterRoute ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-full flex justify-center mb-1">
                <button 
                  className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Select store"
                >
                  <Store className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                {getUserInitials()}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <StoreDropdown />
              
              <div className="flex items-center gap-3 mt-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium line-clamp-1">
                    {getUserDisplayName()}
                    {isContextSwitched && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Cashier Mode
                      </span>
                    )}
                  </p>
                  {displayUser?.role && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {displayUser.role}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Takes remaining space */}
      <main className="flex-1 overflow-hidden">
        <div className={`h-full ${isRegisterRoute ? 'overflow-hidden' : 'overflow-auto p-8'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;