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
import { ImageUploader, UploadedImage } from '@/app/components/common/ImageUploader'
import { processListingImages } from '@/lib/utils/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const categories = [
  'Housing',
  'Jobs',
  'Items for Sale',
  'Services',
] as const

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  const handleImageChange = (newImages: UploadedImage[]) => {
    setImages(newImages)
    setImageError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setImageError(null)
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

      // リスティングをデータベースに保存
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()

      if (insertError) throw insertError

      // 作成されたリスティングのIDを取得
      if (!listing || listing.length === 0) {
        throw new Error('リスティングの作成に失敗しました')
      }

      const listingId = listing[0].id

      // 画像がある場合は処理
      if (images.length > 0) {
        try {
          await processListingImages(images, user.id, listingId)
        } catch (imgError) {
          console.error('画像処理エラー:', imgError)
          setImageError('画像のアップロードに失敗しました。後でマイページから追加できます。')
          // 画像エラーがあってもリスティング作成は続行
        }
      }

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
              <label className="text-sm font-medium">説明</label>
              <Textarea
                name="body"
                placeholder="説明を入力"
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
              <Input 
                name="city" 
                placeholder="都市名を入力（任意）" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">画像 (最大5枚)</label>
              <ImageUploader 
                images={images} 
                onChange={handleImageChange} 
                maxImages={5} 
              />
              {imageError && (
                <p className="text-amber-500 text-sm">{imageError}</p>
              )}
              <p className="text-xs text-gray-500">
                最初の画像が代表画像としてリスト表示に使用されます。画像をクリックして代表画像を変更できます。
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  投稿中...
                </>
              ) : (
                '投稿する'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 