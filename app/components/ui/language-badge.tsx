import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface LanguageBadgeProps {
  language?: string;
  showDefault?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

const languageMap: Record<string, string> = {
  ja: '日本語',
  en: 'EN',
  'zh-CN': '中文(简)',
  'zh-TW': '中文(繁)',
  ko: '한국어',
};

export function LanguageBadge({ 
  language, 
  showDefault = false,
  variant = 'secondary',
  className = ''
}: LanguageBadgeProps) {
  const t = useTranslations('common');

  if (!language || (!showDefault && language === 'ja')) {
    return null;
  }

  const displayName = languageMap[language] || language.toUpperCase();

  return (
    <Badge 
      variant={variant} 
      className={`text-xs font-medium ${className}`}
      title={t('originalLanguage', { language: displayName })}
    >
      {displayName}
    </Badge>
  );
}