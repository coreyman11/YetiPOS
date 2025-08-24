
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

    const url = new URL(req.url);
    let requestData: any = {};
    
    // Handle different request methods
    if (req.method === 'GET') {
      // For GET requests, extract data from URL params
      requestData = {
        action: 'get_billing_dashboard_stats', // Default for GET billing dashboard
        locationId: url.searchParams.get('location_id'),
      };
    } else {
      // For POST requests, get data from body
      requestData = await req.json();
    }
    
    const { action, locationId, planData, planId, customerId, membershipId, settings, startDate, endDate } = requestData;

    // Get the user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    console.log('User authenticated:', user.id);

    // Handle GET requests for billing dashboard
    if (req.method === 'GET' && url.pathname.endsWith('/billing/dashboard')) {
      if (!locationId || locationId === 'null' || locationId === 'undefined') {
        return new Response(
          JSON.stringify({ 
            error: 'Valid location ID is required',
            message: 'Please select a location to view billing data'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get billing dashboard stats (moved from switch statement)
      const { count: totalMemberships } = await supabaseClient
        .from('customer_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .in('billing_status', ['active', 'trial', 'past_due']);

      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyRevenue } = await supabaseClient
        .from('transactions')
        .select('total_amount')
        .eq('location_id', locationId)
        .eq('source', 'recurring')
        .gte('created_at', firstDayOfMonth.toISOString());

      const totalMonthlyRevenue = monthlyRevenue?.reduce((sum, tx) => sum + (tx.total_amount * 100), 0) || 0;

      const { count: pendingInvoices } = await supabaseClient
        .from('billing_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .eq('status', 'pending');

      const { count: failedPayments } = await supabaseClient
        .from('billing_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .in('status', ['failed', 'past_due']);

      const { data: recentInvoices, error: invoicesQueryError } = await supabaseClient
        .from('billing_invoices')
        .select(`
          *,
          customer_memberships(
            customer_id,
            customers(name)
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (invoicesQueryError) {
        console.error('Error fetching recent invoices:', invoicesQueryError);
      }

      const formattedInvoices = recentInvoices?.map(invoice => {
        let customerName = 'Unknown Customer';
        if (invoice.customer_memberships && typeof invoice.customer_memberships === 'object') {
          const membership = Array.isArray(invoice.customer_memberships) 
            ? invoice.customer_memberships[0] 
            : invoice.customer_memberships;
          
          if (membership?.customers && typeof membership.customers === 'object') {
            const customer = Array.isArray(membership.customers)
              ? membership.customers[0]
              : membership.customers;
            customerName = customer?.name || 'Unknown Customer';
          }
        }
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: customerName,
          amount_cents: invoice.total_cents,
          status: invoice.status,
          due_date: invoice.due_date,
          created_at: invoice.created_at
        };
      }) || [];

      // Get customers due today
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: dueToday } = await supabaseClient
        .from('customer_memberships')
        .select(`
          id,
          next_billing_date,
          customers (name),
          membership_plans (name, price_cents)
        `)
        .eq('location_id', locationId)
        .in('billing_status', ['active', 'past_due'])
        .in('billing_type', ['hybrid_usage', 'hybrid_fixed'])
        .gte('next_billing_date', today)
        .lt('next_billing_date', tomorrow);

      const customersDueToday = dueToday?.map(membership => ({
        id: membership.id,
        customer_name: membership.customers?.name || 'Unknown Customer',
        membership_plan_name: membership.membership_plans?.name || 'Unknown Plan',
        amount_cents: membership.membership_plans?.price_cents || 0,
        due_date: membership.next_billing_date,
        days_until_due: 0
      })) || [];

      // Get customers coming due in next 7 days (excluding today)
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: upcomingDue } = await supabaseClient
        .from('customer_memberships')
        .select(`
          id,
          next_billing_date,
          customers (name),
          membership_plans (name, price_cents)
        `)
        .eq('location_id', locationId)
        .in('billing_status', ['active', 'past_due'])
        .in('billing_type', ['hybrid_usage', 'hybrid_fixed'])
        .gte('next_billing_date', tomorrow)
        .lte('next_billing_date', nextWeek);

      const customersUpcoming = upcomingDue?.map(membership => {
        const dueDate = new Date(membership.next_billing_date);
        const todayDate = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: membership.id,
          customer_name: membership.customers?.name || 'Unknown Customer',
          membership_plan_name: membership.membership_plans?.name || 'Unknown Plan',
          amount_cents: membership.membership_plans?.price_cents || 0,
          due_date: membership.next_billing_date,
          days_until_due: daysUntilDue
        };
      }).sort((a, b) => a.days_until_due - b.days_until_due) || [];

      const stats = {
        total_memberships: totalMemberships || 0,
        monthly_revenue: Math.round(totalMonthlyRevenue),
        pending_invoices: pendingInvoices || 0,
        failed_payments: failedPayments || 0
      };

      return new Response(JSON.stringify({
        stats,
        recentInvoices: formattedInvoices,
        customersDueToday,
        customersUpcoming
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'get_customer_memberships':
        const { data: customerMemberships, error: customerMembershipsError } = await supabaseClient
          .from('customer_memberships')
          .select(`
            *,
            membership_plans (*)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        
        if (customerMembershipsError) throw customerMembershipsError;
        return new Response(JSON.stringify(customerMemberships || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_all_plans':
        // Updated query to use junction table for location filtering
        let plansQuery;
        
        if (locationId) {
          // For now, let's get all active plans and filter in JavaScript
          // until we fix the junction table query properly
          plansQuery = supabaseClient
            .from('membership_plans')
            .select(`
              *,
              membership_plan_locations!left (location_id)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        } else {
          // Get all plans for admin users
          plansQuery = supabaseClient
            .from('membership_plans')
            .select(`
              *,
              membership_plan_locations!left (location_id)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        }
        
        const { data: plans, error: plansError } = await plansQuery;
        
        if (plansError) throw plansError;
        
        // Filter plans by location if locationId is provided
        let filteredPlans = plans || [];
        if (locationId) {
          filteredPlans = plans?.filter(plan => {
            // Include plans that either have no location restrictions (legacy plans)
            // or have this location in their junction table entries
            const hasNoLocationRestrictions = !plan.location_id && (!plan.membership_plan_locations || plan.membership_plan_locations.length === 0);
            const hasLocationMatch = plan.location_id === locationId || 
              plan.membership_plan_locations?.some(loc => loc.location_id === locationId);
            return hasNoLocationRestrictions || hasLocationMatch;
          }) || [];
        }
        
        return new Response(JSON.stringify(filteredPlans), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_all_benefits':
        // Updated query to filter benefits by location
        let benefitsQuery;
        
        if (locationId) {
          benefitsQuery = supabaseClient
            .from('membership_benefits')
            .select('*')
            .eq('location_id', locationId);
        } else {
          benefitsQuery = supabaseClient
            .from('membership_benefits')
            .select('*');
        }
        
        const { data: benefits, error: benefitsError } = await benefitsQuery;
        
        if (benefitsError) throw benefitsError;
        return new Response(JSON.stringify(benefits || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'create_plan':
        const { data: newPlan, error: createError } = await supabaseClient
          .from('membership_plans')
          .insert({
            ...planData,
            location_id: locationId || null
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return new Response(JSON.stringify(newPlan), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'update_plan':
        const { data: updatedPlan, error: updateError } = await supabaseClient
          .from('membership_plans')
          .update(planData)
          .eq('id', planId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedPlan), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'add_plan_locations':
        const { planId: addPlanId, locationIds } = requestData;
        
        // Remove existing locations for this plan
        await supabaseClient
          .from('membership_plan_locations')
          .delete()
          .eq('membership_plan_id', addPlanId);
        
        // Add new locations
        if (locationIds && locationIds.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('membership_plan_locations')
            .insert(
              locationIds.map(locationId => ({
                membership_plan_id: addPlanId,
                location_id: locationId
              }))
            );
          
          if (insertError) throw insertError;
        }
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_plan_locations':
        const { planId: getPlanId } = requestData;
        const { data: planLocations, error: planLocationsError } = await supabaseClient
          .from('membership_plan_locations')
          .select('location_id, locations(name)')
          .eq('membership_plan_id', getPlanId);
        
        if (planLocationsError) throw planLocationsError;
        return new Response(JSON.stringify(planLocations || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'delete_plan':
        const { error: deleteError } = await supabaseClient
          .from('membership_plans')
          .delete()
          .eq('id', planId);
        
        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'add_customer_membership':
        console.log('Adding customer membership:', { customerId, planId, locationId });
        
        // Get the membership plan details to determine billing settings
        const { data: membershipPlan, error: planFetchError } = await supabaseClient
          .from('membership_plans')
          .select('*')
          .eq('id', planId)
          .single();
        
        if (planFetchError || !membershipPlan) {
          console.error('Error fetching membership plan:', planFetchError);
          throw new Error('Membership plan not found');
        }
        
        const now = new Date();
        const nextBillingDate = new Date(now);
        const currentPeriodEnd = new Date(now);
        
        // Set billing dates based on interval
        if (membershipPlan.billing_interval === 'monthly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + membershipPlan.billing_interval_count);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + membershipPlan.billing_interval_count);
        } else if (membershipPlan.billing_interval === 'yearly') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + membershipPlan.billing_interval_count);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + membershipPlan.billing_interval_count);
        }
        
        // For hybrid billing, determine if trial should be applied
        let billingStatus = 'active';
        let trialEndDate = null;
        
        // Use the plan's billing type, defaulting to hybrid_fixed for billing engine compatibility
        const membershipBillingType = membershipPlan.billing_type || 'hybrid_fixed';
        
        if ((membershipBillingType === 'hybrid_usage' || membershipBillingType === 'hybrid_fixed') && 
            membershipPlan.trial_days > 0) {
          billingStatus = 'trial';
          trialEndDate = new Date(now);
          trialEndDate.setDate(trialEndDate.getDate() + membershipPlan.trial_days);
          // If there's a trial, next billing is after trial ends
          nextBillingDate.setTime(trialEndDate.getTime());
        }
        
        const { data: newMembership, error: membershipError } = await supabaseClient
          .from('customer_memberships')
          .insert({
            customer_id: customerId,
            membership_plan_id: planId,
            status: 'active', // Membership status (different from billing status)
            billing_status: billingStatus,
            billing_type: membershipBillingType,
            current_period_start: now.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            trial_end_date: trialEndDate?.toISOString() || null,
            location_id: locationId || null
          })
          .select()
          .single();
        
        if (membershipError) {
          console.error('Error creating membership:', membershipError);
          throw membershipError;
        }
        
        console.log('Successfully created membership with billing details:', {
          membershipId: newMembership.id,
          billingStatus,
          nextBillingDate: nextBillingDate.toISOString(),
          trialEndDate: trialEndDate?.toISOString()
        });
        
        return new Response(JSON.stringify(newMembership), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'cancel_customer_membership':
        console.log('Cancelling customer membership:', membershipId);
        
        const { data: cancelledMembership, error: cancelError } = await supabaseClient
          .from('customer_memberships')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_at_period_end: true
          })
          .eq('id', membershipId)
          .select()
          .single();
        
        if (cancelError) {
          console.error('Error cancelling membership:', cancelError);
          throw cancelError;
        }
        
        return new Response(JSON.stringify(cancelledMembership), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'update_customer_membership':
        const { membershipId: updateMembershipId, updates } = requestData;
        console.log('Updating customer membership:', updateMembershipId, 'with updates:', updates);
        console.log('Full request data:', JSON.stringify(requestData, null, 2));
        
        if (!updateMembershipId) {
          console.error('Missing membershipId in request:', requestData);
          throw new Error('membershipId is required for update_customer_membership');
        }
        
        if (!updates) {
          console.error('Missing updates in request:', requestData);
          throw new Error('updates object is required for update_customer_membership');
        }
        
        // Clean up the updates object - convert empty strings to null for date fields
        const cleanedUpdates = { ...updates };
        if (cleanedUpdates.next_billing_date === '') {
          cleanedUpdates.next_billing_date = null;
        }
        if (cleanedUpdates.current_period_start === '') {
          cleanedUpdates.current_period_start = null;
        }
        if (cleanedUpdates.current_period_end === '') {
          cleanedUpdates.current_period_end = null;
        }
        if (cleanedUpdates.trial_end_date === '') {
          cleanedUpdates.trial_end_date = null;
        }
        if (cleanedUpdates.cancelled_at === '') {
          cleanedUpdates.cancelled_at = null;
        }
        
        console.log('Cleaned updates:', cleanedUpdates);
        console.log('About to update customer_memberships table...');
        const { data: updatedMembership, error: updateMembershipError } = await supabaseClient
          .from('customer_memberships')
          .update(cleanedUpdates)
          .eq('id', updateMembershipId)
          .select();
        
        console.log('Update result:', { data: updatedMembership, error: updateMembershipError });
        
        if (updateMembershipError) {
          console.error('Error updating membership:', updateMembershipError);
          throw updateMembershipError;
        }
        
        return new Response(JSON.stringify(updatedMembership), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      // New billing-related cases
      case 'get_billing_settings':
        const { data: billingSettings, error: settingsError } = await supabaseClient
          .from('billing_settings')
          .select('*')
          .eq('location_id', locationId)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        return new Response(JSON.stringify(billingSettings || {}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update_billing_settings':
        const { data: updatedSettings, error: updateSettingsError } = await supabaseClient
          .from('billing_settings')
          .upsert({ 
            location_id: locationId,
            ...settings 
          })
          .select()
          .single();

        if (updateSettingsError) throw updateSettingsError;
        return new Response(JSON.stringify(updatedSettings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_usage_tracking':
        let usageQuery = supabaseClient
          .from('usage_tracking')
          .select('*')
          .eq('customer_membership_id', membershipId);

        if (startDate) usageQuery = usageQuery.gte('tracking_date', startDate);
        if (endDate) usageQuery = usageQuery.lte('tracking_date', endDate);

        const { data: usageData, error: usageError } = await usageQuery
          .order('tracking_date', { ascending: false });

        if (usageError) throw usageError;
        return new Response(JSON.stringify(usageData || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_billing_invoices':
        const { data: invoices, error: invoicesError } = await supabaseClient
          .from('billing_invoices')
          .select('*')
          .eq('customer_membership_id', membershipId)
          .order('created_at', { ascending: false });

        if (invoicesError) throw invoicesError;
        return new Response(JSON.stringify(invoices || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'trigger_billing_run':
        console.log('Triggering billing run for location:', locationId);
        
        // Trigger the billing engine
        const { data: billingResult, error: billingError } = await supabaseClient.functions.invoke('billing-engine', {
          body: { locationId }
        });

        if (billingError) {
          console.error('Error triggering billing run:', billingError);
          throw billingError;
        }

        return new Response(JSON.stringify(billingResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_billing_dashboard_stats':
        if (!locationId || locationId === 'null' || locationId === 'undefined') {
          return new Response(
            JSON.stringify({ 
              error: 'Valid location ID is required',
              message: 'Please select a location to view billing data'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get billing dashboard stats (reuse logic from GET handler)
        const { count: totalMemberships } = await supabaseClient
          .from('customer_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', locationId)
          .in('billing_status', ['active', 'trial', 'past_due']);

        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        
        const { data: monthlyRevenue } = await supabaseClient
          .from('transactions')
          .select('total_amount')
          .eq('location_id', locationId)
          .eq('source', 'recurring')
          .gte('created_at', firstDayOfMonth.toISOString());

        const totalMonthlyRevenue = monthlyRevenue?.reduce((sum, tx) => sum + (tx.total_amount * 100), 0) || 0;

        const { count: pendingInvoices } = await supabaseClient
          .from('billing_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', locationId)
          .eq('status', 'pending');

        const { count: failedPayments } = await supabaseClient
          .from('billing_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', locationId)
          .in('status', ['failed', 'past_due']);

        const { data: recentInvoices, error: invoicesQueryError } = await supabaseClient
          .from('billing_invoices')
          .select(`
            *,
            customer_memberships(
              customer_id,
              customers(name)
            )
          `)
          .eq('location_id', locationId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (invoicesQueryError) {
          console.error('Error fetching recent invoices:', invoicesQueryError);
        }

        const formattedInvoices = recentInvoices?.map(invoice => {
          let customerName = 'Unknown Customer';
          if (invoice.customer_memberships && typeof invoice.customer_memberships === 'object') {
            const membership = Array.isArray(invoice.customer_memberships) 
              ? invoice.customer_memberships[0] 
              : invoice.customer_memberships;
            
            if (membership?.customers && typeof membership.customers === 'object') {
              const customer = Array.isArray(membership.customers)
                ? membership.customers[0]
                : membership.customers;
              customerName = customer?.name || 'Unknown Customer';
            }
          }
          
          return {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: customerName,
            amount_cents: invoice.total_cents,
            status: invoice.status,
            due_date: invoice.due_date,
            created_at: invoice.created_at
          };
        }) || [];

        // Get current date in proper format for comparison
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get customers due today (including past due dates)
        const { data: customersDueToday, error: dueTodayError } = await supabaseClient
          .from('customer_memberships')
          .select(`
            id,
            customer_id,
            next_billing_date,
            billing_status,
            customers(name),
            membership_plans(name, price_cents)
          `)
          .eq('location_id', locationId)
          .in('billing_status', ['active', 'trial'])
          .in('billing_type', ['hybrid_usage', 'hybrid_fixed'])
          .lte('next_billing_date', todayString);

        if (dueTodayError) {
          console.error('Error fetching customers due today:', dueTodayError);
        }

        // Get customers coming due in next 7 days (tomorrow through 7 days from now)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sevenDaysString = sevenDaysFromNow.toISOString().split('T')[0];
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        const { data: customersUpcoming, error: upcomingError } = await supabaseClient
          .from('customer_memberships')
          .select(`
            id,
            customer_id,
            next_billing_date,
            billing_status,
            customers(name),
            membership_plans(name, price_cents)
          `)
          .eq('location_id', locationId)
          .in('billing_status', ['active', 'trial'])
          .in('billing_type', ['hybrid_usage', 'hybrid_fixed'])
          .gte('next_billing_date', tomorrowString)
          .lte('next_billing_date', sevenDaysString);

        if (upcomingError) {
          console.error('Error fetching upcoming customers:', upcomingError);
        }

        // Format customers due today
        const formattedCustomersDueToday = customersDueToday?.map(membership => {
          const customerName = membership.customers?.name || 'Unknown Customer';
          const planName = membership.membership_plans?.name || 'Unknown Plan';
          const priceCents = membership.membership_plans?.price_cents || 0;
          
          const dueDate = new Date(membership.next_billing_date);
          const today = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: membership.id,
            customer_name: customerName,
            membership_plan_name: planName,
            amount_cents: priceCents,
            due_date: membership.next_billing_date,
            days_until_due: daysDiff
          };
        }) || [];

        // Format upcoming customers
        const formattedCustomersUpcoming = customersUpcoming?.map(membership => {
          const customerName = membership.customers?.name || 'Unknown Customer';
          const planName = membership.membership_plans?.name || 'Unknown Plan';
          const priceCents = membership.membership_plans?.price_cents || 0;
          
          const dueDate = new Date(membership.next_billing_date);
          const today = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: membership.id,
            customer_name: customerName,
            membership_plan_name: planName,
            amount_cents: priceCents,
            due_date: membership.next_billing_date,
            days_until_due: daysDiff
          };
        }) || [];

        const stats = {
          total_memberships: totalMemberships || 0,
          monthly_revenue: Math.round(totalMonthlyRevenue),
          pending_invoices: pendingInvoices || 0,
          failed_payments: failedPayments || 0
        };

        return new Response(JSON.stringify({
          stats,
          recentInvoices: formattedInvoices,
          customersDueToday: formattedCustomersDueToday,
          customersUpcoming: formattedCustomersUpcoming
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error("Error in secure-memberships-api:", error);
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
