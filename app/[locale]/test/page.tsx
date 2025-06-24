import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function TestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p>This is a test page to verify i18n is working correctly.</p>
      </div>
    </div>
  );
}