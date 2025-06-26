'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@supabase/supabase-js';
import { UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthSessionMissingError, createClient } from '@/lib/supabase/client';
import { handleAuthError, handleUnexpectedError } from '@/lib/utils/error-handlers';

const formSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

interface AccountFormProps {
  user: User;
  avatarPath: string | null;
}

export default function AccountForm({ user, avatarPath }: AccountFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showProfileCheck, setShowProfileCheck] = useState(false);

  // Initialize avatar URL
  useEffect(() => {
    if (avatarPath) {
      try {
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
        setAvatarUrl(publicUrl);
      } catch (error) {
        console.error('Error getting avatar URL:', error);
      }
    }
  }, [avatarPath, supabase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: user?.user_metadata?.display_name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Show checkmark
    setShowProfileCheck(true);

    // Hide after 3 seconds
    setTimeout(() => {
      setShowProfileCheck(false);
    }, 3000);

    try {
      // 認証されたユーザー情報を取得
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        throw new AuthSessionMissingError();
      }

      const {
        data: { user: updatedUser },
        error,
      } = await supabase.auth.updateUser({
        email: values.email,
        data: { display_name: values.display_name },
      });

      if (error) throw error;

      form.reset({
        display_name: updatedUser?.user_metadata?.display_name || '',
        email: updatedUser?.email || '',
      });

      toast.success('Account information updated successfully');
    } catch (error) {
      if (error instanceof AuthSessionMissingError) {
        handleAuthError(error, router);
      } else {
        handleUnexpectedError(error);
      }
    }
  };

  const handleAvatarClick = () => {
    // Show file selection dialog
    document.getElementById('avatar-upload')?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // 認証されたユーザー情報を取得
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        throw new AuthSessionMissingError();
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      // Check file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        throw new Error('Please upload a JPG, PNG, or GIF file');
      }

      // Check file size (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be less than 1MB');
      }

      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // Delete existing avatar if exists
      if (avatarPath) {
        const { error: deleteError } = await supabase.storage.from('avatars').remove([avatarPath]);

        if (deleteError) {
          console.error('Error deleting existing avatar:', deleteError);
        }
      }

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update or insert the avatar record
      const { error: dbError } = await supabase.from('avatars').upsert({
        user_id: user.id,
        avatar_path: filePath,
      });

      if (dbError) {
        console.error('Database error:', dbError);
        // If database update fails, try to delete the uploaded file
        await supabase.storage.from('avatars').remove([filePath]);
        throw new Error('Failed to update avatar information');
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully');

      // Refresh the page after successful upload
      router.refresh();
    } catch (error) {
      if (error instanceof AuthSessionMissingError) {
        handleAuthError(error, router);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        handleUnexpectedError(error);
      }
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <Avatar className="w-24 h-24 border border-border group-hover:opacity-90 transition-opacity">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={user?.user_metadata?.display_name || 'Avatar'}
              className="object-cover"
            />
            <AvatarFallback>
              <UserIcon className="w-12 h-12" />
            </AvatarFallback>
          </Avatar>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
          <Button
            type="button"
            variant="outline"
            onClick={handleAvatarClick}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs py-1 h-auto"
          >
            Change
          </Button>
        </div>
        <div>
          <h2 className="text-xl font-bold">
            {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="text-sm text-muted-foreground">Joined: {formatDate(user?.created_at)}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">{showProfileCheck ? 'Updated' : 'Update Profile'}</Button>
        </form>
      </Form>
    </div>
  );
}
