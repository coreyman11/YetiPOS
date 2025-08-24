import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure CORS and security headers
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean)
const ACCESS_CONTROL_ALLOW_ORIGIN = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS[0] : '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': ACCESS_CONTROL_ALLOW_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Additional security headers for all responses
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=()'
}

const baseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
  // Minimal CSP since this is an API endpoint returning JSON only
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
}

// Rate limiting storage (in-memory for this example, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  register: { maxAttempts: 3, windowMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60 }
}

// Input validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password is too long' }
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  }
  return { valid: true }
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/
  return phoneRegex.test(phone)
}

const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>'"&]/g, '')
}

// Rate limiting middleware
const checkRateLimit = (identifier: string, action: keyof typeof RATE_LIMITS): boolean => {
  const now = Date.now()
  const limit = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + (limit.windowMinutes * 60 * 1000)
    })
    return true
  }
  
  if (current.count >= limit.maxAttempts) {
    return false
  }
  
  current.count++
  return true
}

// Secure token generation for password reset
const generateSecureToken = async (): Promise<string> => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Password hashing using Web Crypto API (Deno-compatible)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

// Lightweight audit logger (best-effort, non-blocking)
const logEvent = async (
  supabaseClient: ReturnType<typeof createClient>,
  event_type: string,
  params: {
    event_category?: string
    user_identifier?: string
    ip_address?: string
    user_agent?: string
    location_id?: string | null
    event_data?: Record<string, unknown>
    risk_level?: string
  } = {}
) => {
  try {
    await supabaseClient.from('security_audit_log').insert({
      event_type,
      event_category: params.event_category || 'auth',
      user_identifier: params.user_identifier || null,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
      location_id: params.location_id || null,
      event_data: params.event_data || {},
      risk_level: params.risk_level || 'low'
    })
  } catch (_) {
    // Never throw from logger
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: baseHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestBody
    try {
      requestBody = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ message: 'Invalid JSON' }),
        { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, email, phone, password, locationId, customerData } = requestBody

    // Gather request metadata
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    switch (action) {
      case 'login_password': {
        // Input validation
        if (!email || !password) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Email and password are required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!validateEmail(email)) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Invalid email format' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!checkRateLimit(clientIP, 'login')) {
          await logEvent(supabaseClient, 'login_rate_limited', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Too many login attempts. Please try again later.' }),
            { status: 429, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const sanitizedEmail = sanitizeString(email.toLowerCase())

        const { data: customer, error } = await supabaseClient
          .from('customers')
          .select('id, name, email, phone, first_name, last_name, loyalty_points, location_id, password_hash, online_account_active')
          .eq('email', sanitizedEmail)
          .eq('online_account_active', true)
          .single()

        if (error || !customer || !customer.password_hash) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: sanitizedEmail, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Invalid credentials' }),
            { status: 401, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify password using Web Crypto API
        const isValidPassword = await verifyPassword(password, customer.password_hash)

        if (!isValidPassword) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: sanitizedEmail, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Invalid credentials' }),
            { status: 401, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Remove sensitive data before returning
        const { password_hash, ...safeCustomerData } = customer

        await logEvent(supabaseClient, 'login_success', { user_identifier: sanitizedEmail, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', location_id: customer.location_id, event_data: { customer_id: customer.id } })
        return new Response(
          JSON.stringify(safeCustomerData),
          { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'login': {
        if (!email || !phone) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Email and phone are required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!validateEmail(email) || !validatePhone(phone)) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Invalid email or phone format' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!checkRateLimit(clientIP, 'login')) {
          await logEvent(supabaseClient, 'login_rate_limited', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Too many login attempts. Please try again later.' }),
            { status: 429, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data, error } = await supabaseClient
          .rpc('verify_storefront_customer', {
            p_email: sanitizeString(email.toLowerCase()),
            p_phone: sanitizeString(phone),
            p_location_id: locationId
          })

        if (error) throw error
        if (!data || data.length === 0) {
          await logEvent(supabaseClient, 'login_failed', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Invalid credentials' }),
            { status: 401, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await logEvent(supabaseClient, 'login_success', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', location_id: data[0].location_id, event_data: { customer_id: data[0].id } })
        return new Response(
          JSON.stringify(data[0]),
          { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'register': {
        if (!customerData || !password) {
          await logEvent(supabaseClient, 'register_invalid_request', { ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Customer data and password are required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { email, phone, name, first_name, last_name } = customerData

        if (!email || !phone || !name) {
          await logEvent(supabaseClient, 'register_invalid_request', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Email, phone, and name are required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!validateEmail(email)) {
          await logEvent(supabaseClient, 'register_invalid_email', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Invalid email format' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!validatePhone(phone)) {
          await logEvent(supabaseClient, 'register_invalid_phone', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Invalid phone format' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) {
          await logEvent(supabaseClient, 'register_weak_password', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', event_data: { reason: passwordValidation.message } })
          return new Response(
            JSON.stringify({ message: passwordValidation.message }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!checkRateLimit(clientIP, 'register')) {
          await logEvent(supabaseClient, 'register_rate_limited', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Too many registration attempts. Please try again later.' }),
            { status: 429, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Hash password with Web Crypto API
        const passwordHash = await hashPassword(password)

        // Sanitize inputs
        const sanitizedData = {
          name: sanitizeString(name),
          email: sanitizeString(email.toLowerCase()),
          phone: sanitizeString(phone),
          first_name: first_name ? sanitizeString(first_name) : null,
          last_name: last_name ? sanitizeString(last_name) : null,
          location_id: locationId,
          password_hash: passwordHash,
          online_account_active: true,
          loyalty_points: 0
        }

        // Create customer
        const { data: newCustomer, error } = await supabaseClient
          .from('customers')
          .insert(sanitizedData)
          .select('id, name, email, phone, first_name, last_name, loyalty_points, location_id, online_account_active')
          .single()

        if (error) {
          if (error.message.includes('already exists') || error.code === '23505') {
            await logEvent(supabaseClient, 'register_conflict', { user_identifier: sanitizedData.email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
            return new Response(
              JSON.stringify({ message: 'Customer with this email already exists' }),
              { status: 409, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
            )
          }
          throw error
        }

        await logEvent(supabaseClient, 'register_success', { user_identifier: sanitizedData.email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', location_id: locationId, event_data: { customer_id: newCustomer.id } })
        return new Response(
          JSON.stringify(newCustomer),
          { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'password_reset': {
        if (!email) {
          await logEvent(supabaseClient, 'password_reset_invalid_request', { ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Email is required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!validateEmail(email)) {
          await logEvent(supabaseClient, 'password_reset_invalid_email', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Invalid email format' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!checkRateLimit(clientIP, 'password_reset')) {
          await logEvent(supabaseClient, 'password_reset_rate_limited', { user_identifier: email, ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Too many password reset attempts. Please try again later.' }),
            { status: 429, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const sanitizedEmail = sanitizeString(email.toLowerCase())

        const { data: customer, error } = await supabaseClient
          .from('customers')
          .select('id, name, email, first_name, last_name')
          .eq('email', sanitizedEmail)
          .eq('online_account_active', true)
          .single()

        if (error || !customer) {
          await logEvent(supabaseClient, 'password_reset_requested', { user_identifier: sanitizedEmail, ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          // Don't reveal if email exists or not for security
          return new Response(
            JSON.stringify({ message: 'If an account with this email exists, a password reset link will be sent.' }),
            { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate cryptographically secure reset token
        const resetToken = await generateSecureToken()
        
        // Update customer with reset token and expiration
        await supabaseClient
          .from('customers')
          .update({
            password_reset_token: resetToken,
            password_reset_sent_at: new Date().toISOString()
          })
          .eq('id', customer.id)

        // Send password reset email
        try {
          await supabaseClient.functions.invoke('send-customer-email', {
            body: {
              type: 'password_reset',
              customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name
              },
              resetToken,
              locationId
            }
          })
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError)
          // Don't fail the request if email fails
        }

        await logEvent(supabaseClient, 'password_reset_requested', { user_identifier: sanitizedEmail, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', location_id: locationId, event_data: { customer_id: customer.id } })
        return new Response(
          JSON.stringify({ message: 'If an account with this email exists, a password reset link will be sent.' }),
          { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        const { resetToken, newPassword } = requestBody

        if (!resetToken || !newPassword) {
          await logEvent(supabaseClient, 'reset_password_invalid_request', { ip_address: clientIP, user_agent: userAgent, risk_level: 'low' })
          return new Response(
            JSON.stringify({ message: 'Reset token and new password are required' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const passwordValidation = validatePassword(newPassword)
        if (!passwordValidation.valid) {
          await logEvent(supabaseClient, 'reset_password_weak_password', { ip_address: clientIP, user_agent: userAgent, risk_level: 'low', event_data: { reason: passwordValidation.message } })
          return new Response(
            JSON.stringify({ message: passwordValidation.message }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Find customer by reset token
        const { data: customer, error: findError } = await supabaseClient
          .from('customers')
          .select('id, email, password_reset_sent_at')
          .eq('password_reset_token', resetToken)
          .eq('online_account_active', true)
          .single()

        if (findError || !customer) {
          await logEvent(supabaseClient, 'reset_password_failed', { ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Invalid or expired reset token' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if token is expired (1 hour)
        const resetSentAt = new Date(customer.password_reset_sent_at)
        const now = new Date()
        const hoursDiff = (now.getTime() - resetSentAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff > 1) {
          await logEvent(supabaseClient, 'reset_password_failed', { ip_address: clientIP, user_agent: userAgent, risk_level: 'medium' })
          return new Response(
            JSON.stringify({ message: 'Reset token has expired' }),
            { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Hash new password with Web Crypto API
        const newPasswordHash = await hashPassword(newPassword)

        // Update password and clear reset token
        const { error: updateError } = await supabaseClient
          .from('customers')
          .update({
            password_hash: newPasswordHash,
            password_reset_token: null,
            password_reset_sent_at: null
          })
          .eq('id', customer.id)

        if (updateError) throw updateError

        await logEvent(supabaseClient, 'reset_password_success', { user_identifier: customer.email, ip_address: clientIP, user_agent: userAgent, risk_level: 'low', event_data: { customer_id: customer.id } })
        return new Response(
          JSON.stringify({ message: 'Password reset successful' }),
          { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ message: 'Invalid action' }),
          { status: 400, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Storefront auth error:', error)
    
    // Don't expose internal error details in production
    const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined
    const errorMessage = isDev ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
