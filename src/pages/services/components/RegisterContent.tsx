
import { useState, useEffect } from "react";
import { CategorySidebar } from "@/components/services/CategorySidebar";
import { CartSection } from "@/components/services/cart/CartSection";
import { ItemsSection } from "@/components/services/ItemsSection";
import { CartItem } from "@/hooks/useCart";
import { Database } from "@/types/supabase";
import { ShiftBanner } from "@/components/shifts/ShiftBanner";
import { useAuth } from "@/contexts/auth-context";
import { OrderSummary } from "@/components/services/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { RegisterManagementMenu } from "@/components/services/RegisterManagementMenu";
import { useDeviceType } from "@/hooks/use-mobile";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useStorefrontCustomerSession } from "@/hooks/useStorefrontCustomerSession";
import { StorefrontCustomerIndicator } from "@/components/services/StorefrontCustomerIndicator";

type Service = Database['public']['Tables']['services']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type PaymentMethod = "cash" | "credit" | "gift_card";
type Shift = Database['public']['Tables']['shifts']['Row'];


interface RegisterContentProps {
  cart: CartItem[];
  updateQuantity: (id: number, type: 'service' | 'inventory', quantity: number) => void;
  removeFromCart: (id: number, type: 'service' | 'inventory') => void;
  total: number;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  services: Service[];
  inventoryItems: InventoryItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (item: Service | InventoryItem, type: 'service' | 'inventory') => void;
  activeShift?: Shift | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: (collapsed: boolean) => void;
  calculatedTotals?: {
    subtotal: number;
    discountAmount: number;
    afterDiscount: number;
    taxAmount: number;
    finalTotal: number;
  };
  onCloseRegister?: () => void;
}

export const RegisterContent = ({
  cart,
  updateQuantity,
  removeFromCart,
  total,
  onPaymentMethodSelect,
  services,
  inventoryItems,
  searchTerm,
  onSearchChange,
  onAddToCart,
  activeShift,
  isSidebarCollapsed = false,
  onToggleSidebar,
  calculatedTotals,
  onCloseRegister
}: RegisterContentProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isSidebarCollapsed);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { userProfile } = useAuth();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  // Track storefront customer session
  const { activeCustomer, checkForStorefrontSession, clearStorefrontSession } = useStorefrontCustomerSession();
  
  useEffect(() => {
    // Check for storefront session on mount
    // Assuming store ID 1 for now - this should be dynamic based on current store
    checkForStorefrontSession(1);
  }, [checkForStorefrontSession]);


  useEffect(() => {
    setSidebarCollapsed(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    onToggleSidebar?.(newCollapsedState);
  };

  const handleUpdateQuantity = (item: CartItem, quantity: number) => {
    updateQuantity(item.id, item.type, quantity);
  };

  const handleRemoveFromCart = (item: CartItem) => {
    removeFromCart(item.id, item.type);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile Header with Cart Button */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex-1">
            {activeShift && userProfile && (
              <ShiftBanner
                activeShift={activeShift}
                userId={userProfile.id}
              />
            )}
          </div>
          <Button
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-2"
            variant={cart.length > 0 ? "default" : "outline"}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart ({cart.length})</span>
          </Button>
        </div>

        {/* Mobile Category Selector */}
        {selectedCategory !== null && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Category: {selectedCategory}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-8 px-2"
              >
                Show All
              </Button>
            </div>
          </div>
        )}
        
        {selectedCategory === null && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="mb-3">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="w-full"
              >
                All Items
              </Button>
            </div>
            <CategorySidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              hideHeader={true}
            />
          </div>
        )}

        {/* Mobile Items Section */}
        <div className="flex-1 overflow-auto">
          <ItemsSection
            services={services}
            inventoryItems={inventoryItems}
            onAddToCart={onAddToCart}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            selectedCategory={selectedCategory}
            onCloseRegister={onCloseRegister}
          />
        </div>

        {/* Mobile Cart Sheet */}
        <MobileSheet
          open={showMobileCart}
          onOpenChange={setShowMobileCart}
          title="Shopping Cart"
          className="h-[80vh]"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <CartSection
                cart={cart}
                updateQuantity={handleUpdateQuantity}
                removeFromCart={handleRemoveFromCart}
                onProceedToPayment={() => onPaymentMethodSelect("cash")}
              />
            </div>
            <div className="border-t">
              <OrderSummary 
                total={calculatedTotals?.finalTotal || total}
                cart={cart}
                onPaymentMethodSelect={onPaymentMethodSelect}
                activeShift={activeShift}
                subtotal={calculatedTotals?.subtotal}
                taxAmount={calculatedTotals?.taxAmount}
                discountAmount={calculatedTotals?.discountAmount}
              />
            </div>
          </div>
        </MobileSheet>

        <RegisterManagementMenu
          activeShift={activeShift}
          onCloseRegister={onCloseRegister}
        />
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden">
          {/* Tablet Cart - Left Side */}
          <div className="w-[280px] flex-shrink-0 flex flex-col h-full bg-white border-r shadow-sm">
            <div className="flex-1 overflow-hidden">
              <CartSection
                cart={cart}
                updateQuantity={handleUpdateQuantity}
                removeFromCart={handleRemoveFromCart}
                onProceedToPayment={() => onPaymentMethodSelect("cash")}
              />
            </div>
            <OrderSummary 
              total={calculatedTotals?.finalTotal || total}
              cart={cart}
              onPaymentMethodSelect={onPaymentMethodSelect}
              activeShift={activeShift}
              subtotal={calculatedTotals?.subtotal}
              taxAmount={calculatedTotals?.taxAmount}
              discountAmount={calculatedTotals?.discountAmount}
            />
          </div>
          
          {/* Tablet Categories - Collapsible */}
          <div className={`bg-white h-full border-r overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-[200px]'} flex-shrink-0`}>
            <div className="p-2 text-sm font-medium border-b bg-gray-50 flex justify-between items-center">
              {!sidebarCollapsed && <div className="uppercase tracking-wide text-gray-500 text-xs">Categories</div>}
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
              </Button>
            </div>
            <CategorySidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              hideHeader={true}
            />
          </div>
          
          {/* Tablet Items */}
          <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
              <div className="flex-1">
                {activeShift && userProfile && (
                  <ShiftBanner
                    activeShift={activeShift}
                    userId={userProfile.id}
                  />
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <ItemsSection
                services={services}
                inventoryItems={inventoryItems}
                onAddToCart={onAddToCart}
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                selectedCategory={selectedCategory}
                onCloseRegister={onCloseRegister}
              />
            </div>
          </div>
        </div>

        <RegisterManagementMenu
          activeShift={activeShift}
          onCloseRegister={onCloseRegister}
        />
      </div>
    );
  }

  // Desktop Layout (Default)
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[320px] flex-shrink-0 flex flex-col bg-white border-r shadow-sm">
        <div className="flex-1 overflow-hidden min-h-0">
          <CartSection
            cart={cart}
            updateQuantity={handleUpdateQuantity}
            removeFromCart={handleRemoveFromCart}
            onProceedToPayment={() => onPaymentMethodSelect("cash")}
          />
        </div>
        <div className="flex-shrink-0">
          <OrderSummary 
            total={calculatedTotals?.finalTotal || total}
            cart={cart}
            onPaymentMethodSelect={onPaymentMethodSelect}
            activeShift={activeShift}
            subtotal={calculatedTotals?.subtotal}
            taxAmount={calculatedTotals?.taxAmount}
            discountAmount={calculatedTotals?.discountAmount}
          />
        </div>
      </div>
      
      <div className={`bg-white border-r overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-[250px]'} flex-shrink-0`}>
        <div className="p-3 text-sm font-medium border-b bg-gray-50 flex justify-between items-center">
          {!sidebarCollapsed && <div className="uppercase tracking-wide text-gray-500">Categories</div>}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <CategorySidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          hideHeader={true}
        />
      </div>
      
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2 flex-shrink-0">
          <div className="flex-1">
            {activeShift && userProfile && (
              <ShiftBanner
                activeShift={activeShift}
                userId={userProfile.id}
              />
            )}
          </div>
        </div>
        
        {/* Storefront Customer Indicator */}
        {activeCustomer && (
          <div className="p-4 border-b bg-muted/30">
            <StorefrontCustomerIndicator 
              customer={activeCustomer} 
              onClearCustomer={() => clearStorefrontSession(1)}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-auto min-h-0">
          <ItemsSection
            services={services}
            inventoryItems={inventoryItems}
            onAddToCart={onAddToCart}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            selectedCategory={selectedCategory}
            onCloseRegister={onCloseRegister}
          />
        </div>
        
        <div className="flex-shrink-0 border-t bg-white">
          <RegisterManagementMenu
            activeShift={activeShift}
            onCloseRegister={onCloseRegister}
          />
        </div>
      </div>
    </div>
  );
};
