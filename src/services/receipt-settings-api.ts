
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type ReceiptSettings = Database['public']['Tables']['receipt_settings']['Row'];
type ReceiptSettingsUpdate = Database['public']['Tables']['receipt_settings']['Update'];

export const receiptSettingsApi = {
  /**
   * Fetch receipt settings for a specific location
   */
  getSettings: async (locationId: string): Promise<ReceiptSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching receipt settings:", error);
      return null;
    }
  },

  /**
   * Update receipt settings for a location
   */
  updateSettings: async (settings: ReceiptSettingsUpdate): Promise<ReceiptSettings | null> => {
    try {
      if (!settings.location_id) {
        throw new Error("Location ID is required");
      }

      // Check if settings exist for this location
      const { data: existingSettings } = await supabase
        .from('receipt_settings')
        .select('id')
        .eq('location_id', settings.location_id)
        .maybeSingle();

      let result;

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('receipt_settings')
          .update(settings)
          .eq('location_id', settings.location_id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('receipt_settings')
          .insert({
            location_id: settings.location_id,
            ...settings
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error("Error updating receipt settings:", error);
      return null;
    }
  },

  /**
   * Upload a logo image to Supabase storage
   */
  uploadLogo: async (locationId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('receipt_logos')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipt_logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    }
  },

  /**
   * Delete a logo from Supabase storage
   */
  deleteLogo: async (logoUrl: string): Promise<boolean> => {
    try {
      // Extract the file path from the URL
      const url = new URL(logoUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage
        .from('receipt_logos')
        .remove([fileName]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting logo:", error);
      return false;
    }
  },

  /**
   * Generate a preview of the receipt based on current settings
   */
  generatePreview: (settings: Partial<ReceiptSettings>, transactionData: any = null): string => {
    // This is a simplified template - in a real application, this would be more complex
    // and could include conditional sections based on settings
    const demoTransaction = transactionData || {
      id: 12345,
      date: new Date().toLocaleDateString(),
      total: "$125.00",
      subtotal: "$100.00",
      tax: "$8.00",
      discount: "$0.00",
      items: [
        { name: "Product 1", quantity: 2, price: "$45.00" },
        { name: "Service 1", quantity: 1, price: "$35.00" },
        { name: "Product 2", quantity: 1, price: "$20.00" }
      ],
      customer: {
        name: "Sample Customer",
        email: "customer@example.com",
        phone: "555-123-4567"
      }
    };

    // Build header
    let receipt = `
      <div class="text-center mb-4">
        ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Business Logo" class="w-32 mx-auto mb-2" />` : ''}
        <h2 class="text-lg font-bold">${settings.business_name || 'Your Business'}</h2>
        ${settings.header_text ? `<p>${settings.header_text}</p>` : ''}
        ${settings.contact_phone ? `<p>Phone: ${settings.contact_phone}</p>` : ''}
        ${settings.contact_email ? `<p>Email: ${settings.contact_email}</p>` : ''}
        ${settings.contact_website ? `<p>Web: ${settings.contact_website}</p>` : ''}
      </div>
      
      <div class="border-t border-b border-gray-300 py-2 my-2">
        <p>Receipt #${demoTransaction.id}</p>
        <p>Date: ${demoTransaction.date}</p>
        ${(settings.include_customer_info && demoTransaction.customer) ? `
          <p>Customer: ${demoTransaction.customer.name}</p>
          <p>Email: ${demoTransaction.customer.email}</p>
          <p>Phone: ${demoTransaction.customer.phone}</p>
        ` : ''}
      </div>
      
      <div class="my-4">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left">Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            ${demoTransaction.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="border-t border-gray-300 pt-2">
        <div class="flex justify-between">
          <span>Subtotal:</span>
          <span>${demoTransaction.subtotal}</span>
        </div>
        ${settings.show_tax_details ? `
          <div class="flex justify-between">
            <span>Tax:</span>
            <span>${demoTransaction.tax}</span>
          </div>
        ` : ''}
        ${(settings.show_discount_details && parseFloat(demoTransaction.discount.replace('$', '')) > 0) ? `
          <div class="flex justify-between">
            <span>Discount:</span>
            <span>${demoTransaction.discount}</span>
          </div>
        ` : ''}
        <div class="flex justify-between font-bold mt-2">
          <span>Total:</span>
          <span>${demoTransaction.total}</span>
        </div>
      </div>
      
      <div class="text-center mt-6">
        ${settings.footer_text ? `<p>${settings.footer_text}</p>` : ''}
      </div>
    `;

    return receipt;
  }
};
