import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="text-xl font-bold text-gray-600">
              🌏 GaijinHub
            </Link>
            <p className="mt-4 text-gray-600">
              Connecting the foreign community in Japan with the services, items, and opportunities they need.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600">Contact Us - Office 306</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span className="text-gray-600">sanmarlok@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2025 GaijinHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
