
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  desc: string;
  extra?: React.ReactNode;
}

export const StatsCard = ({ title, value, icon: Icon, desc, extra }: StatsCardProps) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevValueRef = useRef(value);
  
  useEffect(() => {
    // If the value has changed, highlight the card briefly
    if (prevValueRef.current !== value) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1500);
      
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <Card className={`transition-all hover:shadow-lg hover:scale-[1.02] ${isHighlighted ? 'bg-primary/5 shadow-md' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {extra}
          <Icon className={`h-4 w-4 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className={`text-xl sm:text-2xl font-bold break-words transition-colors ${isHighlighted ? 'text-primary' : ''}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
};
