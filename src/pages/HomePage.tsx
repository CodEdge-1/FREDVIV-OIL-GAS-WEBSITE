import { Link } from 'react-router';
import { ArrowRight, CheckCircle, Phone, Fuel, Droplet, Flame } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/assets/hero-home.jpg"
            alt="Fuel station"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Quality, Reliability, and Market Leadership
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Fredviv Oil and Gas Limited is your trusted partner in petroleum product supply. We deliver excellence across Nigeria with unmatched quality and service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Us
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="tel:+2348012345678"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Leading Petroleum Supplier in Nigeria
              </h2>
              <p className="text-gray-600 mb-6">
                With years of experience in the oil and gas industry, Fredviv Oil and Gas Limited has established itself as a reliable and quality-focused supplier of petroleum products.
              </p>
              <p className="text-gray-600 mb-8">
                We pride ourselves on delivering consistent quality, maintaining strong industry partnerships, and providing exceptional service to our customers across Nigeria.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
              >
                Learn More About Us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="/assets/home-tanker.png"
                alt="Oil tanker truck"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products & Services Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Products & Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide a comprehensive range of petroleum products to meet your business and personal needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* PMS Card */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Fuel className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Premium Motor Spirit (PMS)</h3>
              <p className="text-gray-600 mb-6">
                High-quality petrol for optimal engine performance. Trusted by thousands of customers nationwide.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* AGO Card */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Droplet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Automotive Gas Oil (AGO)</h3>
              <p className="text-gray-600 mb-6">
                Premium diesel fuel for commercial and industrial applications. Reliable supply and consistent quality.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* LPG Card */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Flame className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Liquefied Petroleum Gas (LPG)</h3>
              <p className="text-gray-600 mb-6">
                Clean and efficient cooking gas for homes and businesses. Safe distribution and competitive pricing.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Fredviv Oil & Gas?</h2>
            <p className="text-green-100 max-w-2xl mx-auto">
              We stand out in the industry through our commitment to excellence and customer satisfaction
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Quality Assurance</h3>
              <p className="text-green-100">
                Strict quality controls ensure you receive only the best petroleum products that meet international standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reliable Supply</h3>
              <p className="text-green-100">
                24/7 operations and strategic partnerships guarantee consistent product availability for your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Operational Excellence</h3>
              <p className="text-green-100">
                Modern facilities, professional staff, and efficient logistics deliver superior service every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Contact us today to discuss your petroleum product needs and experience the Fredviv difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="tel:+2348012345678"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call +234 801 234 5678
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}