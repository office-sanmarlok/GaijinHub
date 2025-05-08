'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useSupabase } from '../providers/supabase-provider'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  const { refreshSession } = useSupabase()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      // 繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｮ@繧医ｊ蜑阪・驛ｨ蛻・ｒ蜿門ｾ・
      const displayName = email.split('@')[0]
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (error) throw error

      // 繧ｻ繝・す繝ｧ繝ｳ諠・ｱ繧堤｢ｺ螳溘↓譖ｴ譁ｰ
      await refreshSession()
      
      // 繝ｪ繝繧､繝ｬ繧ｯ繝亥・縺ｫ驕ｷ遘ｻ
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-muted-foreground mt-4">
              After clicking Sign Up, a verification link will be sent to your email from Office 306 &lt;sanmarlok@gmail.com&gt;. Please open this link to verify your account before logging in. If you don&apos;t see the email, please check your spam folder.
            </p>
            <p className="text-sm text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
