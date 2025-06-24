'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames } from '../../../i18n/config';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Remove current locale from pathname
    const segments = pathname.split('/');
    const currentLocaleIndex = segments.findIndex(segment => locales.includes(segment as any));
    
    if (currentLocaleIndex !== -1) {
      segments[currentLocaleIndex] = newLocale;
    } else {
      // If no locale in path, prepend it
      segments.unshift(newLocale);
    }
    
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[180px]">
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue placeholder={t('footer.languageSelector')} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}