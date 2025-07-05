import { v4 as uuidv4 } from 'uuid';
import type { UploadedImage } from '@/components/common/ImageUploader';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

const BUCKET_NAME = 'listing-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validate image file
export const validateImage = (file: File): boolean => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }

  // Check file type (images only)
  if (!file.type.startsWith('image/')) {
    return false;
  }

  return true;
};

// Get file extension
const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

// Upload image and return path and URL
export const uploadImage = async (
  file: File,
  userId: string,
  listingId: string
): Promise<{ path: string; url: string; id: string }> => {
  // Validate file
  if (!validateImage(file)) {
    throw new Error('Invalid image file');
  }

  const supabase = createClient();
  const imageId = uuidv4();
  const fileExt = getFileExtension(file.name);
  const filePath = `${userId}/${listingId}/${imageId}.${fileExt}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);

  if (error) {
    throw error;
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    path: filePath,
    url: data.publicUrl,
    id: imageId,
  };
};

interface ImageRecord {
  id: string;
  path: string;
  order: number;
  listing_id: string;
}

// Process all listing images and upload
export const processListingImages = async (
  images: UploadedImage[],
  userId: string,
  listingId: string
): Promise<{ repImageUrl: string | null; imageRecords: ImageRecord[] }> => {
  const supabase = createClient();
  const imageRecords: ImageRecord[] = [];
  let repImageUrl: string | null = null;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (image.file) {
      try {
        // Upload the image
        const { path, url, id } = await uploadImage(image.file, userId, listingId);

        // Store the URL for the representative image
        if (image.isRepresentative) {
          repImageUrl = url;
        }

        // Create record for the images table
        imageRecords.push({
          id,
          path,
          order: i,
          listing_id: listingId,
        });
      } catch (error) {
        logger.error('Image upload error:', error);
        throw error;
      }
    }
  }

  // Save records to the images table
  if (imageRecords.length > 0) {
    const { error } = await supabase.from('images').insert(imageRecords);

    if (error) {
      throw error;
    }
  }

  // Update the representative image in the listings table
  if (repImageUrl) {
    const { error } = await supabase.from('listings').update({ rep_image_url: repImageUrl }).eq('id', listingId);

    if (error) {
      throw error;
    }
  }

  return { repImageUrl, imageRecords };
};
