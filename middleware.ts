import { type CookieOptions, createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n/config';
import { logger } from '@/lib/utils/logger';

// 保護されたルートの定義
const PROTECTED_ROUTES = [
  '/account',
  '/listings/new',
  // 他の保護されたルートをここに追加
];

// Create the intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // まず、next-intlのミドルウェアを実行
  const intlResult = intlMiddleware(req);
  const isIntlRedirect = intlResult?.headers?.get('location');

  // intlミドルウェアがリダイレクトを返した場合は、それを使用
  if (isIntlRedirect) {
    return intlResult;
  }

  // パスからロケールを取得
  const pathnameLocale = pathname.split('/')[1];
  const isValidLocale = locales.includes(pathnameLocale as any);

  // ロケールが無効な場合は、intlミドルウェアの結果を返す
  if (!isValidLocale) {
    return intlResult || NextResponse.next();
  }

  // Supabase認証のチェック
  const res = intlResult || NextResponse.next();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // ユーザー情報の取得
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.error('User authentication error in middleware:', error.message);
    }

    // セッションの存在確認
    const isAuthenticated = !!user;

    // ロケールを除いたパスを取得
    const pathnameWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/';

    // 保護されたルートの処理
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      // 認証が必要なページへの未認証アクセスをリダイレクト
      const redirectUrl = new URL(`/${pathnameLocale}/login`, req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // ログイン・サインアップページへの認証済みアクセスをリダイレクト
    const isAuthPage = pathnameWithoutLocale === '/login' || pathnameWithoutLocale === '/signup';
    if (isAuthPage && isAuthenticated) {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, req.url));
    }

    return res;
  } catch (error) {
    logger.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Other static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|test-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
