import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AccountForm from './AccountForm';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('account');

  const cookieStore = await cookies();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error fetching user:', userError.message);
      redirect(`/${locale}/login`);
    }

    if (!user) {
      redirect(`/${locale}/login`);
    }

    // Fetch avatar information
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('avatar_path')
      .eq('user_id', user.id)
      .single();

    if (avatarError && avatarError.code !== 'PGRST116') {
      // PGRST116 is a 'not found' error - can be ignored
      console.error('Error fetching avatar:', avatarError.message);
    }

    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-8">{t('settings')}</h1>
        <AccountForm user={user} avatarPath={avatar?.avatar_path ?? null} />
      </div>
    );
  } catch (error) {
    console.error('Unexpected error in AccountPage:', error);
    redirect(`/${locale}/login?error=session_error`);
  }
}
