import { type Locale } from '@/i18n/config';

/**
 * 日付をロケールに応じてフォーマット
 */
export function formatDate(date: string | Date, locale: Locale = 'ja'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * 相対時間をフォーマット (例: "3日前", "2 hours ago")
 */
export function formatRelativeTime(date: string | Date, locale: Locale = 'ja'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  // 時間の単位と閾値を定義
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  
  for (const [unit, seconds] of units) {
    const diff = Math.floor(diffInSeconds / seconds);
    if (Math.abs(diff) >= 1) {
      return rtf.format(-diff, unit);
    }
  }
  
  return rtf.format(0, 'second');
}

/**
 * 価格をロケールに応じてフォーマット
 */
export function formatPrice(
  price: number, 
  currency: string = 'JPY', 
  locale: Locale = 'ja'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * 数値を3桁区切りでフォーマット
 */
export function formatNumber(num: number, locale: Locale = 'ja'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * 距離をフォーマット (メートル単位)
 */
export function formatDistance(meters: number, locale: Locale = 'ja'): string {
  if (meters < 1000) {
    return locale === 'ja' ? `${meters}m` : `${meters}m`;
  }
  
  const km = (meters / 1000).toFixed(1);
  return locale === 'ja' ? `${km}km` : `${km}km`;
}

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number, locale: Locale = 'ja'): string {
  const units = locale === 'ja' ? ['B', 'KB', 'MB', 'GB'] : ['B', 'KB', 'MB', 'GB'];
  
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 電話番号をフォーマット (日本の番号向け)
 */
export function formatPhoneNumber(phone: string): string {
  // ハイフンやスペースを削除
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // 日本の電話番号パターン
  if (cleaned.match(/^0\d{9,10}$/)) {
    if (cleaned.length === 10) {
      // 03-1234-5678 形式
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      // 090-1234-5678 形式
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
  }
  
  return phone;
}

/**
 * メールアドレスの一部を隠す
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
  const masked = localPart.slice(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
}