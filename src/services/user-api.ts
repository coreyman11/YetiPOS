import { supabase } from '@/lib/supabase';

export const userApi = {
  async getAllUsers() {
    try {
      console.log("Fetching all users via edge function...");
      
      // Use the edge function instead of direct query to ensure all security and business logic is applied
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' }
      });
      
      if (error) {
        console.error('Error fetching users via edge function:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} users from edge function`);
      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      
      // Fallback to direct query if edge function fails
      try {
        console.log("Falling back to direct user profiles query...");
        const { data: directData, error: directError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('full_name');
        
        if (directError) {
          console.error('Error in fallback query:', directError);
          return [];
        }
        
        console.log(`Successfully fetched ${directData?.length || 0} users via direct query`);
        return directData || [];
      } catch (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        return [];
      }
    }
  },

  updateUser: async (userId: string, updates: { 
    full_name?: string; 
    role?: string; 
    employee_code?: string; 
    allowed_locations?: string[] 
  }) => {
    console.log("Updating user with ID:", userId, "Updates:", updates);
    
    // Make sure we're sending valid data - convert empty strings to null
    const cleanUpdates = { ...updates };
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key as keyof typeof cleanUpdates] === '') {
        cleanUpdates[key as keyof typeof cleanUpdates] = null;
      }
    });
    
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update',
          userId,
          updates: cleanUpdates
        }
      });
      
      if (response.error) {
        console.error("Supabase function error:", response.error);
        throw response.error;
      }
      
      const { data } = response;
      
      // Check if the response contains an error field
      if (data?.error) {
        console.error("API error response:", data);
        
        // Handle specific error cases
        if (data.code === 'duplicate_employee_code') {
          throw new Error('This employee code is already in use by another user.');
        }
        
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error("Error updating user:", error);
      
      // Extract detailed error message if available
      let errorMessage = 'Failed to update user';
      
      if (error.message) {
        errorMessage = error.message;
        
        // Handle known error types
        if (error.message.includes('duplicate_employee_code') || 
            error.message.includes('already in use')) {
          errorMessage = 'This employee code is already in use by another user.';
        }
      }
      
      // Check for Edge Function errors with HTTP response
      if (error.response) {
        try {
          const responseData = await error.response.json();
          if (responseData.error) {
            errorMessage = responseData.error;
            
            if (responseData.code === 'duplicate_employee_code') {
              errorMessage = 'This employee code is already in use by another user.';
            }
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  createUser: async (userData: { 
    email: string; 
    password: string; 
    full_name: string; 
    role: string;
    employee_code?: string;
    allowed_locations?: string[];
  }) => {
    try {
      console.log("Creating user:", userData.email);
      
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          userData: {
            ...userData,
            emailConfirmed: true // This signals that we want the admin creation with auto-confirm
          }
        }
      });
      
      if (error) {
        console.error("Supabase functions invoke error:", error);
        throw error;
      }
      
      // Check if the response contains an error field
      if (data?.error) {
        console.error("API error response:", data);
        
        // Handle specific error cases
        if (data.code === 'duplicate_email') {
          throw new Error('This email is already in use.');
        }
        if (data.code === 'duplicate_employee_code') {
          throw new Error('This employee code is already in use by another user.');
        }
        
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Try to extract detailed error message if available
      let errorMessage = error.message || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('already in use')) {
        if (errorMessage.includes('email')) {
          errorMessage = 'This email is already in use.';
        } else if (errorMessage.includes('employee code')) {
          errorMessage = 'This employee code is already in use by another user.';
        } else {
          errorMessage = 'This email or employee code is already in use.';
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  validateEmployeeCode: async (employeeCode: string) => {
    // Use the edge function endpoint for validation instead of direct database query
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { 
        action: 'validate_employee_code',
        employeeCode 
      }
    });
    
    if (error) throw error;
    
    // The edge function will return { valid: boolean, user?: UserProfile }
    return data;
  },

  getLocations: async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data;
  }
};
