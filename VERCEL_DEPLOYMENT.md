# Vercel Deployment Guide

## Required Environment Variables

Make sure to add these environment variables in your Vercel project settings:

### 1. Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### 2. Mapbox Configuration
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Your Mapbox access token

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each environment variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://jsejmbudalbcrlljnqor.supabase.co` (or your project URL)
   - **Environment**: Select all (Production, Preview, Development)

4. Repeat for:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

5. After adding all variables, **redeploy** your application

## Verifying Environment Variables

After deployment, check the Vercel logs to ensure:
- No errors about missing environment variables
- Middleware is running correctly
- Supabase connection is working

## Common Issues

### Middleware Invocation Failed
- **Cause**: Missing environment variables
- **Solution**: Ensure all `NEXT_PUBLIC_*` variables are set in Vercel

### Database Connection Errors
- **Cause**: Incorrect Supabase URL or key
- **Solution**: Double-check your Supabase credentials in Vercel

### Map Not Loading
- **Cause**: Missing Mapbox token
- **Solution**: Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to Vercel

## Notes

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Always use your Supabase anon key (not the service role key) for client-side operations
- Never commit `.env.local` to version control (it's already in `.gitignore`)

