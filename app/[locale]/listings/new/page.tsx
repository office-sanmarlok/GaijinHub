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
import { Label } from '@/components/ui/label'
import SearchForm, { LocationSelection } from '@/components/common/SearchForm'
import { ImageUploader, UploadedImage } from '@/components/common/ImageUploader'
import { processListingImages } from '@/lib/utils/image-upload'
import { useLocale } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MapPin } from 'lucide-react'

const categories = [
  'Housing',
  'Jobs',
  'Items for Sale',
  'Services',
] as const

export default function NewListingPage() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [locationShareType, setLocationShareType] = useState<'none' | 'station' | 'municipality'>('none')
  const [selectedLocations, setSelectedLocations] = useState<LocationSelection[]>([])

  const handleImageChange = (newImages: UploadedImage[]) => {
    setImages(newImages)
    setImageError(null)
  }

  const handleLocationSelect = (locations: LocationSelection[]) => {
    setSelectedLocations(locations)
  }

  // SearchFormのonSearchは使用しないが、必須のため空の関数を提供
  const handleSearchFormSubmit = () => {
    // 何もしない - locationOnlyModeでは検索ボタンも非表示
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (images.length === 0) {
      setImageError('少なくとも1枚の画像が必要です。')
      return
    }
    setError(null)
    setImageError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      // 1. まずテキスト情報でリスティングを作成し、IDを取得
      const baseData = {
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        body: formData.get('body') as string,
        price: formData.get('price') ? Number(formData.get('price')) : null,
      }

      let locationData = {}
      if (locationShareType !== 'none' && selectedLocations.length > 0) {
        const location = selectedLocations[0]
        if (location.type === 'station') {
          locationData = {
            station_id: location.data.station_cd || location.data.id,
            muni_id: location.data.muni_id,
            has_location: true,
            is_city_only: locationShareType === 'municipality',
          }
        } else if (location.type === 'municipality') {
          locationData = {
            muni_id: location.data.id || location.data.muni_id,
            station_id: null,
            has_location: true,
            is_city_only: true,
          }
        }
      } else {
        locationData = {
          has_location: false,
          is_city_only: false,
          station_id: null,
          muni_id: null,
        }
      }
      
      const initialListingData = { ...baseData, ...locationData, user_id: user.id }

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert(initialListingData)
        .select()
        .single()

      if (listingError) throw listingError

      const listingId = listing.id
      if (!listingId) throw new Error('Failed to create listing and get ID.')
      
      // 2. 取得したリスティングIDを使って画像をアップロードし、DBレコードを更新
      const { repImageUrl, imageRecords } = await processListingImages(images, user.id, listingId)
      
      // 3. APIエンドポイントは使わず、ここで完結させるか、あるいは
      //    画像情報を更新するための別のAPIエンドポイントを叩くのがよりクリーン
      //    今回はクライアントサイドで完結させる
      
      // listingsテーブルのrep_image_urlを更新
      if (repImageUrl) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({ rep_image_url: repImageUrl })
          .eq('id', listingId)
        
        if (updateError) {
          // エラーはコンソールに出力するが、処理は続行する
          console.error('Failed to update representative image:', updateError)
        }
      }

      // Add to translation queue
      try {
        const response = await fetch(`/api/listings/${listingId}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        if (!response.ok) {
          console.error('Failed to queue translation');
        }
      } catch (error) {
        console.error('Translation queue error:', error);
      }

      router.push(`/${locale}/listings/${listingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <label className="text-sm font-medium">Title</label>
              <Input
                name="title"
                placeholder="Enter title"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="body"
                placeholder="Enter description"
                className="min-h-[200px]"
                maxLength={5000}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input
                name="price"
                type="number"
                placeholder="Enter price (optional)"
                min={0}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  位置情報の共有設定
                </Label>
                <Select value={locationShareType} onValueChange={(value: 'none' | 'station' | 'municipality') => setLocationShareType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="位置情報の共有範囲を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">位置情報を共有しない</SelectItem>
                    <SelectItem value="station">駅名まで共有</SelectItem>
                    <SelectItem value="municipality">市区町村まで共有</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {locationShareType !== 'none' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {locationShareType === 'station' ? '最寄り駅' : '所在地域'}
                  </Label>
                  <SearchForm
                    onSearch={handleSearchFormSubmit}
                    onLocationSelect={handleLocationSelect}
                    locationOnlyMode={true}
                    hideSearchButton={true}
                    allowedLocationTypes={['station']}
                    className="w-full"
                  />
                  {selectedLocations.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      選択中: {selectedLocations.map(loc => loc.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Images (max 5)</label>
              <ImageUploader 
                images={images} 
                onChange={handleImageChange} 
                maxImages={5} 
              />
              {imageError && (
                <p className="text-amber-500 text-sm">{imageError}</p>
              )}
              <p className="text-xs text-gray-500">
                The first image will be used as the main image in listings. Click on an image to set it as the main image.
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
                  Posting...
                </>
              ) : (
                'Post Listing'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 