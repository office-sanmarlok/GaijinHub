'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2 } from 'lucide-react'
import { UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { handleAuthError, handleUnexpectedError } from '@/lib/utils/error-handlers'
import { AuthSessionMissingError } from '@/lib/supabase/client'

const formSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

interface AccountFormProps {
  user: User
  avatarPath: string | null
}

export default function AccountForm({ user, avatarPath }: AccountFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showProfileCheck, setShowProfileCheck] = useState(false)
  const [showAvatarCheck, setShowAvatarCheck] = useState(false)

  // Initialize avatar URL
  useEffect(() => {
    if (avatarPath) {
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarPath)
        setAvatarUrl(publicUrl)
      } catch (error) {
        console.error('Error getting avatar URL:', error)
      }
    }
  }, [avatarPath, supabase])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: user?.user_metadata?.display_name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // チェックマークを表示
    setShowProfileCheck(true)
    
    // 3秒後に非表示
    setTimeout(() => {
      setShowProfileCheck(false)
    }, 3000)
    
    try {
      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }
      
      if (!session) {
        throw new AuthSessionMissingError()
      }
      
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        email: values.email,
        data: { display_name: values.display_name },
      })

      if (error) throw error

      form.reset({
        display_name: updatedUser?.user_metadata?.display_name || '',
        email: updatedUser?.email || '',
      })

      toast.success('アカウント情報が更新されました')
    } catch (error) {
      if (error instanceof AuthSessionMissingError) {
        handleAuthError(error, router)
      } else {
        handleUnexpectedError(error)
      }
    }
  }

  const handleAvatarClick = () => {
    // アバター変更ボタンをクリックしたらチェックマークを表示
    setShowAvatarCheck(true)
    
    // 3秒後に非表示
    setTimeout(() => {
      setShowAvatarCheck(false)
    }, 3000)
    
    // ファイル選択ダイアログを表示
    document.getElementById('avatar-upload')?.click()
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }
      
      if (!session) {
        throw new AuthSessionMissingError()
      }
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      // Check file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif']
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        throw new Error('JPG、PNG、またはGIFファイルをアップロードしてください')
      }

      // Check file size (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        throw new Error('ファイルサイズは1MB未満である必要があります')
      }

      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      // Delete existing avatar if exists
      if (avatarPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([avatarPath])
        
        if (deleteError) {
          console.error('既存のアバター削除エラー:', deleteError)
        }
      }

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('アップロードエラー:', uploadError)
        throw new Error('画像のアップロードに失敗しました')
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update or insert the avatar record
      const { error: dbError } = await supabase
        .from('avatars')
        .upsert({ 
          user_id: user.id, 
          avatar_path: filePath 
        })

      if (dbError) {
        console.error('データベースエラー:', dbError)
        // If database update fails, try to delete the uploaded file
        await supabase.storage.from('avatars').remove([filePath])
        throw new Error('アバター情報の更新に失敗しました')
      }

      setAvatarUrl(publicUrl)
      toast.success('アバターが正常に更新されました')
    } catch (error) {
      if (error instanceof AuthSessionMissingError) {
        handleAuthError(error, router)
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        handleUnexpectedError(error)
      }
    } finally {
      // Reset the file input
      event.target.value = ''
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown';
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <Avatar className="w-24 h-24 border border-border group-hover:opacity-90 transition-opacity">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={user?.user_metadata?.display_name || 'アバター'}
              className="object-cover"
            />
            <AvatarFallback>
              <UserIcon className="w-12 h-12" />
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
            id="avatar-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAvatarClick}
            className="mt-2 w-full text-xs px-2"
          >
            {showAvatarCheck && (
              <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
            )}
            アバターを変更
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>表示名</FormLabel>
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
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center">
            <Button type="submit">
              保存
            </Button>
            {showProfileCheck && (
              <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
            )}
          </div>
        </form>
      </Form>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500">Account Created</p>
        <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
      </div>
    </div>
  )
} 