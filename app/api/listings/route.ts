import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// エラータイプの区別のための関数
const handleError = (error: any) => {
  // 認証関連のエラーかどうか判断
  const isAuthError = 
    error.message?.includes('auth') || 
    error.message?.includes('session') || 
    error.message?.includes('JWT') ||
    error.message?.includes('token') ||
    error.code === 401;

  if (isAuthError) {
    return new NextResponse('認証エラー: ' + error.message, { status: 401 });
  }

  // その他のエラー
  console.error('API エラー:', error);
  return new NextResponse('サーバーエラー: ' + error.message, { status: 500 });
};

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const cookieStore = cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    // 特定の認証エラーの処理
    if (userError) {
      console.error('認証エラー:', userError.message);
      return new NextResponse('認証エラー: ' + userError.message, { status: 401 });
    }

    if (!user) {
      return new NextResponse('未認証: ログインが必要です', { status: 401 })
    }

    const { error: insertError } = await supabase.from('listings').insert({
      ...json,
      user_id: user.id,
    })

    if (insertError) {
      console.error('データベースエラー:', insertError);
      return new NextResponse('データベースエラー: ' + insertError.message, { status: 500 });
    }

    return new NextResponse(null, { status: 201 })
  } catch (error: any) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    let query = supabase.from('listings').select('*')

    if (category) {
      query = query.eq('category', category)
    }
    if (city) {
      query = query.eq('city', city)
    }
    if (minPrice) {
      query = query.gte('price', minPrice)
    }
    if (maxPrice) {
      query = query.lte('price', maxPrice)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('データ取得エラー:', error);
      return new NextResponse('データ取得エラー: ' + error.message, { status: 500 });
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return handleError(error);
  }
} 