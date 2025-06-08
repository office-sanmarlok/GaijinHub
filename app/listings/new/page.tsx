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
import UnifiedLocationSearch, { LocationSelection } from '@/components/common/UnifiedLocationSearch'
import { ImageUploader, UploadedImage } from '@/components/common/ImageUploader'
import { processListingImages } from '@/lib/utils/image-upload'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [locationShareType, setLocationShareType] = useState<'none' | 'station' | 'municipality'>('none')
  const [selectedStation, setSelectedStation] = useState<LocationSelection | null>(null)

  const handleImageChange = (newImages: UploadedImage[]) => {
    setImages(newImages)
    setImageError(null)
  }

  const handleLocationSelect = (selection: LocationSelection | null) => {
    setSelectedStation(selection)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setImageError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const baseData = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      body: formData.get('body') as string,
      price: formData.get('price') ? Number(formData.get('price')) : null,
    }

    // 位置情報を処理
    let locationData = {}
    if (locationShareType !== 'none' && selectedStation) {
      locationData = {
        station_id: selectedStation.type === 'station' ? selectedStation.data.id || selectedStation.data.station_cd : null,
        muni_id: locationShareType === 'municipality' ? selectedStation.data.municipality_id || selectedStation.data.muni_id : null,
        has_location: true,
        is_city_only: locationShareType === 'municipality'
      }
    }

    // 画像データを含める
    const imageData = images.map((image, index) => ({
      path: image.url,
      order: index
    }))

    const data = { 
      ...baseData, 
      ...locationData,
      images: imageData.length > 0 ? imageData : undefined
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Authentication required')
      
      console.log('User authenticated:', user.id)

      console.log('Sending data to API:', JSON.stringify(data, null, 2))

      // 最小限のテストデータで試行
      const testData = {
        title: data.title,
        body: data.body,
        category: data.category,
        price: data.price
      }

      console.log('Test data:', testData)

      // APIエンドポイント経由でリスティングを作成
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        credentials: 'include', // 認証クッキーを含める
      })

      if (!response.ok) {
        let errorData: any = {}
        let errorText = ''
        try {
          errorText = await response.text()
          console.log('Raw error response:', errorText)
          if (errorText) {
            errorData = JSON.parse(errorText)
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('API Error:', errorData)
        console.error('Response status:', response.status)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Failed to create listing')
      }

      // 作成されたリスティングのIDを取得
      const listingId = result.data?.id
      if (!listingId) {
        throw new Error('Failed to get listing ID')
      }

      // 画像処理はAPIで実行済み

      router.push('/listings')
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
                  <Label className="text-sm font-medium">最寄り駅</Label>
                  <UnifiedLocationSearch
                    onLocationSelect={handleLocationSelect}
                    placeholder="駅名を検索してください"
                    searchTypes={['station']}
                    className="w-full"
                    value={selectedStation}
                  />
                  {selectedStation && selectedStation.type === 'station' && (
                    <div className="text-xs text-gray-600 mt-1">
                      選択中: {selectedStation.data.name_kanji || selectedStation.data.station_name}駅
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