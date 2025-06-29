import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface LanguageBadgeProps {
  language?: string;
  showDefault?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

const languageMap: Record<string, string> = {
  ja: 'Japanese',
  en: 'English',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ko: 'Korean',
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