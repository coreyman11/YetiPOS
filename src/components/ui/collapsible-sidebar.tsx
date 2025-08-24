
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const CollapsibleSidebar = ({
  children,
  className,
  onCollapseChange,
}: CollapsibleSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  return (
    <div
      className={cn(
        "relative h-full border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[280px]",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b py-3 px-4">
          {!isCollapsed && <h2 className="text-lg font-semibold">Menu</h2>}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-foreground hover:bg-accent transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <div className={cn("overflow-y-auto", isCollapsed ? "px-2" : "px-4")}>
          <SidebarContext.Provider value={{ isCollapsed }}>
            {children}
          </SidebarContext.Provider>
        </div>
      </div>
    </div>
  );
};

export interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

// Create a sidebar context to manage state across sidebar components
interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => {
  const parentContext = React.useContext(SidebarContext);
  const isCollapsed = parentContext?.isCollapsed || false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
};

// We no longer need the SidebarProvider since we're managing state within the CollapsibleSidebar component
export const SidebarProvider = ({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) => {
  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
