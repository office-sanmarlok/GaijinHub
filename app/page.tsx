import Hero from '@/app/components/home/Hero';
import AboutSection from '@/app/components/home/AboutSection';
import CategoryGrid from '@/app/components/home/CategoryGrid';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Category Grid */}
      <CategoryGrid />
    </main>
  );
} 