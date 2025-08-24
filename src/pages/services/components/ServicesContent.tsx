
import { CartSection } from "@/components/services/cart/CartSection";
import { OrderSummary } from "@/components/services/cart/OrderSummary";
import { ItemsSection } from "@/components/services/ItemsSection";
import { Database } from "@/types/supabase";
import { CartItem } from "@/hooks/useCart";
import { CategorySidebar } from "@/components/services/CategorySidebar";
import { useState } from "react";
import { ShiftBanner } from "@/components/shifts/ShiftBanner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useDeviceType } from "@/hooks/use-mobile";
import { MobileSheet } from "@/components/ui/mobile-sheet";

type Service = Database['public']['Tables']['services']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type PaymentMethod = "cash" | "credit" | "gift_card";
type Shift = Database['public']['Tables']['shifts']['Row'];

interface ServicesContentProps {
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
}

export const ServicesContent = ({
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
  activeShift
}: ServicesContentProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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
      <div className="flex flex-col h-full w-full">
        {/* Mobile Header with Cart Button */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex-1">
            {activeShift && (
              <ShiftBanner activeShift={activeShift} userId={activeShift?.assigned_user_id} />
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
        <div className="flex-1 overflow-auto bg-gray-50">
          <ItemsSection
            services={services}
            inventoryItems={inventoryItems}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onAddToCart={onAddToCart}
            selectedCategory={selectedCategory}
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
                total={total}
                cart={cart}
                onPaymentMethodSelect={onPaymentMethodSelect}
                activeShift={activeShift}
              />
            </div>
          </div>
        </MobileSheet>
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-shrink-0">
          {activeShift && (
            <ShiftBanner activeShift={activeShift} userId={activeShift?.assigned_user_id} />
          )}
        </div>
        
        <div className="flex flex-grow h-[calc(100%-40px)]">
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
              total={total}
              cart={cart}
              onPaymentMethodSelect={onPaymentMethodSelect}
              activeShift={activeShift}
            />
          </div>
          
          <div className={`bg-white h-full border-r overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-[200px]'} flex-shrink-0`}>
            <div className="p-2 text-sm font-medium border-b bg-gray-50 flex justify-between items-center">
              {!isSidebarCollapsed && <div className="uppercase tracking-wide text-gray-500 text-xs">Categories</div>}
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                onClick={toggleSidebar}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
              </Button>
            </div>
            <CategorySidebar 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              hideHeader={true}
            />
          </div>
          
          <div className="flex-grow h-full bg-gray-50 overflow-auto">
            <ItemsSection
              services={services}
              inventoryItems={inventoryItems}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              onAddToCart={onAddToCart}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (Default)
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-shrink-0">
        {activeShift && (
          <ShiftBanner activeShift={activeShift} userId={activeShift?.assigned_user_id} />
        )}
      </div>
      
      <div className="flex flex-grow h-[calc(100%-40px)]">
        <div className="w-[320px] flex-shrink-0 flex flex-col h-full bg-white border-r shadow-sm">
          <div className="flex-1 overflow-hidden">
            <CartSection
              cart={cart}
              updateQuantity={handleUpdateQuantity}
              removeFromCart={handleRemoveFromCart}
              onProceedToPayment={() => onPaymentMethodSelect("cash")}
            />
          </div>
          <OrderSummary
            total={total}
            cart={cart}
            onPaymentMethodSelect={onPaymentMethodSelect}
            activeShift={activeShift}
          />
        </div>
        
        <div className={`bg-white h-full border-r overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-[250px]'} flex-shrink-0`}>
          <div className="p-3 text-sm font-medium border-b bg-gray-50 flex justify-between items-center">
            {!isSidebarCollapsed && <div className="uppercase tracking-wide text-gray-500">Categories</div>}
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${isSidebarCollapsed ? 'mx-auto' : ''}`}
              onClick={toggleSidebar}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <CategorySidebar 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            hideHeader={true}
          />
        </div>
        
        <div className="flex-grow h-full bg-gray-50 overflow-auto">
          <ItemsSection
            services={services}
            inventoryItems={inventoryItems}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onAddToCart={onAddToCart}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
    </div>
  );
};
