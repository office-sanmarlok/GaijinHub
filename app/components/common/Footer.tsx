import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="text-xl font-bold text-gray-600">
              🌏 GaijinHub
            </Link>
            <p className="mt-4 text-gray-600">
              Connecting the foreign community in Japan with the services, items, and opportunities they need.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                📘
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Twitter</span>
                🐦
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Instagram</span>
                📷
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">YouTube</span>
                📺
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/listings" className="text-gray-600 hover:text-gray-900">Browse Listings</Link></li>
              <li><Link href="/post" className="text-gray-600 hover:text-gray-900">Post an Ad</Link></li>
              <li><Link href="/categories" className="text-gray-600 hover:text-gray-900">Categories</Link></li>
              <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
              <li><Link href="/safety" className="text-gray-600 hover:text-gray-900">Safety Tips</Link></li>
              <li><Link href="/community" className="text-gray-600 hover:text-gray-900">Community Guidelines</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span className="text-gray-600">Shibuya, Tokyo, Japan</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span className="text-gray-600">+81 3-1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span className="text-gray-600">contact@gaijinhub.jp</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2025 GaijinHub. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">
              Privacy
            </Link>
            <Link href="/cookies" className="text-gray-600 hover:text-gray-900 text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 