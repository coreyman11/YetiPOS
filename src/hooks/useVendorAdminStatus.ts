import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';

export const useVendorAdminStatus = () => {
  const { userProfile, session } = useAuth();

  return useQuery({
    queryKey: ['vendor-admin-status', userProfile?.id, session?.user?.id],
    queryFn: async () => {
      // Check both userProfile and session for user ID
      const userId = userProfile?.id || session?.user?.id;
      
      if (!userId || !session) {
        console.log('No authenticated user found');
        return { isVendorAdmin: false };
      }

      console.log('Checking vendor admin status for user:', userId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          role_id,
          roles(role_scope)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking vendor admin status:', error);
        return { isVendorAdmin: false };
      }

      console.log('Vendor admin check data:', data);
      const isVendorAdmin = data?.roles?.role_scope === 'vendor';
      console.log('Is vendor admin:', isVendorAdmin);

      return {
        isVendorAdmin
      };
    },
    enabled: !!(userProfile?.id || session?.user?.id) && !!session,
  });
};