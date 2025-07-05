import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { User } from '@supabase/supabase-js';

interface UserDetails {
  user: User | null;
  displayName: string;
  avatarUrl: string | null;
}

export function useUserQuery() {
  const supabase = createClient();

  return useQuery<UserDetails, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        logger.error('Error fetching user:', authError);
        throw authError;
      }

      if (!user) {
        return {
          user: null,
          displayName: '',
          avatarUrl: null,
        };
      }

      const displayName = user.user_metadata?.display_name || '';
      
      try {
        const { data: avatarUrl, error: avatarError } = await supabase.rpc('get_avatar_url', { 
          user_id: user.id 
        });

        if (avatarError) {
          logger.error('Error fetching avatar URL:', avatarError);
          return {
            user,
            displayName,
            avatarUrl: null,
          };
        }

        return {
          user,
          displayName,
          avatarUrl,
        };
      } catch (error) {
        logger.error('Error fetching user details:', error);
        return {
          user,
          displayName,
          avatarUrl: null,
        };
      }
    },
    // 3分間キャッシュ
    staleTime: 3 * 60 * 1000,
    // 10分間メモリに保持
    gcTime: 10 * 60 * 1000,
  });
}