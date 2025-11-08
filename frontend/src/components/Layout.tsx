import { Link } from 'react-router-dom';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export default function Layout({ children, user }: LayoutProps) {

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Sticky with backdrop blur */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="font-bold text-xl md:text-2xl text-gray-900">HeadShotHub</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary-500 font-medium transition-colors">
                Home
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-primary-500 font-medium transition-colors">
                Pricing
              </Link>
              {user && (
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-500 font-medium transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden lg:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                  <Link
                    to="/upload"
                    className="px-4 md:px-6 py-2 md:py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Create Headshots
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 md:px-6 py-2 md:py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer - Modern Design */}
      <footer className="border-t bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="font-bold text-xl text-gray-900">HeadShotHub</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Professional AI headshots in minutes. No photographer needed.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl">⭐</span>
                <span className="text-2xl">⭐</span>
                <span className="text-2xl">⭐</span>
                <span className="text-2xl">⭐</span>
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">4.9/5 from 10,000+ reviews</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link to="/pricing" className="hover:text-primary-500 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-primary-500 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#examples" className="hover:text-primary-500 transition-colors">
                    Examples
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#about" className="hover:text-primary-500 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-primary-500 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#blog" className="hover:text-primary-500 transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#privacy" className="hover:text-primary-500 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-primary-500 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#refund" className="hover:text-primary-500 transition-colors">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © 2025 HeadShotHub. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>Made with ❤️ for professionals</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
