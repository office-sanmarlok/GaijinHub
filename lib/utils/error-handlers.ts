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
  return 'An error occurred.';
}

export function isAuthError(error: unknown): boolean {
  if (!isErrorWithMessage(error)) return false;
  
  // Identify auth errors based on specific message patterns
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
  
  // Don't notify if user is already on login page
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return;
  }
  
  if (error instanceof AuthSessionMissingError) {
    // Only redirect on protected routes
    const protectedRoutes = ['/account', '/listings/new'];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
    
    if (isProtectedRoute) {
      toast.error('You must be logged in to access this page.');
      router.push('/login');
    }
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  
  // Determine if it's a general auth error
  if (isAuthError(error)) {
    toast.error(`Authentication error: ${errorMessage}`);
  } else {
    // Treat non-auth errors as general errors
    toast.error(errorMessage);
  }
};

export const handleApiError = (error: unknown) => {
  console.error('API error:', error);
  
  if (isAuthError(error)) {
    const errorMessage = extractErrorMessage(error);
    toast.error(`Authentication error: ${errorMessage}`);
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  toast.error(`API error: ${errorMessage}`);
};

export const handleUnexpectedError = (error: unknown) => {
  console.error('Unexpected error:', error);
  
  if (isAuthError(error)) {
    handleAuthError(error, null);
    return;
  }
  
  const errorMessage = extractErrorMessage(error);
  toast.error(`An unexpected error occurred: ${errorMessage}`);
}; 