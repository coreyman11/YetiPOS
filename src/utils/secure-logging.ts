/**
 * Enhanced secure logging utilities for production safety
 */

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

/**
 * Comprehensive list of sensitive keys to redact
 */
const DEFAULT_SENSITIVE_KEYS = [
  'key', 'secret', 'token', 'password', 'auth', 'session', 'api_key', 'apikey',
  'card', 'credit', 'payment', 'stripe', 'billing', 'account', 'customer_id',
  'client_secret', 'publishable_key', 'private_key', 'access_token', 'refresh_token',
  'authorization', 'bearer', 'jwt', 'cookie', 'session_id', 'csrf'
];

/**
 * Redacts sensitive information in objects before logging
 * @param obj Object to redact
 * @param sensitiveKeys Array of key substrings to identify sensitive fields
 * @returns Redacted object safe for logging
 */
export const redactSensitiveInfo = (obj: any, sensitiveKeys = DEFAULT_SENSITIVE_KEYS): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveInfo(item, sensitiveKeys));
  }
  
  const redacted = { ...obj };
  for (const key in redacted) {
    const keyLower = key.toLowerCase();
    
    // Check if this key should be redacted
    if (sensitiveKeys.some(sk => keyLower.includes(sk.toLowerCase()))) {
      if (typeof redacted[key] === 'string') {
        const str = redacted[key];
        if (str.length > 8) {
          redacted[key] = `${str.substring(0, 4)}...${str.slice(-4)}`;
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveInfo(redacted[key], sensitiveKeys);
    }
  }
  return redacted;
};

/**
 * Safe console logger that automatically redacts sensitive information
 */
class SecureLogger {
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private processArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return redactSensitiveInfo(arg);
      }
      return arg;
    });
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...this.processArgs(args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...this.processArgs(args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...this.processArgs(args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...this.processArgs(args));
    }
  }

  // Special method for API calls that completely suppresses logs in production
  apiCall(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(`[API] ${message}`, data ? redactSensitiveInfo(data) : '');
    }
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

/**
 * Generic error message for production use
 */
export const getGenericErrorMessage = (error: any): string => {
  if (isProduction) {
    return 'An error occurred. Please try again.';
  }
  return error?.message || 'An unexpected error occurred';
};

/**
 * Safe error response for APIs
 */
export const createSecureErrorResponse = (error: any, defaultMessage = 'An error occurred'): { error: string; details?: string } => {
  if (isProduction) {
    return { error: defaultMessage };
  }
  
  return {
    error: error?.message || defaultMessage,
    details: error?.code || error?.type || undefined
  };
};

/**
 * Sanitize metadata for external APIs
 */
export const sanitizeMetadata = (metadata: Record<string, any>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    
    // Skip sensitive keys entirely
    if (DEFAULT_SENSITIVE_KEYS.some(sk => keyLower.includes(sk))) {
      continue;
    }
    
    // Convert to string
    if (value !== undefined && value !== null) {
      sanitized[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
  }
  
  return sanitized;
};

/**
 * Set up secure logging by patching console methods to automatically redact sensitive information
 * This function maintains backward compatibility with the existing codebase
 */
export const setupSecureLogging = () => {
  // In production, we don't want to patch console methods to avoid performance overhead
  if (isProduction) {
    return;
  }

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  if (typeof window !== 'undefined' && isDevelopment) {
    console.log = function() {
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' && arg !== null ? redactSensitiveInfo(arg) : arg
      );
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function() {
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' && arg !== null ? redactSensitiveInfo(arg) : arg
      );
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function() {
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' && arg !== null ? redactSensitiveInfo(arg) : arg
      );
      originalConsoleWarn.apply(console, args);
    };
    
    console.info = function() {
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' && arg !== null ? redactSensitiveInfo(arg) : arg
      );
      originalConsoleInfo.apply(console, args);
    };
  }
};