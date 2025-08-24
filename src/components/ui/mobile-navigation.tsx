import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, ShoppingCart, Users, FileBarChart, Package, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  permission?: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: "view_dashboard" },
  { icon: ShoppingCart, label: "Register", path: "/register", permission: "process_transactions" },
  { icon: Users, label: "Customers", path: "/customers", permission: "view_customers" },
  { icon: Package, label: "Inventory", path: "/inventory", permission: "view_inventory" },
  { icon: FileBarChart, label: "Reports", path: "/reports", permission: "view_reports" },
  { icon: Settings, label: "Settings", path: "/settings", permission: "manage_settings" },
]

export function MobileNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const filteredNavItems = navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg md:hidden">
      <div className="flex">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs leading-none truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}