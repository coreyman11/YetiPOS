
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Session } from "@supabase/supabase-js"
import { authApi } from "@/services/auth"
import { supabase } from "@/lib/supabase"

interface Store {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  role_name?: string;
  full_name: string | null;
  allowed_locations?: string[];
}

interface AuthContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  activeUser: UserProfile | null;
  selectedStore: Store | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
  switchToUser: (userId: string) => Promise<void>;
  resetToOriginalUser: () => void;
  isContextSwitched: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function with timeout
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isContextSwitched, setIsContextSwitched] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const initCalled = useRef(false)

  // Helper function to check if user is admin or vendor admin
  const isAdmin = () => {
    if (!userProfile) return false;
    return userProfile.role === 'admin' || 
           userProfile.role_name === 'Admin' || 
           userProfile.role_name === 'admin' ||
           userProfile.role === 'Vendor Admin' ||
           userProfile.role_name === 'Vendor Admin';
  };

  // Separate function to load user profile (non-blocking)
  const loadUserProfile = async (userId: string) => {
    if (!userId) return;
    
    try {
      console.log('Loading user profile for:', userId);
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id, 
          email, 
          role, 
          role_id,
          full_name, 
          allowed_locations,
          roles!role_id (
            id,
            name
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Create a basic profile if none exists
        if (profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: session?.user?.email || '',
              role: 'user',
              full_name: session?.user?.user_metadata?.full_name || null
            });
          
          if (!insertError) {
            const basicProfile: UserProfile = {
              id: userId,
              email: session?.user?.email || '',
              role: 'user',
              role_name: 'user',
              full_name: session?.user?.user_metadata?.full_name || null
        };
        setUserProfile(basicProfile);
        if (!isContextSwitched) {
          setActiveUser(basicProfile);
        }
        localStorage.setItem('selectedUser', JSON.stringify(basicProfile));
          }
        }
        return;
      }

      if (profileData) {
        const processedProfile: UserProfile = {
          id: profileData.id,
          email: profileData.email,
          role: profileData.role,
          role_name: (profileData.roles as any)?.name || profileData.role,
          full_name: profileData.full_name,
          allowed_locations: profileData.allowed_locations
        };

        console.log('User profile loaded successfully:', {
          id: processedProfile.id,
          email: processedProfile.email,
          role: processedProfile.role,
          role_name: processedProfile.role_name,
          isAdmin: processedProfile.role === 'admin' || processedProfile.role_name === 'Admin' || processedProfile.role_name === 'Vendor Admin'
        });

        setUserProfile(processedProfile);
        // Set activeUser to the logged-in user if not context switched
        if (!isContextSwitched) {
          setActiveUser(processedProfile);
        }
        localStorage.setItem('selectedUser', JSON.stringify(processedProfile));

        // Handle store selection (non-blocking)
        setTimeout(() => {
          loadStoreSelection(processedProfile);
        }, 0);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Don't block the app, just set a basic profile
      if (session?.user) {
        const basicProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'user',
          role_name: 'user',
          full_name: session.user.user_metadata?.full_name || null
        };
        setUserProfile(basicProfile);
        if (!isContextSwitched) {
          setActiveUser(basicProfile);
        }
        localStorage.setItem('selectedUser', JSON.stringify(basicProfile));
      }
    }
  };

  // Separate function to load store selection (non-blocking)
  const loadStoreSelection = async (profile: UserProfile) => {
    try {
      const storedStore = localStorage.getItem('selectedStore');
      if (storedStore) {
        try {
          const store = JSON.parse(storedStore);
          setSelectedStore(store);
          return;
        } catch (parseError) {
          console.error('Error parsing stored store data:', parseError);
          localStorage.removeItem('selectedStore');
        }
      }

      // Auto-select first allowed location if available
      if (profile.allowed_locations && profile.allowed_locations.length > 0) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name')
          .eq('id', profile.allowed_locations[0])
          .maybeSingle();
        
        if (locationData) {
          const store = { id: locationData.id, name: locationData.name };
          setSelectedStore(store);
          localStorage.setItem('selectedStore', JSON.stringify(store));
        }
      }
    } catch (error) {
      console.error("Error loading store selection:", error);
      // Don't block the app for store selection issues
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (initCalled.current) return;
      initCalled.current = true;
      
      try {
        console.log('Initializing auth...');
        
        // Get the Supabase session with timeout
        const { data: { session: currentSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          3000 // 3 second timeout
        );
        
        if (error) {
          console.error('Error getting Supabase session:', error);
        }
        
        console.log('Supabase session initialized:', currentSession?.user?.id ? 'authenticated' : 'not authenticated');
        setSession(currentSession);
        setIsAuthenticated(!!currentSession?.user);
        
        // Check if the current route is a public storefront route
        const isStoreRoute = location.pathname.startsWith('/store/');
        const isLoginRoute = location.pathname === '/login';
        
        if (currentSession?.user) {
          // Load profile asynchronously (don't block app rendering)
          setTimeout(() => {
            loadUserProfile(currentSession.user.id);
          }, 0);

          // Handle employee redirect
          setTimeout(() => {
            handleEmployeeRedirect(currentSession.user.id);
          }, 100);
          
          // If on login page and authenticated, redirect to dashboard
          if (isLoginRoute) {
            navigate('/', { replace: true });
          }
        } else if (!isStoreRoute && !isLoginRoute) {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsAuthenticated(false);
        const isStoreRoute = location.pathname.startsWith('/store/');
        const isLoginRoute = location.pathname === '/login';
        if (!isStoreRoute && !isLoginRoute) {
          navigate('/login', { replace: true });
        }
      } finally {
        // Always stop loading after initialization attempt
        setTimeout(() => {
          setIsLoading(false);
        }, 500); // Shorter timeout for better UX
      }
    };

    // Handle employee redirect (separate, non-blocking function)
    const handleEmployeeRedirect = async (userId: string) => {
      try {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role, roles!role_id(name)')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileData?.role === 'employee' || 
            ((profileData?.roles as any)?.name && (profileData.roles as any).name.toLowerCase() === 'employee')) {
          const restrictedPaths = ['/', '/dashboard', '/inventory', '/customers', '/reports', '/configuration'];
          if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
            navigate('/services');
          }
        }
      } catch (error) {
        console.error("Error checking employee redirect:", error);
        // Don't block app for redirect checks
      }
    };

    initAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id ? 'authenticated' : 'not authenticated');
        setSession(session);
        setIsAuthenticated(!!session?.user);
        
        // Handle sign in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setActiveUser(null);
          setSelectedStore(null);
          setIsAuthenticated(false);
          setIsContextSwitched(false);
          localStorage.removeItem('selectedUser');
          localStorage.removeItem('selectedStore');
          localStorage.removeItem('activeUser');
          navigate('/login');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname])

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setSession(null);
      setUserProfile(null);
      setActiveUser(null);
      setSelectedStore(null);
      setIsAuthenticated(false);
      setIsContextSwitched(false);
      localStorage.removeItem('selectedUser');
      localStorage.removeItem('selectedStore');
      localStorage.removeItem('activeUser');
      navigate('/login');
    }
  }

  // Function to switch to a different user context (cashier)
  const switchToUser = async (userId: string) => {
    try {
      console.log('Switching context to user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select(`
          id, 
          email, 
          role, 
          role_id,
          full_name, 
          allowed_locations
        `)
        .eq('id', userId)
        .maybeSingle();

      console.log('Profile query result:', { profileData, error });

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!profileData) {
        console.error('No user profile found for ID:', userId);
        throw new Error('User profile not found');
      }

      // Get role name if role_id exists
      let roleName = profileData.role;
      if (profileData.role_id) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('name')
          .eq('id', profileData.role_id)
          .maybeSingle();
        
        if (roleData) {
          roleName = roleData.name;
        }
      }

      const switchedProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        role_name: roleName,
        full_name: profileData.full_name,
        allowed_locations: profileData.allowed_locations
      };

      console.log('Successfully created switched profile:', switchedProfile);

      setActiveUser(switchedProfile);
      setIsContextSwitched(true);
      localStorage.setItem('activeUser', JSON.stringify(switchedProfile));
      
      console.log('Context switched to:', switchedProfile.full_name || switchedProfile.email);
    } catch (error) {
      console.error('Error switching user context:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        userId
      });
      throw error;
    }
  };

  // Function to reset back to original logged-in user
  const resetToOriginalUser = () => {
    console.log('Resetting to original user');
    setActiveUser(userProfile);
    setIsContextSwitched(false);
    localStorage.removeItem('activeUser');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      userProfile, 
      activeUser,
      selectedStore, 
      isLoading, 
      signOut, 
      isAdmin, 
      isAuthenticated,
      switchToUser,
      resetToOriginalUser,
      isContextSwitched
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
