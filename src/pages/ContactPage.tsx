import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent!', {
      description: 'Thank you for contacting us. We will get back to you shortly.',
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/assets/hero-contact.jpg"
            alt="Fuel pump nozzles at a filling station"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-[#0d5c3a]/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto">
            Get in touch with us for inquiries, orders, or support. We're here to help.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Phone</h3>
              <a
                href="tel:+2348012345678"
                className="text-gray-600 hover:text-primary transition-colors text-sm"
              >
                +234 801 234 5678
              </a>
              <br />
              <a
                href="tel:+2349087654321"
                className="text-gray-600 hover:text-primary transition-colors text-sm"
              >
                +234 908 765 4321
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Email</h3>
              <a
                href="mailto:info@fredvivoil.com"
                className="text-gray-600 hover:text-primary transition-colors text-sm"
              >
                info@fredvivoil.com
              </a>
              <br />
              <a
                href="mailto:sales@fredvivoil.com"
                className="text-gray-600 hover:text-primary transition-colors text-sm"
              >
                sales@fredvivoil.com
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Office Address</h3>
              <p className="text-gray-600 text-sm">
                123 Industrial Avenue,<br />
                Victoria Island,<br />
                Lagos, Nigeria
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Business Hours</h3>
              <p className="text-gray-600 text-sm">
                Mon - Fri: 8:00 AM - 6:00 PM<br />
                Sat: 9:00 AM - 4:00 PM<br />
                Sun: Closed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="pms">PMS Supply</option>
                    <option value="ago">AGO Supply</option>
                    <option value="lpg">LPG Distribution</option>
                    <option value="bulk">Bulk Order</option>
                    <option value="support">Customer Support</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Visit Our Office</h2>
                <p className="text-gray-600 mb-6">
                  We welcome you to visit our office during business hours. Our team is ready to assist you with your petroleum product needs.
                </p>

                {/* Map Placeholder */}
                <div className="bg-gray-200 rounded-xl overflow-hidden h-[300px] flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      123 Industrial Avenue<br />
                      Victoria Island, Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="font-bold text-lg mb-4">Emergency Hotline</h3>
                <p className="text-gray-600 mb-4">
                  For urgent inquiries or emergency orders, call our 24/7 hotline:
                </p>
                <a
                  href="tel:+2348012345678"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +234 801 234 5678
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prefer to Talk Directly?</h2>
          <p className="text-gray-600 mb-8">
            Our customer service team is ready to answer your questions and help you place orders
          </p>
          <a
            href="tel:+2348012345678"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call Us Now
          </a>
        </div>
      </section>
    </div>
  );
}
