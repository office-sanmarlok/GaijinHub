import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 保護されたルートの定義
const PROTECTED_ROUTES = [
  '/account',
  '/listings/new',
  // 他の保護されたルートをここに追加
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
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

    // セッションの取得とエラーハンドリング
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error in middleware:', error.message);
    }

    // 保護されたルートの処理
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !session) {
      // 認証が必要なページへの未認証アクセスをリダイレクト
      const redirectUrl = new URL('/login', req.url);
      // フルパスURLをエンコードしてクエリパラメータとして保存
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // ログイン・サインアップページへの認証済みアクセスをリダイレクト
    const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup';
    if (isAuthPage && session) {
      // すでに認証済みの場合はホームページにリダイレクト
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // エラーが発生した場合でもアプリケーションが機能し続けるように
    // 基本的なレスポンスを返す
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 