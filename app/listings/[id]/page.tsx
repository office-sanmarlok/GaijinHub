'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ListingImage {
  id: string
  path: string
  url: string
  order: number
}

export default function ListingPage() {
  const params = useParams()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<any>(null)
  const [images, setImages] = useState<ListingImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // リスティング情報を取得
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()
        
        if (listingError) throw listingError
        if (!listingData) throw new Error('リスティングが見つかりません')
        
        setListing(listingData)
        
        // 画像情報を取得
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .select('*')
          .eq('listing_id', listingId)
          .order('order', { ascending: true })
        
        if (imageError) throw imageError
        
        // 画像URLを生成
        if (imageData && imageData.length > 0) {
          const imagesWithUrls = imageData.map((img) => {
            const { data } = supabase.storage
              .from('listing-images')
              .getPublicUrl(img.path)
            
            return {
              ...img,
              url: data.publicUrl
            }
          })
          
          setImages(imagesWithUrls)
        } else if (listingData.rep_image_url) {
          // rep_image_urlがある場合は単一の画像として表示
          setImages([{
            id: 'main',
            path: '',
            url: listingData.rep_image_url,
            order: 0
          }])
        }
      } catch (err) {
        console.error('リスティング取得エラー:', err)
        setError('リスティングの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  const nextImage = () => {
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-red-500">{error || 'リスティングが見つかりません'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">{listing.title}</CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-gray-500">{listing.category}</p>
            {listing.price && (
              <p className="font-bold text-xl">¥{listing.price.toLocaleString()}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {images.length > 0 && (
            <div className="relative aspect-video overflow-hidden rounded-md">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={images[currentImageIndex].url}
                  alt={listing.title}
                  fill
                  className="object-contain"
                />
              </div>
              {images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          currentImageIndex === index
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="prose max-w-none">
            <h3>説明</h3>
            <p className="whitespace-pre-wrap">{listing.body}</p>
          </div>

          {listing.city && (
            <div>
              <h3 className="font-semibold mb-1">場所</h3>
              <p>{listing.city}</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            投稿日: {new Date(listing.created_at).toLocaleDateString('ja-JP')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 