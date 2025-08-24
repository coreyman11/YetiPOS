
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"

export const authApi = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Email not confirmed")
      }
      throw error
    }

    return data
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        if (error.message.includes('session_not_found')) {
          // Session already expired or doesn't exist, consider it a successful logout
          console.log('Session already expired, considering signout successful');
          return
        }
        console.error('Error during signout:', error);
        throw error
      }
    } catch (error: any) {
      console.error('Signout error:', error)
      // If the session is already invalid, consider it a successful logout
      if (error.message?.includes('session_not_found')) {
        console.log('Session not found error caught, considering signout successful');
        return
      }
      // Don't throw here, let the caller handle cleanup regardless of API success
      console.warn('Non-critical error during sign out:', error);
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      return session
    } catch (error) {
      console.error('Unexpected error in getSession:', error);
      return null;
    }
  }
}
