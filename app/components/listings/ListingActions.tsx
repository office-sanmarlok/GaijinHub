'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

interface ListingActionsProps {
  listingId: string;
  isOwner: boolean;
  onDelete?: () => void;
}

export function ListingActions({ listingId, isOwner, onDelete }: ListingActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const supabase = createClient();

  const handleEdit = () => {
    router.push(`/listings/${listingId}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast.success(t('listings.deleteSuccess'));
      onDelete?.();
      router.push('/account/my-listings');
    } catch (error) {
      logger.error('Error deleting listing:', error);
      toast.error(t('listings.deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleEdit} variant="outline">
          {t('common.edit')}
        </Button>
        <Button 
          onClick={() => setShowDeleteDialog(true)} 
          variant="destructive"
        >
          {t('common.delete')}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('listings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('listings.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}