import { locales } from './config';

export function getPathWithLocale(path: string, locale: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if path already includes a locale
  const segments = cleanPath.split('/');
  const firstSegment = segments[0];
  
  if (locales.includes(firstSegment as any)) {
    // Replace existing locale
    segments[0] = locale;
    return `/${segments.join('/')}`;
  } else {
    // Add locale to beginning
    return `/${locale}/${cleanPath}`;
  }
}

export function removeLocaleFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (locales.includes(firstSegment as any)) {
    segments.shift();
  }
  
  return `/${segments.join('/')}`;
}