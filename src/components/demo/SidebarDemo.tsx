
import React from "react";
import { CollapsibleSidebar, SidebarItem } from "@/components/ui/collapsible-sidebar";
import { Home, Users, Settings, LayoutDashboard, ShoppingCart } from "lucide-react";

export const SidebarDemo = () => {
  const [activeItem, setActiveItem] = React.useState("dashboard");
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Demo items for the sidebar
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "services", icon: ShoppingCart, label: "Services" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "home", icon: Home, label: "Home" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen">
      <CollapsibleSidebar 
        className="shadow-sm"
        onCollapseChange={(collapsed) => setIsCollapsed(collapsed)}
      >
        <div className="py-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeItem === item.id}
                onClick={() => setActiveItem(item.id)}
              />
            ))}
          </div>
        </div>
      </CollapsibleSidebar>
      
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Main Content</h1>
        <p>This is where your main content goes. The sidebar can be expanded or collapsed.</p>
        <p className="mt-4">Currently active: {activeItem}</p>
      </main>
    </div>
  );
};
