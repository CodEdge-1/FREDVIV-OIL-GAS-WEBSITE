import { Link, useLocation } from 'react-router';
import { Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/assets/logo1.png" 
              alt="Fredviv Oil & Gas Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              Fredviv Oil & Gas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`transition-colors ${
                isActive('/') ? 'text-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`transition-colors ${
                isActive('/about') ? 'text-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/services"
              className={`transition-colors ${
                isActive('/services') ? 'text-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${
                isActive('/contact') ? 'text-primary' : 'text-gray-700 hover:text-primary'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+2348012345678"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
            <Link
              to="/staff/login"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-primary"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 ${
                  isActive('/') ? 'text-primary' : 'text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 ${
                  isActive('/about') ? 'text-primary' : 'text-gray-700'
                }`}
              >
                About Us
              </Link>
              <Link
                to="/services"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 ${
                  isActive('/services') ? 'text-primary' : 'text-gray-700'
                }`}
              >
                Services
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 ${
                  isActive('/contact') ? 'text-primary' : 'text-gray-700'
                }`}
              >
                Contact Us
              </Link>
              <a
                href="tel:+2348012345678"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors justify-center"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
              <Link
                to="/staff/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors text-center"
              >
                Staff Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}