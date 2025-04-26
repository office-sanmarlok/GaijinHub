# GaijinHub

Platform for the foreign community in Japan

## Authentication and User Data Handling

### Server-side Authentication

In server components, use `createServerComponentClient` to get authentication state:

```typescript
const cookieStore = cookies()
const supabase = createServerComponentClient({ cookies: () => cookieStore })

// Get user data (check if authenticated)
const { data: { user } } = await supabase.auth.getUser()
```

### Client-side State Management

In client components, use `createClient` to manage authentication state:

```typescript
const supabase = createClient()

// Get initial user data
const { data: { user } } = await supabase.auth.getUser()

// Monitor authentication state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    // Update user data
  }
})
```

### Security Notes

1. Always use `getUser()` in server components to retrieve authenticated user data
2. Properly monitor authentication state changes in client components
3. Safely retrieve user metadata (display name, etc.) from `user.user_metadata`

### Updating User Metadata

Update metadata such as display name as follows:

```typescript
const { error } = await supabase.auth.updateUser({
  data: { display_name: 'New Name' }
})
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file and configure the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

3. Start the development server:

```bash
npm run dev
```

4. Supabase Setup:

**Avatar Storage and Table Setup:**

1. Create the following tables in the Supabase dashboard:

```sql
CREATE TABLE public.avatars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Set up RLS policies
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Users can only view their own avatars
CREATE POLICY "Users can view their own avatars" ON public.avatars
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only add their own avatars
CREATE POLICY "Users can add their own avatars" ON public.avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars" ON public.avatars
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON public.avatars
  FOR DELETE USING (auth.uid() = user_id);
```

2. Create an avatar bucket in Storage:
   - Click "New Bucket" in the Storage section
   - Set the bucket name to "avatars"
   - Check "Make bucket public"
   - Click the create button

**Notes:**
- The above setup is required to use the avatar upload feature
- Set up RLS policies to allow only image files in avatar storage

## Features

- Authentication (Signup/Login)
- Creating and viewing listings
- Filtering by category
- Location-based search
- Multi-language support (English, Japanese, Chinese)

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Supabase
- Shadcn UI
- Tailwind CSS

## Project Structure

- `app/` - Next.js app directory
  - `components/` - Reusable UI components
  - `listings/` - Listings page and related components
  - `providers/` - Context providers
- `public/` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
