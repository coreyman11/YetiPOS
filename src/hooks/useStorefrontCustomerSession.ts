import { useState, useEffect } from 'react';
import { Customer } from '@/pages/services/hooks/payment/types';

interface StorefrontSession {
  customer: Customer;
  timestamp: number;
  token: string;
}

export const useStorefrontCustomerSession = () => {
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decryptSession = (encryptedData: string): Customer | null => {
    try {
      const sessionData: StorefrontSession = JSON.parse(atob(encryptedData));
      // Check if session is expired (24 hours)
      if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
        return null;
      }
      return sessionData.customer;
    } catch {
      return null;
    }
  };

  const checkForStorefrontSession = (storeId?: number) => {
    setIsLoading(true);
    
    if (!storeId) {
      setActiveCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const storedSession = localStorage.getItem(`storefront_session_${storeId}`);
      if (storedSession) {
        const customer = decryptSession(storedSession);
        if (customer) {
          console.log('Found active storefront customer session:', customer.name);
          setActiveCustomer(customer);
        } else {
          localStorage.removeItem(`storefront_session_${storeId}`);
          setActiveCustomer(null);
        }
      } else {
        setActiveCustomer(null);
      }
    } catch (error) {
      console.error('Error checking storefront session:', error);
      setActiveCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorefrontSession = (storeId?: number) => {
    if (storeId) {
      localStorage.removeItem(`storefront_session_${storeId}`);
    }
    setActiveCustomer(null);
  };

  useEffect(() => {
    // Listen for storage changes to detect login/logout from storefront
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('storefront_session_')) {
        const storeId = e.key.split('_')[2];
        if (storeId) {
          checkForStorefrontSession(parseInt(storeId));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    activeCustomer,
    isLoading,
    checkForStorefrontSession,
    clearStorefrontSession
  };
};