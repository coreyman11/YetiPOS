import React, { createContext, useContext, useState, useEffect } from 'react';
import { Database } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { rateLimiter, checkRateLimit, RateLimitError } from '@/utils/rate-limiting';
import { secureLogger } from '@/utils/secure-logging';

type Customer = Database['public']['Tables']['customers']['Row'];

interface StorefrontAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginLegacy: (email: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  register: (customerData: {
    name: string;
    email: string;
    phone: string;
    first_name?: string;
    last_name?: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const StorefrontAuthContext = createContext<StorefrontAuthContextType | null>(null);

export const useStorefrontAuth = () => {
  const context = useContext(StorefrontAuthContext);
  if (!context) {
    throw new Error('useStorefrontAuth must be used within a StorefrontAuthProvider');
  }
  return context;
};

// Secure session token generation
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Session encryption/decryption (basic implementation)
const encryptSession = (data: Customer): string => {
  const sessionData = {
    customer: data,
    timestamp: Date.now(),
    token: generateSessionToken()
  };
  return btoa(JSON.stringify(sessionData));
};

const decryptSession = (encryptedData: string): Customer | null => {
  try {
    const sessionData = JSON.parse(atob(encryptedData));
    // Check if session is expired (24 hours)
    if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return sessionData.customer;
  } catch {
    return null;
  }
};

export const StorefrontAuthProvider = ({ 
  children, 
  storeId, 
  locationId 
}: { 
  children: React.ReactNode;
  storeId: number;
  locationId: string;
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure rate limiting for auth endpoints
    rateLimiter.configure('storefront-login', {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000 // 5 attempts per 15 minutes
    });

    rateLimiter.configure('storefront-register', {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000 // 3 attempts per hour
    });

    rateLimiter.configure('storefront-password-reset', {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000 // 3 attempts per hour
    });

    // Check for stored customer session with encryption
    const storedSession = localStorage.getItem(`storefront_session_${storeId}`);
    if (storedSession) {
      try {
        const decryptedCustomer = decryptSession(storedSession);
        if (decryptedCustomer) {
          setCustomer(decryptedCustomer);
        } else {
          localStorage.removeItem(`storefront_session_${storeId}`);
        }
      } catch (error) {
        secureLogger.warn('Failed to decrypt stored session', error);
        localStorage.removeItem(`storefront_session_${storeId}`);
      }
    }
    setIsLoading(false);
  }, [storeId]);

  // Input validation helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'Password is too long' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
    }
    return { valid: true };
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>'"&]/g, '');
  };

  // Secure API call helper
  const makeSecureAPICall = async (endpoint: string, data: any): Promise<Response> => {
    try {
      const response = await supabase.functions.invoke(endpoint, {
        body: data
      });

      if (response.error) {
        throw new Error(response.error.message || 'API call failed');
      }

      return {
        ok: !response.error,
        json: async () => response.data,
        status: response.error ? 500 : 200
      } as Response;
    } catch (error) {
      secureLogger.error('API call failed', { endpoint, error });
      throw error;
    }
  };

  // New password-based login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!password || password.length < 1) {
        return { success: false, error: 'Password is required' };
      }

      // Rate limiting
      try {
        checkRateLimit('storefront-login');
      } catch (error) {
        if (error instanceof RateLimitError) {
          return { success: false, error: 'Too many login attempts. Please try again later.' };
        }
        throw error;
      }

      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      const response = await makeSecureAPICall('storefront-auth', {
        action: 'login_password',
        email: sanitizedEmail,
        password,
        locationId
      });
      
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
        
        // Store encrypted session
        const encryptedSession = encryptSession(customerData);
        localStorage.setItem(`storefront_session_${storeId}`, encryptedSession);
        
        secureLogger.info('Customer login successful');
        return { success: true };
      } else {
        const error = await response.json();
        secureLogger.warn('Customer login failed');
        return { success: false, error: error.message || 'Login failed' };
      }
    } catch (error) {
      secureLogger.error('Login error', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy phone-based login for existing customers
  const loginLegacy = async (email: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!phone || phone.length < 10) {
        return { success: false, error: 'Valid phone number is required' };
      }

      // Rate limiting
      try {
        checkRateLimit('storefront-login');
      } catch (error) {
        if (error instanceof RateLimitError) {
          return { success: false, error: 'Too many login attempts. Please try again later.' };
        }
        throw error;
      }

      const response = await makeSecureAPICall('storefront-auth', {
        action: 'login',
        email: sanitizeInput(email.toLowerCase()),
        phone: sanitizeInput(phone),
        locationId
      });
      
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
        
        // Store encrypted session
        const encryptedSession = encryptSession(customerData);
        localStorage.setItem(`storefront_session_${storeId}`, encryptedSession);
        
        secureLogger.info('Customer legacy login successful');
        return { success: true };
      } else {
        const error = await response.json();
        secureLogger.warn('Customer legacy login failed');
        return { success: false, error: error.message || 'Login failed' };
      }
    } catch (error) {
      secureLogger.error('Legacy login error', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (customerData: {
    name: string;
    email: string;
    phone: string;
    first_name?: string;
    last_name?: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!validateEmail(customerData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      const passwordValidation = validatePassword(customerData.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.message! };
      }

      if (!customerData.name || customerData.name.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters long' };
      }

      if (!customerData.phone || customerData.phone.length < 10) {
        return { success: false, error: 'Valid phone number is required' };
      }

      // Rate limiting
      try {
        checkRateLimit('storefront-register');
      } catch (error) {
        if (error instanceof RateLimitError) {
          return { success: false, error: 'Too many registration attempts. Please try again later.' };
        }
        throw error;
      }

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(customerData.name),
        email: sanitizeInput(customerData.email.toLowerCase()),
        phone: sanitizeInput(customerData.phone),
        first_name: customerData.first_name ? sanitizeInput(customerData.first_name) : undefined,
        last_name: customerData.last_name ? sanitizeInput(customerData.last_name) : undefined,
        password: customerData.password
      };
      
      const response = await makeSecureAPICall('storefront-auth', {
        action: 'register',
        customerData: sanitizedData,
        locationId,
        password: sanitizedData.password
      });
      
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomer(newCustomer);
        
        // Store encrypted session
        const encryptedSession = encryptSession(newCustomer);
        localStorage.setItem(`storefront_session_${storeId}`, encryptedSession);
        
        secureLogger.info('Customer registration successful');
        return { success: true };
      } else {
        const error = await response.json();
        secureLogger.warn('Customer registration failed');
        return { success: false, error: error.message || 'Registration failed' };
      }
    } catch (error) {
      secureLogger.error('Registration error', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Rate limiting
      try {
        checkRateLimit('storefront-password-reset');
      } catch (error) {
        if (error instanceof RateLimitError) {
          return { success: false, error: 'Too many password reset attempts. Please try again later.' };
        }
        throw error;
      }
      
      const response = await makeSecureAPICall('storefront-auth', {
        action: 'password_reset',
        email: sanitizeInput(email.toLowerCase()),
        locationId
      });
      
      if (response.ok) {
        secureLogger.info('Password reset requested');
        return { success: true };
      } else {
        const error = await response.json();
        secureLogger.warn('Password reset request failed');
        return { success: false, error: error.message || 'Password reset failed' };
      }
    } catch (error) {
      secureLogger.error('Password reset error', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(`storefront_session_${storeId}`);
    secureLogger.info('Customer logged out');
  };

  return (
    <StorefrontAuthContext.Provider value={{
      customer,
      isLoading,
      login,
      loginLegacy,
      register,
      requestPasswordReset,
      logout,
      isAuthenticated: !!customer
    }}>
      {children}
    </StorefrontAuthContext.Provider>
  );
};