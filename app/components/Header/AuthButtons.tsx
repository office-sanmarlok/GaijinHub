'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { authItems } from '@/constants/navigation';

export function AuthButtons() {
  const locale = useLocale();
  const t = useTranslations('navigation');

  return (
    <>
      <Link href={`/${locale}${authItems.login.href}`}>
        <Button variant={authItems.login.variant}>{t(authItems.login.labelKey)}</Button>
      </Link>
      <Link href={`/${locale}${authItems.signup.href}`}>
        <Button variant={authItems.signup.variant}>{t(authItems.signup.labelKey)}</Button>
      </Link>
    </>
  );
}