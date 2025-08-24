
export const generateBarcode = (itemId: number, sku?: string): string => {
  // If we have an SKU, use it as the base
  if (sku && sku.trim() !== '') {
    // Clean SKU and ensure it's valid for Code128
    const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanSku.length >= 4) {
      return cleanSku;
    }
  }
  
  // Generate a barcode based on item ID with prefix
  const prefix = 'ITM';
  const paddedId = itemId.toString().padStart(8, '0');
  return `${prefix}${paddedId}`;
};

export const validateBarcode = (barcode: string): boolean => {
  // Basic validation for Code128 compatibility
  if (!barcode || barcode.length < 4) return false;
  
  // Check if contains only valid characters for Code128
  const validChars = /^[A-Za-z0-9\s\-\.\_]+$/;
  return validChars.test(barcode);
};

export const formatBarcodeForDisplay = (barcode: string): string => {
  // Format barcode for better readability
  if (barcode.length > 8) {
    return barcode.replace(/(.{4})/g, '$1 ').trim();
  }
  return barcode;
};
