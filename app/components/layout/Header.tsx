'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';
import { getSession } from '@/lib/supabase/client';
import { handleAuthError } from '@/lib/utils/error-handlers';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // セッションの存在を確認してからユーザー情報を取得
        const { data: { session } } = await supabase.auth.getSession();
        
        // セッションがない場合は早期リターン（これは正常な状態）
        if (!session) {
          setUser(null);
          setDisplayName('');
          setLoading(false);
          return;
        }
        
        // セッションがある場合のみユーザー情報を取得
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setUser(null);
          setDisplayName('');
          return;
        }

        if (user) {
          setUser(user);
          setDisplayName(user.user_metadata?.display_name || '');

          try {
            // アバター取得
            const { data: avatar, error: avatarError } = await supabase
              .from('avatars')
              .select('avatar_path')
              .eq('user_id', user.id)
              .single();

            if (avatarError && avatarError.code !== 'PGRST116') {
              console.error('Error fetching avatar:', avatarError);
              return;
            }

            if (avatar?.avatar_path) {
              try {
                const { data } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(avatar.avatar_path);
                
                // ここでconsole.logでURLを確認
                console.log('Avatar public URL:', data.publicUrl);
                setAvatarUrl(data.publicUrl);
              } catch (urlError) {
                console.error('Error getting avatar URL:', urlError);
              }
            }
          } catch (avatarError) {
            console.error('Unexpected error fetching avatar:', avatarError);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setUser(null);
        setDisplayName('');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setDisplayName('');
          setAvatarUrl(null);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setDisplayName(session.user.user_metadata?.display_name || '');
          
          // アバターの更新
          try {
            const { data: avatar, error: avatarError } = await supabase
              .from('avatars')
              .select('avatar_path')
              .eq('user_id', session.user.id)
              .single();

            // avatarErrorが存在し、かつデータが見つからないエラー（PGRST116）でない場合のみエラーとして扱う
            if (avatarError && avatarError.code !== 'PGRST116') {
              console.error('Error fetching avatar on auth change:', avatarError);
              return;
            }

            // アバターが見つからない場合は何もしない（デフォルトのアバターを表示）
            if (!avatar) {
              return;
            }

            if (avatar?.avatar_path) {
              try {
                const { data } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(avatar.avatar_path);
                
                // ここでconsole.logでURLを確認
                console.log('Avatar public URL after auth change:', data.publicUrl);
                setAvatarUrl(data.publicUrl);
              } catch (urlError) {
                console.error('Error getting avatar URL:', urlError);
              }
            }
          } catch (avatarError) {
            // エラーの内容を詳細に記録
            if (avatarError instanceof Error) {
              console.error('Unexpected error fetching avatar:', avatarError.message);
            } else {
              console.error('Unknown error fetching avatar:', avatarError);
            }
            // エラーがあってもユーザー情報は表示する（アバターだけの問題）
          }
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
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
          {user ? (
            <>
              <Link href="/listings/new">
                <Button variant="outline">投稿する</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 border border-border hover:ring-2 hover:ring-primary/20 transition-all">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName || 'ユーザー'} />
                    ) : (
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                    {displayName || user?.email?.split('@')[0] || 'ユーザー'}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/account">アカウント設定</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">ログイン</Button>
              </Link>
              <Link href="/signup">
                <Button>新規登録</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 