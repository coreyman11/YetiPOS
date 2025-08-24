
# Environment Variables Setup

This application uses environment variables to manage sensitive configuration like API keys and connection strings. Follow these steps to set up your environment variables properly:

## Local Development Setup

1. Create a `.env` file in the root directory of the project
2. Copy the contents from `.env.example` to your `.env` file
3. Replace the placeholder values with your actual credentials:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your-actual-publishable-key
VITE_STRIPE_SECRET_KEY=your-actual-secret-key
```

## Version Control - Important!

If you're using version control (like Git), make sure to update your `.gitignore` file to include the following entries:

```
# Environment Variables - only keep examples in version control
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*
!.env.example

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

## Important Security Notes

- **NEVER** commit your `.env` file to version control
- **ONLY** use the anon key and publishable keys on the frontend (the ones prefixed with `VITE_`)
- Service role keys, Stripe secret keys, and other sensitive credentials should only be used in server environments
- When deploying, set these environment variables in your hosting platform's environment configuration

## Environment Variables Reference

| Variable Name | Description | Required |
|---------------|-------------|----------|
| VITE_SUPABASE_URL | Your Supabase project URL | Yes |
| VITE_SUPABASE_ANON_KEY | Your Supabase anonymous key | Yes |
| VITE_STRIPE_PUBLISHABLE_KEY | Your Stripe publishable key | For Stripe features |
| VITE_STRIPE_SECRET_KEY | Your Stripe secret key | For Stripe features (server-side only) |

## Stripe Key Management

For Stripe integration:
- Frontend: Use `VITE_STRIPE_PUBLISHABLE_KEY` in your .env file
- Backend: Stripe secret keys are stored securely in Supabase edge function secrets or in server environment variables (never in client-side code)
