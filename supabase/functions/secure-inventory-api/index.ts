
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestData = await req.json();
    const { action, locationId, itemData, itemId, categoryData, categoryId, barcode } = requestData;

    switch (action) {
      case 'get_all':
        const { data: inventory, error: inventoryError } = await supabaseClient
          .from('inventory')
          .select('*')
          .eq('location_id', locationId)
          .order('name');
        
        if (inventoryError) throw inventoryError;
        return new Response(JSON.stringify(inventory || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_categories':
        const { data: categories, error: categoriesError } = await supabaseClient
          .from('inventory_categories')
          .select('*')
          .eq('location_id', locationId)
          .order('name');
        
        if (categoriesError) throw categoriesError;
        return new Response(JSON.stringify(categories || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'create_item':
        const { data: newItem, error: createError } = await supabaseClient
          .from('inventory')
          .insert({ ...itemData, location_id: locationId })
          .select()
          .single();
        
        if (createError) throw createError;
        return new Response(JSON.stringify(newItem), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'update_item':
        const updateData = { ...itemData };
        delete updateData.id;
        delete updateData.created_at;
        
        const { data: updatedItem, error: updateError } = await supabaseClient
          .from('inventory')
          .update(updateData)
          .eq('id', itemId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedItem), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'delete_item':
        const { error: deleteError } = await supabaseClient
          .from('inventory')
          .delete()
          .eq('id', itemId);
        
        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'find_by_barcode':
        const { data: barcodeItem, error: barcodeError } = await supabaseClient
          .from('inventory')
          .select('*')
          .eq('location_id', locationId)
          .eq('barcode', barcode)
          .single();
        
        if (barcodeError && barcodeError.code !== 'PGRST116') {
          throw barcodeError;
        }
        
        return new Response(JSON.stringify(barcodeItem || null), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'create_category':
        const { data: newCategory, error: createCatError } = await supabaseClient
          .from('inventory_categories')
          .insert({
            name: categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1),
            location_id: locationId,
            color: categoryData.color
          })
          .select()
          .single();
        
        if (createCatError) throw createCatError;
        return new Response(JSON.stringify(newCategory), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'update_category':
        const { data: updatedCategory, error: updateCatError } = await supabaseClient
          .from('inventory_categories')
          .update({ name: categoryData.name, color: categoryData.color })
          .eq('id', categoryId)
          .select()
          .single();
        
        if (updateCatError) throw updateCatError;
        return new Response(JSON.stringify(updatedCategory), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'delete_category':
        // Update inventory items to remove category reference
        await supabaseClient
          .from('inventory')
          .update({ category: null })
          .eq('location_id', locationId)
          .eq('category', categoryData.name);
        
        // Delete category
        const { error: deleteCatError } = await supabaseClient
          .from('inventory_categories')
          .delete()
          .eq('id', categoryId);
        
        if (deleteCatError) throw deleteCatError;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error("Error in secure-inventory-api:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
