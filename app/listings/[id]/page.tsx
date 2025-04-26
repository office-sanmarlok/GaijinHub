'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface ListingImage {
  id: string
  path: string
  url: string
  order: number
}

interface User {
  id: string
  email: string
  display_name?: string
}

interface ListingData {
  id: string
  title: string
  body: string
  price: number
  category: string
  city: string
  created_at: string
  rep_image_url: string | null
  user_id: string
}

export default function ListingPage() {
  const params = useParams()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<ListingData | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [images, setImages] = useState<ListingImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Fetch listing information
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()
        
        if (listingError) throw listingError
        if (!listingData) throw new Error('Listing not found')
        
        setListing(listingData)
        
        // Fetch owner's user information (using RPC function)
        if (listingData.user_id) {
          const { data: userData, error: userError } = await supabase
            .rpc('get_auth_user', { user_id: listingData.user_id })
          
          if (!userError && userData) {
            setUserData(userData)
          } else {
            console.error('Error fetching user data:', userError)
          }
          
          // Fetch avatar path (using RPC function)
          const { data: avatarPath, error: avatarError } = await supabase
            .rpc('get_avatar_url', { user_id: listingData.user_id })
          
          if (!avatarError && avatarPath) {
            console.log('Retrieved avatar path:', avatarPath)
            
            // Generate URL from path
            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(avatarPath)
            
            console.log('Generated avatar URL:', data.publicUrl)
            setAvatarUrl(data.publicUrl)
          } else {
            console.error('Error fetching avatar path:', avatarError)
          }
        }
        
        // Fetch image information
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .select('*')
          .eq('listing_id', listingId)
          .order('order', { ascending: true })
        
        if (imageError) throw imageError
        
        // Generate image URLs
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
          // If rep_image_url exists, display as a single image
          setImages([{
            id: 'main',
            path: '',
            url: listingData.rep_image_url,
            order: 0
          }])
        }
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to load the listing')
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

  const handleCopyEmail = async () => {
    if (userData?.email) {
      try {
        await navigator.clipboard.writeText(userData.email);
        setCopied(true);
        
        // Display in console
        console.log('Email address copied:', userData.email);
        
        // Reset copy state after 3 seconds
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert(`Email address: ${userData.email}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-red-500">{error || 'Listing not found'}</div>
      </div>
    )
  }

  // Get user's display name
  const displayName = userData?.display_name || 'User'

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{listing.title}</CardTitle>
              <p className="text-gray-500">{listing.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton 
                listingId={listingId}
                showCount
                size="lg"
              />
              {listing.price && (
                <p className="font-bold text-xl">¥{listing.price.toLocaleString()}</p>
              )}
            </div>
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
            <h3 className="font-semibold mb-1">Description</h3>
            <p className="whitespace-pre-wrap">{listing.body}</p>
          </div>

          {listing.city && (
            <div>
              <h3 className="font-semibold mb-1">Location</h3>
              <p>{listing.city}</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Posted on: {new Date(listing.created_at).toLocaleDateString('en-US')}
          </div>

          <Separator className="my-4" />

          {/* Owner information */}
          {userData && (
            <div>
              <h3 className="font-semibold mb-3">Owner</h3>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : (
                    <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{displayName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Copy email button */}
          {userData?.email && (
            <div className="pt-4">
              <Button 
                onClick={handleCopyEmail}
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Email address copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy email address
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 