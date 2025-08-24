
import { useInventory } from "@/hooks/useInventory";
import { InventoryContent } from "@/components/inventory/InventoryContent";

const Inventory = () => {
  const inventory = useInventory();
  
  return <InventoryContent {...inventory} />;
};

export default Inventory;
