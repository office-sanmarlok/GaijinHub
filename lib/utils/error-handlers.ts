import { toast } from 'sonner';
import { AuthSessionMissingError } from '@/lib/supabase/client';

export interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function extractErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'エラーが発生しました。';
}

export function isAuthError(error: unknown): boolean {
  if (!isErrorWithMessage(error)) return false;
  
  // 特定のメッセージパターンに基づいて認証エラーを識別
  const message = error.message.toLowerCase();
  return (
    message.includes('auth') ||
    message.includes('session') ||
    message.includes('token') ||
    message.includes('jwt') ||
    error instanceof AuthSessionMissingError
  );
}

export const handleAuthError = (error: unknown, router: any) => {
  console.error('Auth error:', error);
  
  // ユーザーが既にログインページにいる場合は通知しない
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return;
  }
  
  if (error instanceof AuthSessionMissingError) {
    // 保護されたルートでのみリダイレクトする
    const protectedRoutes = ['/account', '/listings/new'];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
    
    if (isProtectedRoute) {
      toast.error('このページにアクセスするにはログインが必要です。');
      router.push('/login');
    }
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  
  // 一般的な認証エラーかどうかを判断
  if (isAuthError(error)) {
    toast.error(`認証エラー: ${errorMessage}`);
  } else {
    // 認証以外のエラーは一般的なエラーとして扱う
    toast.error(errorMessage);
  }
};

export const handleApiError = (error: unknown) => {
  console.error('API error:', error);
  
  if (isAuthError(error)) {
    const errorMessage = extractErrorMessage(error);
    toast.error(`認証エラー: ${errorMessage}`);
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  toast.error(`APIエラー: ${errorMessage}`);
};

export const handleUnexpectedError = (error: unknown) => {
  console.error('Unexpected error:', error);
  
  if (isAuthError(error)) {
    handleAuthError(error, null);
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  toast.error(`予期しないエラーが発生しました: ${errorMessage}`);
}; 