'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const { user, isLoading, signOut } = useSupabase();
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setDisplayName('');
        setAvatarUrl(null);
        return;
      }

      // Set user's display_name
      setDisplayName(user.user_metadata?.display_name || '');

      try {
        // Use the built-in get_avatar_url function for better performance
        const { data: avatarUrl, error: avatarError } = await supabase
          .rpc('get_avatar_url', { user_id: user.id });

        if (avatarError) {
          console.error('Error fetching avatar URL:', avatarError);
          return;
        }

        if (avatarUrl) {
          setAvatarUrl(avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-background z-50 border-b">
        <div className="container h-full mx-auto px-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold shrink-0">
            GaijinHub
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background z-50 border-b">
      <div className="container h-full mx-auto px-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold shrink-0">
          GaijinHub
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/listings">
            <Button variant="ghost">物件検索</Button>
          </Link>
          {user ? (
            <>
              <Link href="/listings/new">
                <Button variant="outline">New Post</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 border border-border hover:ring-2 hover:ring-primary/20 transition-all">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName || 'User'} />
                    ) : (
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                    {displayName || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/account/favorites" className="flex items-center">
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/my-listings" className="flex items-center">
                      My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account">Account Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 