'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const categories = [
  'Housing',
  'Jobs',
  'Items',
  'Services',
  'Community',
  'Events',
] as const

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      body: formData.get('body') as string,
      price: formData.get('price') ? Number(formData.get('price')) : null,
      city: formData.get('city') as string || null,
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('認証が必要です')

      const { error: insertError } = await supabase.from('listings').insert({
        ...data,
        user_id: user.id,
      })

      if (insertError) throw insertError

      router.push('/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>新規リスティング</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリー</label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">タイトル</label>
              <Input
                name="title"
                placeholder="タイトルを入力"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">本文</label>
              <Textarea
                name="body"
                placeholder="本文を入力"
                className="min-h-[200px]"
                maxLength={5000}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">価格</label>
              <Input
                name="price"
                type="number"
                placeholder="価格を入力（任意）"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">都市</label>
              <Input name="city" placeholder="都市名を入力（任意）" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '投稿中...' : '投稿する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 