import { Link } from 'react-router';
import { Fuel, Droplet, Flame, Truck, Building2, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ServicesPage() {
  const services = [
    {
      icon: Fuel,
      title: 'Premium Motor Spirit (PMS)',
      description: 'High-quality petrol that ensures optimal engine performance and fuel efficiency.',
      features: [
        'Meets international quality standards',
        'Available at competitive prices',
        'Consistent supply reliability',
        'Suitable for all vehicle types',
      ],
    },
    {
      icon: Droplet,
      title: 'Automotive Gas Oil (AGO)',
      description: 'Premium diesel fuel for commercial vehicles, generators, and industrial equipment.',
      features: [
        'Low sulfur content',
        'Ideal for heavy-duty applications',
        'Bulk supply available',
        'Certified quality assurance',
      ],
    },
    {
      icon: Flame,
      title: 'Liquefied Petroleum Gas (LPG)',
      description: 'Clean and efficient cooking gas for residential and commercial use.',
      features: [
        'Safe and eco-friendly',
        'Various cylinder sizes available',
        'Affordable pricing',
        'Reliable delivery service',
      ],
    },
    {
      icon: Truck,
      title: 'Bulk Distribution',
      description: 'Large-scale petroleum product delivery for commercial and industrial clients.',
      features: [
        'Fleet of modern tankers',
        'Scheduled and emergency deliveries',
        'Competitive bulk pricing',
        'Professional logistics management',
      ],
    },
    {
      icon: Building2,
      title: 'Retail Services',
      description: 'Customer-friendly retail outlets offering convenient access to petroleum products.',
      features: [
        'Strategic locations nationwide',
        '24/7 service availability',
        'Modern payment options',
        'Loyalty programs',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Quality Assurance',
      description: 'Comprehensive testing and certification to ensure product excellence.',
      features: [
        'Laboratory testing facilities',
        'Compliance with regulations',
        'Regular quality audits',
        'International certifications',
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/assets/hero-services.jpg"
            alt="Person filling car at a petrol station"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-[#0d5c3a]/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto">
            Comprehensive petroleum product solutions tailored to meet your energy needs
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Services */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Services?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We go beyond just supplying petroleum products – we deliver value and peace of mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <h4 className="font-bold mb-2">Round-the-Clock Service</h4>
              <p className="text-gray-600 text-sm">
                Available whenever you need us, day or night
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <h4 className="font-bold mb-2">Quality Guaranteed</h4>
              <p className="text-gray-600 text-sm">
                Every product meets strict quality standards
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">Fast</div>
              <h4 className="font-bold mb-2">Quick Delivery</h4>
              <p className="text-gray-600 text-sm">
                Efficient logistics for timely product delivery
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">Safe</div>
              <h4 className="font-bold mb-2">Safety First</h4>
              <p className="text-gray-600 text-sm">
                Strict safety protocols at every stage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Serve You</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our streamlined process ensures you get the best service experience
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="font-bold mb-2">Contact Us</h4>
              <p className="text-gray-600 text-sm">
                Reach out via phone, email, or visit our office
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="font-bold mb-2">Consultation</h4>
              <p className="text-gray-600 text-sm">
                We assess your needs and recommend solutions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="font-bold mb-2">Order Processing</h4>
              <p className="text-gray-600 text-sm">
                Quick and efficient order confirmation
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h4 className="font-bold mb-2">Delivery</h4>
              <p className="text-gray-600 text-sm">
                Safe and timely product delivery to your location
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience Quality Service?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Get in touch with us today to discuss your petroleum product requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Us Today
            </Link>
            <a
              href="tel:+2348012345678"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary transition-colors"
            >
              Call +234 801 234 5678
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
