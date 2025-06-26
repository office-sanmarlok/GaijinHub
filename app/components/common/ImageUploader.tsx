'use client';

import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export interface UploadedImage {
  id?: string;
  file?: File;
  url: string;
  isRepresentative: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images = [], onChange, maxImages = 5 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = ''; // リセットして同じファイルを再選択可能に
    }
  };

  const addFiles = (files: File[]) => {
    // 最大画像数を超えないように制限
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = files.slice(0, remainingSlots);

    // 既存の画像があるかどうかチェック
    const hasExistingImages = images.length > 0;

    // 既存画像の中に代表画像があるかチェック
    const hasRepresentativeImage = hasExistingImages && images.some((img) => img.isRepresentative);

    // 新しい画像を作成
    const newImages = filesToAdd.map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      // 既存画像がなく、この画像が最初の1枚目（index === 0）の場合のみ代表画像に設定
      isRepresentative: !hasExistingImages && index === 0 && !hasRepresentativeImage,
    }));

    onChange([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];

    // URLオブジェクトをクリーンアップ
    if (removed.file) {
      URL.revokeObjectURL(removed.url);
    }

    // 代表画像が削除された場合、最初の画像を代表画像に設定
    if (removed.isRepresentative && newImages.length > 0) {
      newImages[0].isRepresentative = true;
    }

    onChange(newImages);
  };

  const setAsRepresentative = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isRepresentative: i === index,
    }));
    onChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative w-32 h-32 rounded-md overflow-hidden border-2 ${
              image.isRepresentative ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <Image src={image.url} alt={`Uploaded image ${index + 1}`} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-black/50 p-1 h-auto"
                onClick={() => setAsRepresentative(index)}
                disabled={image.isRepresentative}
              >
                {image.isRepresentative ? '代表画像' : '代表にする'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-black/50 text-red-400 p-1 h-auto"
                onClick={() => removeImage(index)}
              >
                削除
              </Button>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <div
            className={`w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">クリックまたはドロップ</span>
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />

      <div className="text-sm text-gray-500">
        {images.length} / {maxImages} 枚の画像（最大5MB/枚）
      </div>
    </div>
  );
}
