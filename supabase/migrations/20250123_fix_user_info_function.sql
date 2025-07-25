-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_public_info(UUID);

-- Recreate function with TEXT parameter to match TypeScript types
CREATE OR REPLACE FUNCTION public.get_user_public_info(p_user_id TEXT)
RETURNS TABLE(
  id TEXT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::TEXT as id,
    u.email::TEXT as email,
    COALESCE(u.raw_user_meta_data->>'display_name', '')::TEXT as display_name,
    COALESCE(a.avatar_path, '')::TEXT as avatar_url
  FROM auth.users u
  LEFT JOIN public.avatars a ON a.user_id = u.id::TEXT
  WHERE u.id = p_user_id::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_public_info(TEXT) TO authenticated;