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

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { action, userId, updates, userData, locationId } = requestData;

    switch (action) {
      case 'list_location_users':
        console.log("Fetching users for location:", locationId);
        
        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'Location ID is required' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const { data: locationUsers = [], error: locError } = await supabaseClient
          .from('user_profiles')
          .select('id, full_name, email, employee_code, role')
          .contains('allowed_locations', [locationId])
          .not('employee_code', 'is', null);
        
        if (locError) {
          console.error("Error fetching location users:", locError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch location users',
              details: locError.message 
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log(`Found ${locationUsers.length} users with employee codes for location ${locationId}`);
        
        return new Response(
          JSON.stringify(locationUsers || []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create':
        try {
          console.log("Creating user with data:", JSON.stringify({
            email: userData.email,
            role: userData.role,
            full_name: userData.full_name,
            has_employee_code: !!userData.employee_code,
            allowed_locations: userData.allowed_locations || []
          }));
          
          const { data: existingEmail, error: emailCheckError } = await supabaseClient
            .from('user_profiles')
            .select('email')
            .eq('email', userData.email)
            .maybeSingle();
            
          if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            console.error("Email check error:", emailCheckError);
            return new Response(
              JSON.stringify({ 
                error: 'Error checking email availability',
                details: emailCheckError.message 
              }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
          
          if (existingEmail) {
            console.error("Email already in use:", userData.email);
            return new Response(
              JSON.stringify({ 
                error: 'This email is already in use',
                code: 'duplicate_email'
              }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          if (userData.employee_code) {
            const { data: existingCode, error: codeCheckError } = await supabaseClient
              .from('user_profiles')
              .select('id')
              .eq('employee_code', userData.employee_code)
              .maybeSingle();
              
            if (codeCheckError && codeCheckError.code !== 'PGRST116') {
              console.error("Employee code check error:", codeCheckError);
              return new Response(
                JSON.stringify({ 
                  error: 'Error checking employee code availability',
                  details: codeCheckError.message 
                }),
                { 
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              );
            }
            
            if (existingCode) {
              console.error("Employee code already in use:", userData.employee_code);
              return new Response(
                JSON.stringify({ 
                  error: 'This employee code is already in use by another user',
                  code: 'duplicate_employee_code'
                }),
                { 
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              );
            }
          }
          
          const { data: createData, error: createError } = await supabaseClient.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              full_name: userData.full_name
            }
          });
          
          if (createError) {
            console.error("Create user error:", createError);
            return new Response(
              JSON.stringify({ 
                error: createError.message,
                details: createError 
              }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          const { error: profileError } = await supabaseClient
            .from('user_profiles')
            .update({
              full_name: userData.full_name,
              role_id: userData.role,
              employee_code: userData.employee_code || null,
              allowed_locations: userData.allowed_locations || []
            })
            .eq('id', createData.user.id);
            
          if (profileError) {
            console.error("Profile update error:", profileError);
            return new Response(
              JSON.stringify({ 
                error: 'User created but failed to update profile',
                details: profileError.message 
              }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response(
            JSON.stringify(createData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error("Error in create user action:", error);
          return new Response(
            JSON.stringify({ 
              error: error.message || 'Unknown error creating user',
              details: error.stack 
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

      case 'update':
        console.log("Updating user:", userId, "with updates:", JSON.stringify(updates));

        const { data: userCheck, error: userCheckError } = await supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (userCheckError) {
          console.error("User check error:", userCheckError);
          return new Response(
            JSON.stringify({ 
              error: `User not found with ID: ${userId}`,
              details: userCheckError.message
            }),
            { 
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const cleanUpdates = { ...updates };
        Object.keys(cleanUpdates).forEach(key => {
          if (cleanUpdates[key] === '') {
            cleanUpdates[key] = null;
          }
        });

        console.log("Cleaned updates:", JSON.stringify(cleanUpdates));

        if (cleanUpdates.employee_code !== undefined) {
          console.log("Checking employee code uniqueness:", cleanUpdates.employee_code);
          
          if (cleanUpdates.employee_code !== null && cleanUpdates.employee_code !== '') {
            const { data: existingCodeUser, error: codeCheckError } = await supabaseClient
              .from('user_profiles')
              .select('id, employee_code')
              .eq('employee_code', cleanUpdates.employee_code)
              .neq('id', userId)
              .maybeSingle();

            if (codeCheckError) {
              console.error("Error checking employee code:", codeCheckError);
              if (codeCheckError.code !== 'PGRST116') {
                return new Response(
                  JSON.stringify({ 
                    error: 'Error validating employee code',
                    details: codeCheckError.message,
                    code: codeCheckError.code
                  }),
                  { 
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                );
              }
            }

            if (existingCodeUser) {
              console.error("Employee code already in use:", cleanUpdates.employee_code, "by user:", existingCodeUser.id);
              return new Response(
                JSON.stringify({ 
                  error: 'Employee code already in use by another user',
                  code: 'duplicate_employee_code',
                  details: `Employee code ${cleanUpdates.employee_code} is already assigned to user ${existingCodeUser.id}`
                }),
                { 
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              );
            }
          }
        }

        const { data: updateData, error: updateError } = await supabaseClient
          .from('user_profiles')
          .update(cleanUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error("Update error:", updateError);
          
          if (updateError.code === '23505' && updateError.message.includes('unique_employee_code')) {
            return new Response(
              JSON.stringify({ 
                error: 'Employee code already in use by another user',
                code: 'duplicate_employee_code',
                details: updateError.message
              }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              error: 'Error updating user profile',
              details: updateError.message,
              code: updateError.code
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log("User updated successfully:", updateData);
        return new Response(
          JSON.stringify(updateData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list':
        console.log("Fetching complete user list...");
        
        // Get user's profile to check role and allowed locations
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('role, allowed_locations')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch user profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabaseClient
          .from('user_profiles')
          .select('id, email, full_name, role, created_at, employee_code, allowed_locations')
          .order('created_at', { ascending: false });

        // If user is not an admin, filter by their allowed locations
        if (userProfile.role !== 'admin') {
          const userLocations = userProfile.allowed_locations || [];
          if (userLocations.length > 0) {
            // Get users who have at least one overlapping location
            query = query.or(
              userLocations.map(loc => `allowed_locations.cs.{${loc}}`).join(',')
            );
          } else {
            // User has no allowed locations, return empty array
            return new Response(
              JSON.stringify([]),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: listData, error: listError } = await query;

        if (listError) {
          console.error("List users error:", listError);
          throw listError;
        }

        console.log(`Found ${listData?.length || 0} users`);
        
        if (listData?.length === 0) {
          console.log("No users found. Checking for issues...");
          
          const { count, error: countError } = await supabaseClient
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.error("Error checking user profiles count:", countError);
          } else {
            console.log(`Total user profiles in database: ${count}`);
          }
        }
        
        return new Response(
          JSON.stringify(listData || []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'validate_employee_code':
        const { employeeCode } = requestData;
        
        if (!employeeCode) {
          return new Response(
            JSON.stringify({ valid: false, message: "No employee code provided" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: validationData, error: validationError } = await supabaseClient
          .from('user_profiles')
          .select('id, full_name, email, employee_code')
          .eq('employee_code', employeeCode)
          .maybeSingle();
          
        if (validationError && validationError.code !== 'PGRST116') {
          console.error("Validation error:", validationError);
          return new Response(
            JSON.stringify({ valid: false, message: "Error validating code" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!validationData) {
          return new Response(
            JSON.stringify({ valid: false, message: "Invalid employee code" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            valid: true, 
            user: validationData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error("Error in manage-users function:", error);
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
