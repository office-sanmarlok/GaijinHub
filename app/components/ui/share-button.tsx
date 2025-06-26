'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  url: string;
  title: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function ShareButton({ url, title, size = 'icon', variant = 'outline', className }: ShareButtonProps) {
  const handleShare = async () => {
    const fullUrl = window.location.origin + url;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: fullUrl,
        });
      } catch (error) {
        // User cancelled sharing
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <Button size={size} variant={variant} onClick={handleShare} className={className}>
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
