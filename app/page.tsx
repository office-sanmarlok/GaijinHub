import Hero from '@/components/home/Hero';
import AboutSection from '@/components/home/AboutSection';
import CategoryGrid from '@/components/home/CategoryGrid';

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