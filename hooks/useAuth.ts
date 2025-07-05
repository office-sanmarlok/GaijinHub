import { useSupabase } from '@/providers/supabase-provider';
import { useUserQuery } from './useUserQuery';

export function useAuth() {
  const { signOut } = useSupabase();
  const { data: userDetails, isLoading, error } = useUserQuery();

  return {
    user: userDetails?.user ?? null,
    isLoading,
    displayName: userDetails?.displayName ?? '',
    avatarUrl: userDetails?.avatarUrl ?? null,
    signOut,
    error,
  };
}