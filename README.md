This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and configured with [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), and [Supabase](https://supabase.com/).

## Getting Started

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Set Up Supabase

1. Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (or create a new one)
   - Go to Settings → API
   - Copy your `Project URL` and `anon` `public` key

3. Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database Setup

### Running Migrations

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql` - Creates all tables and RLS policies
   - `supabase/storage_setup.sql` - Sets up storage bucket and policies

### Creating an Admin User

To create an admin user:
1. Sign up normally through the app
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find your user and change the `role` field from `user` to `admin`

## Project Structure

- `lib/supabase/client.ts` - Client-side Supabase client (use in Client Components)
- `lib/supabase/server.ts` - Server-side Supabase client (use in Server Components)
- `lib/auth.ts` - Authentication helpers and role management
- `lib/image-upload.ts` - Property image upload utilities
- `middleware.ts` - Handles Supabase auth cookie refresh
- `lib/utils.ts` - Utility functions (includes cn for shadcn/ui)
- `components/` - Reusable React components
- `app/` - Next.js App Router pages
- `supabase/migrations/` - Database migration files

## Using Supabase

### Client Components

```typescript
import { createClient } from '@/lib/supabase/client'

export default function ClientComponent() {
  const supabase = createClient()
  // Use supabase client...
}
```

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  // Use supabase client...
}
```

## Features

- **Home Page**: Hero section with search component (Buy/Rent toggle, location dropdown), featured properties, and property type cards
- **Buy/Rent Pages**: Advanced filtering (price, property type, bed/baths, area), two-column layout (property cards + Mapbox map), and save search functionality
- **Single Property Page**: Full property details with image gallery, agent information, favorite button, and map
- **Sell Page**: Property listing form with image upload, location picker, and draft/publish functionality
- **Favourites Page**: User's favorite properties with remove functionality
- **User Dashboard**: Saved searches, recently viewed properties, and favorites sections
- **Agent Dashboard**: Manage listings (add/edit/delete/publish), listing analytics, and profile management
- **Admin Panel**: Manage all properties (approve/publish/delete), user management, role management, and stats
- **Agent Profiles**: Public agent pages showing company info and their listings
- **Authentication**: Role-based access control (user, agent, admin) with Supabase Auth
- **Map Integration**: Mapbox maps with property markers and preview popups
- **Image Upload**: Supabase Storage integration for property images

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Supabase** - Backend as a Service (Database, Auth, Storage)
- **Mapbox** - Interactive maps

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
