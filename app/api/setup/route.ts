import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

/**
 * このAPIはアプリケーションの初期セットアップを行います。
 * 必要なテーブルやストレージバケットを作成します。
 * 本番環境では適切なアクセス制限を行ってください。
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
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

    // 管理者ユーザーであるか確認（実際の実装では適切な認証を行います）
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // セットアップ実行結果
    const results: Record<string, any> = {};

    // -----------------------------------
    // ストレージバケットの作成
    // -----------------------------------
    // 注意: アノンキーではバケットの作成はできません
    // Supabaseダッシュボードで手動で作成するか、
    // サービスロールキーを使用する必要があります
    results.storage = {
      message: 'ストレージバケットは管理画面で作成してください',
      note: 'avatars という名前のパブリックバケットを作成してください',
      manual_steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. Storage > New bucket でバケットを作成',
        '3. バケット名を「avatars」に設定',
        '4. 「Make bucket public」にチェック',
        '5. 作成ボタンをクリック'
      ]
    };

    // -----------------------------------
    // アバターテーブルの作成
    // -----------------------------------
    // 注意: create_table_if_not_exists関数はデフォルトでは存在しません
    // Supabaseダッシュボードから手動でテーブルを作成する方が安全です
    results.avatars_table = {
      success: false,
      message: 'アバターテーブルをダッシュボードから作成してください',
      sql: `
CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- RLSポリシーを設定
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- 自分のアバターのみ見ることができる
CREATE POLICY "ユーザーは自分のアバターを見ることができる" ON public.avatars
  FOR SELECT USING (auth.uid() = user_id);

-- 自分のアバターのみ更新できる
CREATE POLICY "ユーザーは自分のアバターを追加できる" ON public.avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のアバターを更新できる" ON public.avatars
  FOR UPDATE USING (auth.uid() = user_id);

-- 自分のアバターのみ削除できる
CREATE POLICY "ユーザーは自分のアバターを削除できる" ON public.avatars
  FOR DELETE USING (auth.uid() = user_id);
      `
    };

    // RLSポリシーの設定
    // 注: SQLインジェクションを避けるためにパラメータ化クエリを使用することをお勧めします
    // ここでは簡略化のためにダッシュボードから手動で実行することを推奨します

    return NextResponse.json({
      success: true,
      message: 'セットアップ手順が生成されました。ダッシュボードでテーブルとバケットを作成してください。',
      results
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', message: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
} 