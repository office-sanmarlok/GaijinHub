import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/client'
import { UploadedImage } from '@/app/components/common/ImageUploader'

const BUCKET_NAME = 'listing-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// 画像ファイルの検証
export const validateImage = (file: File): boolean => {
  // ファイルサイズのチェック
  if (file.size > MAX_FILE_SIZE) {
    return false
  }
  
  // ファイルタイプのチェック (画像のみ)
  if (!file.type.startsWith('image/')) {
    return false
  }
  
  return true
}

// 拡張子を取得
const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// 画像をアップロードしてパスとURLを返す
export const uploadImage = async (
  file: File,
  userId: string,
  listingId: string
): Promise<{ path: string; url: string; id: string }> => {
  // ファイルの検証
  if (!validateImage(file)) {
    throw new Error('Invalid image file')
  }
  
  const supabase = createClient()
  const imageId = uuidv4()
  const fileExt = getFileExtension(file.name)
  const filePath = `${userId}/${listingId}/${imageId}.${fileExt}`
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file)
    
  if (error) {
    throw error
  }
  
  // 公開URLを取得
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
    
  return {
    path: filePath,
    url: data.publicUrl,
    id: imageId
  }
}

// 複数の画像を処理してアップロード
export const processListingImages = async (
  images: UploadedImage[],
  userId: string,
  listingId: string
) => {
  const supabase = createClient()
  const uploadPromises: Promise<any>[] = []
  const imageRecords: any[] = []
  let repImageUrl: string | null = null
  
  // 代表画像を探す
  const representativeImage = images.find(img => img.isRepresentative)
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    if (image.file) {
      try {
        // 画像をアップロード
        const { path, url, id } = await uploadImage(image.file, userId, listingId)
        
        // 代表画像のURLを保存
        if (image.isRepresentative) {
          repImageUrl = url
        }
        
        // imagesテーブルに保存するためのレコードを作成
        imageRecords.push({
          id,
          path,
          order: i,
          listing_id: listingId
        })
      } catch (error) {
        console.error('画像アップロードエラー:', error)
        throw error
      }
    }
  }
  
  // imagesテーブルにレコードを保存
  if (imageRecords.length > 0) {
    const { error } = await supabase.from('images').insert(imageRecords)
    
    if (error) {
      throw error
    }
  }
  
  // 代表画像をlistingsテーブルに更新
  if (repImageUrl) {
    const { error } = await supabase
      .from('listings')
      .update({ rep_image_url: repImageUrl })
      .eq('id', listingId)
      
    if (error) {
      throw error
    }
  }
  
  return { repImageUrl, imageRecords }
} 