
import { Card } from "@/components/ui/card";
import { Database } from "@/types/supabase";

type Service = Database['public']['Tables']['services']['Row'];

interface ServiceCardProps {
  service: Service;
  onAdd: (service: Service) => void;
  isDragging?: boolean;
}

export const ServiceCard = ({ service, onAdd, isDragging = false }: ServiceCardProps) => {
  // For services we'll use a default green color since they don't have categories
  const categoryColor = "#22c55e"; // Default green color for all services

  return (
    <Card 
      className={`cursor-grab hover:shadow-md transition-shadow overflow-hidden flex flex-col bg-white h-[100px] border ${
        isDragging ? 'shadow-lg border-primary cursor-grabbing' : 'hover:border-blue-300'
      }`}
      onClick={(e) => {
        // Only trigger click if we're not dragging
        if (!isDragging) {
          onAdd(service);
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="h-1 w-full" 
        style={{ backgroundColor: categoryColor }}
      ></div>
      <div className="flex flex-col justify-between flex-1 p-2">
        <div className="text-sm font-medium line-clamp-2">{service.name}</div>
        <div className="text-sm font-bold text-gray-900">${Number(service.price).toFixed(2)}</div>
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center rounded-lg">
            <div className="text-xs font-medium text-primary">Moving item...</div>
          </div>
        )}
      </div>
    </Card>
  );
};
