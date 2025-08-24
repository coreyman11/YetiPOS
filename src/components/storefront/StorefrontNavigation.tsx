import React, { useState } from 'react';
import { Menu, X, ChevronDown, ShoppingCart, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useStorefrontAuth } from '@/contexts/storefront-auth-context';
import { StorefrontAccountManagementDialog } from './StorefrontAccountManagementDialog';

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  is_external: boolean;
  parent_id?: string;
  children?: NavigationItem[];
}

interface StorefrontNavigationProps {
  store: any;
  navigationItems: NavigationItem[];
  cartItemsCount: number;
  onCartClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  isAuthDialogOpen: boolean;
  setIsAuthDialogOpen: (open: boolean) => void;
}

export function StorefrontNavigation({
  store,
  navigationItems,
  cartItemsCount,
  onCartClick,
  onNavigate,
  currentPage,
  isAuthDialogOpen,
  setIsAuthDialogOpen
}: StorefrontNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const { customer, isAuthenticated, logout } = useStorefrontAuth();

  // Build navigation tree (parent -> children structure)
  const navigationTree = navigationItems
    .filter(item => !item.parent_id)
    .map(parent => ({
      ...parent,
      children: navigationItems.filter(child => child.parent_id === parent.id)
    }));

  const handleNavClick = (item: NavigationItem) => {
    if (item.is_external) {
      window.open(item.url, '_blank');
    } else {
      onNavigate(item.url);
    }
    setIsMenuOpen(false);
  };

  const getTextColor = () => {
    return store.secondary_color === '#ffffff' ? '#000000' : '#ffffff';
  };

  const headerHeight = store.header_style === 'minimal' ? 'h-14' : store.layout_style === 'bold' ? 'h-16' : 'h-14';

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b ${headerHeight}`}
      style={{ 
        backgroundColor: store.primary_color || store.theme_color,
        borderColor: store.layout_style === 'bold' ? store.accent_color : 'hsl(var(--border))'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-full items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className={`font-bold transition-opacity hover:opacity-80 ${
                store.layout_style === 'bold' ? 'text-3xl' : 'text-2xl'
              }`}
              style={{ color: getTextColor() }}
            >
              {store.name}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationTree.map((item) => (
              <div key={item.id} className="relative">
                {item.children && item.children.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-1 hover:opacity-70"
                        style={{ color: getTextColor() }}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <button
                        onClick={() => handleNavClick(item)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm ${
                          currentPage === item.url ? 'bg-muted font-medium' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                      <DropdownMenuSeparator />
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleNavClick(child)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm ${
                            currentPage === child.url ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(item)}
                    className={`hover:opacity-70 ${
                      currentPage === item.url ? 'font-medium opacity-100' : ''
                    }`}
                    style={{ color: getTextColor() }}
                  >
                    {item.label}
                  </Button>
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:opacity-70 flex items-center space-x-1"
                      style={{ color: getTextColor() }}
                    >
                      <User className="h-4 w-4" />
                      <span>{customer?.first_name || customer?.name}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsAccountDialogOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsAuthDialogOpen(true)}
                className="hidden md:flex hover:opacity-70"
                style={{ color: getTextColor() }}
              >
                <User className="mr-1 h-4 w-4" />
                Sign In
              </Button>
            )}

            {/* Cart Button */}
            <Button 
              variant="secondary" 
              onClick={onCartClick}
              className="relative"
              style={{ 
                backgroundColor: store.accent_color,
                color: '#ffffff',
                borderColor: store.accent_color
              }}
            >
              <ShoppingCart className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Cart</span>
              {cartItemsCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  variant="destructive"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: getTextColor() }}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t mt-3 py-3" style={{ borderColor: store.accent_color }}>
            <nav className="flex flex-col space-y-2">
              {navigationTree.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`w-full text-left py-2 px-3 rounded transition-colors ${
                      currentPage === item.url ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                    }`}
                    style={{ color: getTextColor() }}
                  >
                    {item.label}
                  </button>
                  {item.children && item.children.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleNavClick(child)}
                          className={`w-full text-left py-1 px-3 rounded text-sm transition-colors ${
                            currentPage === child.url ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                          }`}
                          style={{ color: getTextColor() }}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile Auth */}
              <div className="border-t pt-2 mt-2" style={{ borderColor: store.accent_color }}>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="py-2 px-3" style={{ color: getTextColor() }}>
                      <User className="inline mr-2 h-4 w-4" />
                      {customer?.first_name || customer?.name}
                    </div>
                    <button
                      onClick={() => setIsAccountDialogOpen(true)}
                      className="w-full text-left py-2 px-3 rounded hover:bg-white/10"
                      style={{ color: getTextColor() }}
                    >
                      <Settings className="inline mr-2 h-4 w-4" />
                      Manage Account
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left py-2 px-3 rounded hover:bg-white/10"
                      style={{ color: getTextColor() }}
                    >
                      <LogOut className="inline mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthDialogOpen(true)}
                    className="w-full text-left py-2 px-3 rounded hover:bg-white/10"
                    style={{ color: getTextColor() }}
                  >
                    <User className="inline mr-2 h-4 w-4" />
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
      
      {/* Account Management Dialog */}
      {customer && (
        <StorefrontAccountManagementDialog
          isOpen={isAccountDialogOpen}
          onClose={() => setIsAccountDialogOpen(false)}
          customer={customer}
        />
      )}
    </header>
  );
}