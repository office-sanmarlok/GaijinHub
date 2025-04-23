'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User as UserIcon } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('表示名未設定')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user.id) {
        const { data: avatar } = await supabase
          .from('avatars')
          .select('avatar_path')
          .eq('user_id', session.user.id)
          .single()
        
        setAvatarUrl(avatar?.avatar_path ?? null)

        if (session.user.user_metadata?.display_name) {
          setDisplayName(session.user.user_metadata.display_name)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user.user_metadata?.display_name) {
        setDisplayName(session.user.user_metadata.display_name)
      } else {
        setDisplayName('表示名未設定')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold">
          GaijinHub
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {session ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                {displayName}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={avatarUrl 
                          ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
                          : undefined
                        }
                        alt="Avatar"
                      />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      アカウント設定
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    サインアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">
                サインイン
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 