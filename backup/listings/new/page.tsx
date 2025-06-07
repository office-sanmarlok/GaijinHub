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
import { ImageUploader, UploadedImage } from '@/components/common/ImageUploader'
import { processListingImages } from '@/lib/utils/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { LocationSelectionForm } from '@/app/components/listings/LocationSelectionForm'

const categories = [
  'Housing',
  'Jobs',
  'Items for Sale',
  'Services',
] as const

interface LocationData {
  hasLocation: boolean;
  isCityOnly: boolean;
  prefectureId?: string;
  prefectureName?: string;
  municipalityId?: string;
  municipalityName?: string;
  stationCode?: string;
  stationName?: string;
  lineCode?: string;
  lineName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  userProvidedLocation?: string;
}

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData>({
    hasLocation: false,
    isCityOnly: false,
  })

  const handleImageChange = (newImages: UploadedImage[]) => {
    setImages(newImages)
    setImageError(null)
  }

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation)
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
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Authentication required')

      // 新しいスキーマに対応したリスティングデータ
      const listingData: any = {
        ...data,
        user_id: user.id,
        has_location: location.hasLocation,
        is_city_only: location.isCityOnly,
      }

      // 位置情報の設定 - 新しいスキーマのフィールド名を使用
      if (location.hasLocation) {
        if (location.municipalityId) {
          listingData.muni_id = location.municipalityId; // 新スキーマのフィールド名
        }
        if (location.stationCode) {
          listingData.station_id = location.stationCode; // station_idは正しい
        }
        if (location.lat && location.lng) {
          listingData.lat = location.lat;
          listingData.lng = location.lng;
        }
      }

      console.log('Listing data to insert:', listingData);

      // リスティングをデータベースに保存
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert(listingData)
        .select()

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // 作成されたリスティングのIDを取得
      if (!listing || listing.length === 0) {
        throw new Error('Failed to create listing')
      }

      const listingId = listing[0].id

      // 画像がある場合は処理
      if (images.length > 0) {
        try {
          await processListingImages(images, user.id, listingId)
        } catch (imgError) {
          console.error('Image processing error:', imgError)
          setImageError('Image upload failed. You can add images later from your account page.')
          // 画像エラーがあってもリスティング作成は続行
        }
      }

      router.push('/listings')
    } catch (err) {
      console.error('Submission error:', err);
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <LocationSelectionForm 
                value={location}
                onChange={handleLocationChange}
                required={false}
              />
              <p className="text-xs text-gray-500">
                駅を選択すると、自動的に所在地の市区町村も設定されます。「市区町村のみ公開」にチェックを入れると、詳細な駅名は非公開になります。
              </p>
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Listing
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
