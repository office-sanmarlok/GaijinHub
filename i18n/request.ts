import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  // Explicitly import all message files to ensure they are included in the bundle
  const messages = {
    ja: (await import('../messages/ja.json')).default,
    en: (await import('../messages/en.json')).default,
    'zh-CN': (await import('../messages/zh-CN.json')).default,
    'zh-TW': (await import('../messages/zh-TW.json')).default,
    ko: (await import('../messages/ko.json')).default,
    vi: (await import('../messages/vi.json')).default,
    pt: (await import('../messages/pt.json')).default,
    id: (await import('../messages/id.json')).default,
  };

  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
});
